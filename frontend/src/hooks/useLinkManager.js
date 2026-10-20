// ─── useLinkManager.js ───────────────────────────────────────────────────────
// Ye hook saari Supabase database logic handle karta hai.
// App.jsx mein yahi sabse complex hissa tha — ab ye yahan alag file mein hai.
//
// Schema (links table):
//   id, created_at, original_url, short_code, campaign, click_limit,
//   clicks_count, expires_at, is_disabled, visitor_id*, password_hash*
//   (* added via supabase_migration.sql)
//
// Schema (clicks table):
//   id, created_at, link_id, user_agent, device_type, is_ghost, is_bot,
//   source_platform, traffic_class, validation_reasons, counted
//
// Ye hook kya karta hai:
//   1. VISITOR ID generate/retrieve karta hai (localStorage se)
//   2. Links fetch karta hai Supabase se (sirf is visitor ke)
//   3. Naya link create karne ka function (handleGenerate)
//   4. Link copy / disable / delete functions
//   5. Redirect check — agar URL mein koi slug hai to redirect karta hai
//      + clicks table mein analytics row insert karta hai

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "../supabase"

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")
}

function classifyVisitor(userAgent, referrer) {
  const normalizedAgent = userAgent.toLowerCase()
  const botPattern = /bot|crawler|spider|slurp|facebookexternalhit|facebot|whatsapp|telegrambot|discordbot|skypeuripreview|linkedinbot|pinterest|slackbot|twitterbot|google-inspectiontool|bingpreview|headlesschrome|prerender/i
  const automationSignals = [
    navigator.webdriver ? "webdriver" : null,
    /HeadlessChrome|PhantomJS|Electron/i.test(userAgent) ? "headless_runtime" : null,
    "domAutomation" in window || "_Selenium_IDE_Recorder" in window ? "automation_global" : null,
    navigator.languages?.length === 0 ? "missing_languages" : null,
    navigator.plugins?.length === 0 && !/Mobi|Android|iPhone|iPad/i.test(userAgent) ? "missing_plugins" : null,
  ].filter(Boolean)
  const agentSignal = normalizedAgent.match(botPattern)?.[0]
  const isBot = Boolean(agentSignal || automationSignals.length)
  const sourceText = `${referrer} ${userAgent}`.toLowerCase()
  const source = sourceText.includes("whatsapp") ? "WhatsApp"
    : sourceText.includes("telegram") ? "Telegram"
      : sourceText.includes("discord") ? "Discord"
        : sourceText.includes("facebook") || sourceText.includes("instagram") ? "Meta"
          : sourceText.includes("linkedin") ? "LinkedIn"
            : sourceText.includes("pinterest") ? "Pinterest"
              : sourceText.includes("slack") ? "Slack"
                : referrer ? "Referral" : "Direct"
  const previewSource = ["WhatsApp", "Telegram", "Discord", "Meta", "LinkedIn", "Pinterest", "Slack"].includes(source)

  return {
    isBot,
    botReason: isBot ? (agentSignal || automationSignals.join(", ")) : null,
    source,
    trafficClass: isBot ? (previewSource ? "preview" : "bot") : "verified",
    validationReasons: [
      "link_found",
      "status_active",
      "not_expired",
      "within_click_limit",
      isBot ? `automation:${agentSignal || automationSignals.join(",")}` : "browser_signal_clear",
      "destination_allowed",
    ],
  }
}

export function useLinkManager() {
  // ── Form state ────────────────────────────────────────────────────────────
  const [longUrl, setLongUrl] = useState("")
  const [alias, setAlias] = useState("")
  const [aliasError, setAliasError] = useState("")
  const [passwordProtected, setPasswordProtected] = useState(false)
  const [password, setPassword] = useState("")
  const [expiresAt, setExpiresAt] = useState("")      // ISO date string or ""
  const [clickLimit, setClickLimit] = useState("")    // numeric string or ""
  const [isBurnEnabled, setIsBurnEnabled] = useState(false)

  // ── Data state ────────────────────────────────────────────────────────────
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [copied, setCopied] = useState(null)
  const [createdModal, setCreatedModal] = useState(null)
  // passwordState drives the password gate UI in RedirectLoader
  // null = not needed; { resolve, error } = waiting for user input
  const [passwordState, setPasswordState] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [redirectError, setRedirectError] = useState("")

  // tableRef = links table DOM reference (modal "view in table" button ke liye)
  const tableRef = useRef(null)
  const processedRedirectSlugRef = useRef(null)

  // ── Visitor ID ────────────────────────────────────────────────────────────
  // localStorage mein store hone wala unique browser ID.
  // visitor_id column migration se add hua hai (supabase_migration.sql).
  // useRef se ye sirf mount pe once run hoga — useMemo ke andar impure calls
  // (Math.random, Date.now) ESLint rule react-hooks/purity violate karte hain,
  // isliye ye logic ref mein move kiya.
  const visitorIdRef = useRef(null)
  if (visitorIdRef.current === null) {
    let id = null
    try {
      id = localStorage.getItem("linkpulse_visitor_id")
    } catch (error) {
      console.warn("Visitor ID storage is unavailable:", error.message)
    }
    if (!id) {
      // eslint-disable-next-line react-hooks/purity
      id = "usr_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
      try {
        localStorage.setItem("linkpulse_visitor_id", id)
      } catch (error) {
        console.warn("Visitor ID could not be saved:", error.message)
      }
    }
    visitorIdRef.current = id
  }
  const visitorId = visitorIdRef.current

  // ── Derived values ────────────────────────────────────────────────────────
  const totalClicks = useMemo(
    () => links.reduce((sum, link) => sum + (Number(link.clicks_count) || 0), 0),
    [links]
  )
  const activeLinksCount = useMemo(
    () => links.filter(link => !link.is_disabled
      && (link.click_limit === null || link.click_limit === undefined
        || (Number(link.clicks_count) || 0) < Number(link.click_limit))).length,
    [links]
  )

  // ── Redirect check — page load pe ─────────────────────────────────────────
  // Agar URL mein koi slug hai (jaise /abc123) to redirect mode mein jaao.
  // Analytics ke liye clicks table mein ek row bhi insert karo.
  useEffect(() => {
    const slug = window.location.pathname.replace(/^\/+/, "").trim()
    if (!slug || slug === "analytics") return
    if (processedRedirectSlugRef.current === slug) return
    processedRedirectSlugRef.current = slug

    setRedirecting(true)

    async function processRedirect() {
      // Slug se link dhundo
      const { data, error } = await supabase
        .from("links")
        .select("id, original_url, clicks_count, is_disabled, password_hash, expires_at, click_limit")
        .eq("short_code", slug)
        .single()

      if (error || !data) {
        if (error && error.code !== "PGRST116") {
          console.error("Link lookup error:", error)
          setRedirectError("We could not open this link right now. Please try again.")
          setRedirecting(false)
          return
        }
        setRedirectError("This link could not be found or has expired.")
        setRedirecting(false)
        return
      }

      if (data.is_disabled) {
        setRedirectError("This link has been disabled by its owner.")
        setRedirecting(false)
        return
      }

      // Expiry check
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setRedirectError("This link has expired.")
        setRedirecting(false)
        return
      }

      // Click limit check
      if (data.click_limit !== null && data.click_limit !== undefined) {
        if ((data.clicks_count || 0) >= data.click_limit) {
          setRedirectError(Number(data.click_limit) === 1
            ? "This one-time link has already been used."
            : "This link has reached its maximum click limit.")
          setRedirecting(false)
          return
        }
      }

      // Password check — show the React password gate UI instead of window.prompt
      const hasPassword = Boolean(data.password_hash && data.password_hash.trim().length > 0)
      if (hasPassword) {
        // Ask for password via React state — returns what the user typed
        const entered = await new Promise((resolve) => {
          setPasswordState({ onSubmit: resolve, error: "" })
        })

        // If they submitted an empty string, treat as cancelled
        if (!entered || entered.trim() === "") {
          setPasswordState(null)
          setRedirecting(false)
          return
        }

        const enteredHash = await hashPassword(entered.trim())
        if (enteredHash !== data.password_hash.trim()) {
          // Wrong password — show error in the gate and ask again
          const retry = await new Promise((resolve) => {
            setPasswordState({ onSubmit: resolve, error: "Incorrect password. Try again." })
          })
          if (!retry || (await hashPassword(retry.trim())) !== data.password_hash.trim()) {
            setPasswordState(null)
            setRedirectError("The password was incorrect.")
            setRedirecting(false)
            return
          }
        }
        // Correct — hide the gate and proceed
        setPasswordState(null)
      }

      // Analytics: clicks table mein row insert karo (device_type, user_agent capture)
      const ua = navigator.userAgent
      const deviceType = /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop"
      const visitorClassification = classifyVisitor(ua, document.referrer)
      const ghostKey = `linkpulse_last_click_${data.id}`
      let previousClick = 0
      try {
        previousClick = Number(localStorage.getItem(ghostKey) || 0)
      } catch (error) {
        console.warn("Repeat-visit storage is unavailable:", error.message)
      }
      const clickTime = Date.now()
      const isGhost = clickTime - previousClick < 1500
      const geometrySignal = window.outerWidth === 0 || window.outerHeight === 0 || window.innerWidth === 0
      if (geometrySignal && !visitorClassification.isBot) {
        visitorClassification.isBot = true
        visitorClassification.trafficClass = "bot"
        visitorClassification.botReason = "browser_geometry"
        visitorClassification.validationReasons[4] = "automation:browser_geometry"
      }

      const { data: clickResult, error: clickError } = await supabase.rpc("record_click_event", {
        p_link_id: data.id,
        p_user_agent: ua.substring(0, 255),
        p_device_type: deviceType,
        p_is_ghost: isGhost,
        p_is_bot: visitorClassification.isBot,
        p_bot_reason: visitorClassification.botReason,
        p_source_platform: visitorClassification.source,
        p_traffic_class: visitorClassification.trafficClass,
        p_validation_reasons: visitorClassification.validationReasons,
      })
      try {
        localStorage.setItem(ghostKey, String(clickTime))
      } catch (error) {
        console.warn("Repeat-visit timestamp could not be saved:", error.message)
      }

      // clicks_count bhi update karo (denormalized counter — fast reads ke liye)
      if (clickError) {
        console.error("Click analytics error:", clickError.message)
        setRedirectError("We could not securely record this visit. Please try again.")
        setRedirecting(false)
        return
      } else if (!visitorClassification.isBot && !clickResult?.counted) {
        if (clickResult?.status === "limit_reached") {
          setRedirectError(Number(data.click_limit) === 1
            ? "This one-time link has already been used."
            : "This link has reached its maximum click limit.")
        } else {
          setRedirectError("This link could not be counted safely. Please try again.")
        }
        setRedirecting(false)
        return
      }

      // Destination pe redirect karo
      const destination =
        data.original_url.startsWith("http://") || data.original_url.startsWith("https://")
          ? data.original_url
          : `https://${data.original_url}`

      try {
        const destinationUrl = new URL(destination)
        if (!["http:", "https:"].includes(destinationUrl.protocol)) throw new Error("Unsupported destination protocol")
      } catch {
        setRedirectError("This link has an invalid destination.")
        setRedirecting(false)
        return
      }

      window.location.href = destination
    }

    processRedirect()
  }, [])

  // ── Fetch Links from Supabase ─────────────────────────────────────────────
  // Sirf is visitor ke links fetch karo, newest pehle
  const fetchLinks = useCallback(async () => {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("visitor_id", visitorId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching links:", error.message)
      setErrorMessage("We could not load your links. Please refresh and try again.")
    } else if (data) {
      setLinks(data)
    }
    setLoading(false)
  }, [visitorId])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  useEffect(() => {
    const refresh = () => { fetchLinks() }
    const interval = window.setInterval(refresh, 5000)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh()
    }
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [fetchLinks])

  // ── Handle Generate — naya link create karna ─────────────────────────────
  const handleGenerate = async (event) => {
    event.preventDefault()
    setAliasError("")
    setErrorMessage("")

    const normalizedUrl = longUrl.trim()
    if (!normalizedUrl) return

    let destinationUrl
    try {
      destinationUrl = new URL(normalizedUrl)
    } catch {
      setErrorMessage("Enter a valid destination URL.")
      return
    }
    if (!["http:", "https:"].includes(destinationUrl.protocol)) {
      setErrorMessage("Only HTTP and HTTPS destinations are supported.")
      return
    }

    const normalizedAlias = alias.trim().replace(/\s+/g, "").toLowerCase()
    if (normalizedAlias && !/^[a-z0-9_-]{3,40}$/.test(normalizedAlias)) {
      setAliasError("Use 3–40 letters, numbers, hyphens, or underscores.")
      return
    }

    const parsedClickLimit = isBurnEnabled ? 1 : clickLimit.trim() ? Number(clickLimit) : null
    if (parsedClickLimit !== null && (!Number.isInteger(parsedClickLimit) || parsedClickLimit < 1)) {
      setErrorMessage("Click limit must be a whole number greater than zero.")
      return
    }

    if (passwordProtected && !password.trim()) {
      setErrorMessage("Enter a protection password or turn off password protection.")
      return
    }

    setGenerating(true)

    // Custom alias ya random 6-char slug
    const slug = normalizedAlias
      ? normalizedAlias
      : Math.random().toString(36).substring(2, 8)

    const isProtected = Boolean(passwordProtected && password.trim().length > 0)

    const passwordHash = isProtected ? await hashPassword(password.trim()) : null
    const newRecord = {
      original_url: destinationUrl.toString(),
      short_code: slug,
      clicks_count: 0,
      is_disabled: false,
      visitor_id: visitorId,
      password_hash: passwordHash,
      expires_at: expiresAt.trim() ? new Date(expiresAt.trim()).toISOString() : null,
      click_limit: parsedClickLimit,
    }

    const { data, error } = await supabase.from("links").insert([newRecord]).select()
    setGenerating(false)

    if (error) {
      // 23505 = unique constraint violation = alias already taken
      if (error.code === "23505") {
        setAliasError(`Alias "${slug}" is already taken. Try another alias.`)
      } else {
        setAliasError("Unable to save link right now. Please try again.")
        setErrorMessage("Unable to save the link right now. Please check your connection and try again.")
        console.error("Insert error:", error)
      }
      return
    }

    if (data && data.length > 0) {
      const createdLink = data[0]

      setLinks(prev => [createdLink, ...prev])

      // Form clear karo
      setLongUrl("")
      setAlias("")
      setPassword("")
      setPasswordProtected(false)
      setExpiresAt("")
      setClickLimit("")
      setIsBurnEnabled(false)

      // Success modal dikhao
      setCreatedModal({
        workingUrl: `${window.location.origin}/${createdLink.short_code}`,
        displayUrl: `${window.location.origin}/${createdLink.short_code}`,
        originalUrl: createdLink.original_url,
        isProtected: Boolean(createdLink.password_hash),
      })
    }
  }

  // ── Copy Link ─────────────────────────────────────────────────────────────
  const copyLink = async (textToCopy) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable")
      await navigator.clipboard.writeText(textToCopy)
      setCopied(textToCopy)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      setErrorMessage("Copying is unavailable in this browser. Copy the link manually.")
    }
  }

  // ── Toggle Disable ────────────────────────────────────────────────────────
  // Link ko enable/disable karo — visitor_id filter security ke liye
  const toggleDisable = async (linkId, currentDisabledState) => {
    const { error } = await supabase
      .from("links")
      .update({ is_disabled: !currentDisabledState })
      .eq("id", linkId)
      .eq("visitor_id", visitorId)

    if (!error) {
      setLinks(prev =>
        prev.map(link =>
          link.id === linkId ? { ...link, is_disabled: !currentDisabledState } : link
        )
      )
    } else {
      console.error("Toggle disable error:", error.message)
      setErrorMessage("We could not update that link. Please try again.")
    }
  }

  // ── Delete Link ───────────────────────────────────────────────────────────
  const deleteLink = async (linkId) => {
    const { error } = await supabase
      .from("links")
      .delete()
      .eq("id", linkId)
      .eq("visitor_id", visitorId)

    if (!error) {
      setLinks(prev => prev.filter(link => link.id !== linkId))
    } else {
      console.error("Delete error:", error.message)
      setErrorMessage("We could not delete that link. Please try again.")
    }
  }

  // ── Modal handlers ────────────────────────────────────────────────────────
  const closeModal = () => setCreatedModal(null)

  const viewInTable = () => {
    setCreatedModal(null)
    tableRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return {
    // Form state
    longUrl, setLongUrl,
    alias, setAlias,
    aliasError, setAliasError,
    passwordProtected, setPasswordProtected,
    password, setPassword,
    expiresAt, setExpiresAt,
    clickLimit, setClickLimit,
    isBurnEnabled, setIsBurnEnabled,
    // Data state
    links,
    loading,
    generating,
    redirecting,
    redirectError,
    errorMessage,
    passwordState,
    copied,
    createdModal,
    // Computed values
    totalClicks,
    activeLinksCount,
    // Refs
    tableRef,
    // Functions
    handleGenerate,
    refreshLinks: fetchLinks,
    copyLink,
    toggleDisable,
    deleteLink,
    closeModal,
    viewInTable,
  }
}
