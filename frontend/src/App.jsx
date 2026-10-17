"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDown, ArrowUpRight, Check, Copy, ExternalLink,
  KeyRound, Link2, LockKeyhole, ShieldCheck, Sparkles, X,

} from "lucide-react"
import { IntroAnimation, HERO_REVEAL_MS } from "./components/intro-animation"
import { MobileNav } from "./components/mobile-nav"
import darkThemeLogo from "./assets/linkpulse-logo.png"
import lightThemeLogo from "./assets/linkpulse-logo-light.png"
import { supabase } from "./supabase"

/* ─── Animated Background Orbs ─────────────────────────────────────────────── */
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="grid-overlay" />
    </div>
  )
}

/* ─── Floating 3D URL Pill ──────────────────────────────────────────────────── */
function FloatingPill({ text, delay = 0, x = 0, y = 0, className = "" }) {
  return (
    <div
      className={`floating-pill ${className}`}
      style={{ animationDelay: `${delay}s`, left: `${x}%`, top: `${y}%` }}
    >
      <span className="pill-dot" />
      {text}
    </div>
  )
}

function getInitialTheme() {
  const savedTheme = localStorage.getItem("linkpulse_theme")
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

/* ─── Glass Card ─────────────────────────────────────────────────────────────── */
function GlassCard({ children, className = "", glow = false }) {
  return (
    <div className={`glass-card ${glow ? "glass-card-glow" : ""} ${className}`}>
      {children}
    </div>
  )
}

/* ─── Counter ──────────────────────────────────────────────────────────────── */
function AnimatedCounter({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const end = Number(value)
    if (end === 0) { setDisplay(0); return }
    const step = Math.ceil(end / 40)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setDisplay(end); clearInterval(timer) }
      else setDisplay(start)
    }, 30)
    return () => clearInterval(timer)
  }, [value])
  return <>{display.toLocaleString()}{suffix}</>
}

/* ─── Features Data ─────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: ShieldCheck,
    title: "GhostClick™ Bot Shield",
    desc: "Military-grade bot detection filters fake clicks before they hit your analytics. Only real humans count.",
    color: "from-emerald-500/20 to-teal-500/10",
    accent: "#10b981",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    desc: "Watch clicks stream in live. Geographic breakdowns, device types, referrer tracking — all in one dashboard.",
    color: "from-blue-500/20 to-indigo-500/10",
    accent: "#6366f1",
  },
  {
    icon: LockKeyhole,
    title: "Password Protection",
    desc: "Lock any link behind a secret passphrase. Share with confidence knowing only intended recipients can access.",
    color: "from-violet-500/20 to-purple-500/10",
    accent: "#8b5cf6",
  },
  {
    icon: Zap,
    title: "Instant Redirect",
    desc: "Sub-millisecond redirects powered by edge infrastructure. Zero latency between click and destination.",
    color: "from-amber-500/20 to-orange-500/10",
    accent: "#f59e0b",
  },
  {
    icon: Globe,
    title: "Custom Aliases",
    desc: "Brand your links with memorable slugs. go.linkpulse.io/your-brand — your identity, everywhere.",
    color: "from-pink-500/20 to-rose-500/10",
    accent: "#ec4899",
  },
  {
    icon: Layers,
    title: "Smart Routing",
    desc: "Route users based on location, device, or time of day. One link, infinite destinations.",
    color: "from-cyan-500/20 to-sky-500/10",
    accent: "#06b6d4",
  },
]

/* ─── Steps ──────────────────────────────────────────────────────────────────── */
const STEPS = [
  { num: "01", title: "Paste your URL", desc: "Drop any long URL into the input field. We accept any valid web address." },
  { num: "02", title: "Customize & secure", desc: "Set a custom alias, add password protection, configure expiry rules." },
  { num: "03", title: "Go live instantly", desc: "Your branded short link is live in milliseconds. Share anywhere." },
]

const FAQS = [
  {
    question: "What is LinkPulse?",
    answer: "LinkPulse turns long URLs into short links. You can customize a link with an alias, protect it with a password, and track its clicks.",
  },
  {
    question: "Is LinkPulse free?",
    answer: "LinkPulse is currently described as free for personal use, with no sign-up required.",
  },
  {
    question: "What is GhostClick™?",
    answer: "GhostClick™ is LinkPulse's bot-shield feature. It filters fake clicks so your click counts focus on real visitors.",
  },
  {
    question: "Can I password-protect a link?",
    answer: "Yes. Enable password protection when creating your link and choose a password. Visitors must enter it correctly to continue to the destination.",
  },
  {
    question: "Can I create a custom alias?",
    answer: "Yes. Enter an alias when creating your link. If it is already taken, LinkPulse will let you know so you can try another.",
  },
]

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export default function LinkPulsePage() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [openFaq, setOpenFaq] = useState(null)
  const [heroReady, setHeroReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [longUrl, setLongUrl] = useState("")
  const [alias, setAlias] = useState("")
  const [aliasError, setAliasError] = useState("")
  const [passwordProtected, setPasswordProtected] = useState(false)
  const [password, setPassword] = useState("")
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [copied, setCopied] = useState(null)
  const [createdModal, setCreatedModal] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [theme, setTheme] = useState(() => {
    // Persist preference across reloads
    return localStorage.getItem("lp_theme") || "dark"
  })

  // Apply theme to <html> so CSS variables work globally (body, fixed elements, etc.)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === "dark" ? "light" : "dark"
      localStorage.setItem("lp_theme", next)
      return next
    })
  }, [])

  const isDark = theme === "dark"

  const linkPulseRef = useRef(null)
  const tableRef = useRef(null)
  const heroRef = useRef(null)
  const heroGlassRef = useRef(null)
  const heroParallaxFrame = useRef(null)

  const visitorId = useMemo(() => {
    let id = localStorage.getItem("linkpulse_visitor_id")
    if (!id) {
      id = "usr_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
      localStorage.setItem("linkpulse_visitor_id", id)
    }
    return id
  }, [])

  const handleIntroDone = useCallback(() => setHeroReady(true), [])

  const handleHeroPointerMove = (event) => {
    if (
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return

    const bounds = heroRef.current?.getBoundingClientRect()
    if (!bounds) return

    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 40
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 40
    cancelAnimationFrame(heroParallaxFrame.current)
    heroParallaxFrame.current = requestAnimationFrame(() => {
      heroGlassRef.current?.style.setProperty("--parallax-x", `${x}px`)
      heroGlassRef.current?.style.setProperty("--parallax-y", `${y}px`)
    })
  }

  const resetHeroParallax = () => {
    cancelAnimationFrame(heroParallaxFrame.current)
    heroParallaxFrame.current = requestAnimationFrame(() => {
      heroGlassRef.current?.style.setProperty("--parallax-x", "0px")
      heroGlassRef.current?.style.setProperty("--parallax-y", "0px")
    })
  }

  useEffect(() => () => cancelAnimationFrame(heroParallaxFrame.current), [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("linkpulse_theme", theme)
  }, [theme])

  useEffect(() => {
    const timer = setTimeout(() => setVideoReady(true), HERO_REVEAL_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const slug = window.location.pathname.replace(/^\/+/, "").trim()
    if (!slug) return
    setRedirecting(true)
    async function processRedirect() {
      const { data, error } = await supabase
        .from("links")
        .select("id, original_url, clicks_count, is_disabled, password_hash")
        .eq("short_code", slug)
        .single()
      if (error || !data) { alert("Link not found or expired."); window.location.href = "/"; return }
      if (data.is_disabled) { alert("This link has been disabled."); window.location.href = "/"; return }
      const hasPassword = Boolean(data.password_hash && data.password_hash.trim().length > 0)
      if (hasPassword) {
        const enteredPassword = window.prompt("This link is password protected. Enter the access password:")
        if (!enteredPassword || enteredPassword.trim() !== data.password_hash.trim()) {
          alert("Incorrect password or access cancelled.")
          window.location.href = "/"
          return
        }
      }
      await supabase.from("links").update({ clicks_count: (data.clicks_count || 0) + 1 }).eq("id", data.id)
      const destination = data.original_url.startsWith("http://") || data.original_url.startsWith("https://")
        ? data.original_url : `https://${data.original_url}`
      window.location.href = destination
    }
    processRedirect()
  }, [])

  const fetchLinks = useCallback(async () => {
    const { data, error } = await supabase
      .from("links").select("*").eq("visitor_id", visitorId).order("created_at", { ascending: false })
    if (error) console.error("Error fetching links:", error.message)
    else if (data) setLinks(data)
    setLoading(false)
  }, [visitorId])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  const totalClicks = useMemo(() => links.reduce((sum, l) => sum + (Number(l.clicks_count) || 0), 0), [links])
  const activeLinksCount = useMemo(() => links.filter(l => !l.is_disabled).length, [links])
  const scrollToShortener = () => linkPulseRef.current?.scrollIntoView({ behavior: "smooth" })

  const handleGenerate = async (event) => {
    event.preventDefault()
    setAliasError("")
    if (!longUrl.trim()) return
    if (passwordProtected && !password.trim()) {
      alert("Please enter a protection password or uncheck the password option.")
      return
    }
    setGenerating(true)
    const slug = alias.trim()
      ? alias.trim().replace(/\s+/g, "").toLowerCase()
      : Math.random().toString(36).substring(2, 8)
    const isProtected = Boolean(passwordProtected && password.trim().length > 0)
    const newRecord = {
      original_url: longUrl.trim(), short_code: slug, clicks_count: 0,
      is_disabled: false, visitor_id: visitorId,
      password_hash: isProtected ? password.trim() : null
    }
    const { data, error } = await supabase.from("links").insert([newRecord]).select()
    setGenerating(false)
    if (error) {
      if (error.code === "23505") setAliasError(`Alias "${slug}" is already taken. Try another alias.`)
      else { setAliasError("Unable to save link right now. Please try again."); console.error("Insert error:", error) }
      return
    }
    if (data && data.length > 0) {
      const g = data[0]
      setLinks(prev => [g, ...prev])
      setLongUrl(""); setAlias(""); setPassword(""); setPasswordProtected(false)
      setCreatedModal({
        workingUrl: `${window.location.origin}/${g.short_code}`,
        displayUrl: `go.linkpulse.io/${g.short_code}`,
        originalUrl: g.original_url,
        isProtected: Boolean(g.password_hash)
      })
    }
  }

  const copyLink = async (textToCopy) => {
    await navigator.clipboard?.writeText(textToCopy)
    setCopied(textToCopy)
    setTimeout(() => setCopied(null), 1600)
  }

  /* ── Redirect Loader ── */
  if (redirecting) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <AnimatedBackground />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="redirect-logo">
            <span>LP</span>
          </div>
          <div className="flex items-center gap-3 rounded-full px-6 py-3 backdrop-blur-xl" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            <Sparkles className="size-4 animate-spin text-violet-400" />
            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Routing via GhostClick™ Bot Shield...</span>
          </div>
        </div>
      </main>
    )
  }

  return (


      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="hero relative h-screen overflow-hidden flex items-end"
        onPointerLeave={resetHeroParallax}
        onPointerMove={handleHeroPointerMove}
      >
        <div ref={heroGlassRef} className="hero-glass-layer absolute inset-[-5%] z-0">
          <video
            autoPlay loop muted playsInline
            className="hero-glass-video absolute inset-0 h-full w-full object-cover"
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/agentic-hero-9yW3wnTNMfn2U6lsVhTTZSJFEvAoSj.mp4"
            style={{ transform: videoReady ? "scale(1.05)" : "scale(0.85)", transition: "transform 2s cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </div>
        <div
          className="hero-bottom-overlay absolute inset-x-0 bottom-0 h-[70%]"
          aria-hidden="true"
        />


        {/* Floating pills */}
        <FloatingPill text="go.lp/launch-2025" delay={0} x={76} y={18} />
        <FloatingPill text="go.lp/product-hunt" delay={1.2} x={78} y={38} className="floating-pill-hide-tablet" />
        <FloatingPill text="go.lp/investor-deck" delay={2.4} x={72} y={58} />
        <FloatingPill text="go.lp/waitlist" delay={0.8} x={82} y={76} className="floating-pill-hide-tablet" />

        {/* Hero text */}
        <div className="hero-content relative z-[2] w-full px-6 pb-16 md:px-14 lg:px-20">
          <div className="max-w-5xl">
            <div
              className="hero-badge mb-6"
              style={{ opacity: heroReady ? 1 : 0, transform: heroReady ? "translateY(0)" : "translateY(16px)", transition: "opacity .6s ease, transform .6s ease" }}
            >
              <Sparkles className="size-3 text-violet-400" />
              <span>Next-Gen URL Intelligence Platform</span>
            </div>
            <h1
              className="hero-headline"
              style={{ opacity: heroReady ? 1 : 0, filter: heroReady ? "blur(0px)" : "blur(24px)", transform: heroReady ? "translateY(0px)" : "translateY(32px)", transition: "opacity 1s cubic-bezier(0.16,1,0.3,1), filter 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)" }}
            >
              Links That<br /><span className="gradient-text">Think For You.</span>
            </h1>
            <p
              className="hero-sub"
              style={{ opacity: heroReady ? 1 : 0, transform: heroReady ? "translateY(0)" : "translateY(20px)", transition: "opacity .8s ease 120ms, transform .8s ease 120ms" }}
            >
              LinkPulse goes beyond shortening. Arm every link with GhostClick™ Bot Shield,
              live analytics, and smart routing — all in one blazing-fast platform.
            </p>
            <div
              className="flex flex-wrap items-center gap-4 mt-8"
              style={{ opacity: heroReady ? 1 : 0, transform: heroReady ? "translateY(0)" : "translateY(20px)", transition: "opacity .8s ease 200ms, transform .8s ease 200ms" }}
            >
              <button onClick={scrollToShortener} className="cta-primary">
                Shorten a Link <ArrowUpRight className="size-4" />
              </button>
              <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="cta-ghost">
                See Features <ChevronRight className="size-4" />
              </button>
            </div>
            <div
              className="flex items-center gap-6 mt-10"
              style={{ opacity: heroReady ? 1 : 0, transition: "opacity .8s ease 280ms" }}
            >
              {["GHOSTCLICK™", "REAL-TIME ANALYTICS", "SMART ROUTING"].map((p, i) => (
                <div key={p} className="hero-pillar" style={{ transitionDelay: `${300 + i * 80}ms` }}>
                  <span className="pillar-dot" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button onClick={scrollToShortener} className="scroll-indicator z-30">
          <ArrowDown className="size-4 animate-bounce" />
        </button>
      </section>

      {/* ─── SHORTENER SECTION ─────────────────────────────────────────────── */}
      <section ref={linkPulseRef} id="shortener" className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          {/* Section header */}
          <div className="mb-12 text-center">
            <div className="section-badge mx-auto mb-4">
              <Link2 className="size-3.5 text-violet-400" /> CREATE
            </div>
            <h2 className="section-title">Create your secure LinkPulse URL.</h2>
            <p className="section-sub mx-auto">Paste, customize, and launch your link in under 3 seconds.</p>
          </div>

          {/* Shortener form */}
          <GlassCard glow className="p-6 md:p-10">
            <form onSubmit={handleGenerate} className="grid gap-6 lg:grid-cols-[1fr_0.8fr_auto] lg:items-end">
              <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] text-white/40">
                Long URL
                <input
                  required type="url" value={longUrl}
                  onChange={e => setLongUrl(e.target.value)}
                  placeholder="https://your-very-long-link.com/path?with=params"
                  className="form-input"
                />
              </label>

              <div className="flex flex-col justify-end">
                <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] text-white/40">
                  <div className="flex items-center justify-between">
                    <span>Custom Alias</span>
                    <span className="normal-case tracking-normal text-white/25">optional</span>
                  </div>
                  <div className={`form-input-prefix ${aliasError ? "border-rose-500/60" : ""}`}>
                    <span className="shrink-0 text-white/25 text-xs">go.lp/</span>
                    <input
                      value={alias}
                      onChange={e => { setAlias(e.target.value); if (aliasError) setAliasError("") }}
                      placeholder="your-alias"
                      className="min-w-0 flex-1 bg-transparent pl-1 outline-none placeholder:text-white/20 text-white text-sm"
                    />
                  </div>
                </label>
                {aliasError && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                    <span className="size-1.5 shrink-0 rounded-full bg-rose-400" />
                    {aliasError}
                  </div>
                )}
              </div>

              <button type="submit" disabled={generating} className="cta-generate">
                {generating ? (
                  <><span className="generate-spinner" /> Generating...</>
                ) : (
                  <>Generate <ArrowUpRight className="size-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-5 pt-5 border-t border-white/[0.06]">
              <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-white/50">
                <input type="checkbox" checked={passwordProtected} onChange={e => setPasswordProtected(e.target.checked)} className="peer sr-only" />
                <span className="custom-checkbox peer-checked:border-violet-500 peer-checked:bg-violet-500">
                  <Check className="size-3 opacity-0 peer-checked:opacity-100" />
                </span>
                <LockKeyhole className="size-4 text-white/30" /> Password protect this link
              </label>
              {passwordProtected && (
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3.5 size-3.5 text-white/30" />
                  <input
                    type="password" required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Set secret password"
                    className="h-10 rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-violet-500/50 focus:bg-white/[0.08]"
                  />
                </div>
              )}
            </div>
          </GlassCard>

          {/* Stats row */}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-6 stats-card">
              <div className="stats-icon-wrap bg-emerald-500/10">
                <ShieldCheck className="size-5 text-emerald-400" />
              </div>
              <div className="mt-4 text-3xl font-light tracking-tight tabular-nums">
                <AnimatedCounter value={totalClicks} />
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Verified Clicks</div>
              <div className="mt-2 text-[11px]" style={{ color: "var(--text-faint)" }}>Live tracked on your links</div>
            </GlassCard>

            <GlassCard className="p-6 stats-card">
              <div className="stats-icon-wrap bg-blue-500/10">
                <Link2 className="size-5 text-blue-400" />
              </div>
              <div className="mt-4 text-3xl font-light tracking-tight tabular-nums">
                <AnimatedCounter value={activeLinksCount} />
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Active Links</div>
              <div className="mt-2 text-[11px]" style={{ color: "var(--text-faint)" }}>Personal workspace</div>
            </GlassCard>

            <GlassCard className="p-6 stats-card">
              <div className="stats-icon-wrap bg-violet-500/10">
                <ShieldCheck className="size-5 text-violet-400" />
              </div>
              <div className="mt-4 text-3xl font-light tracking-tight text-emerald-400">
                Active
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Shield Status</div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400/60">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                GhostClick™ engine running
              </div>
            </GlassCard>
          </div>

          {/* Links table */}
          <div ref={tableRef}>
            <GlassCard className="mt-4 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 md:px-8" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-base font-medium" style={{ color: "var(--text-primary)" }}>Recently shortened links</h3>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Your private workspace activity, live from Supabase.</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest text-emerald-400/70">Live</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-[10px] uppercase tracking-[0.16em]" style={{ borderBottom: "1px solid var(--border)", color: "var(--thead-text)" }}>
                    <tr>
                      <th className="px-6 py-4 font-normal md:px-8">Short Link</th>
                      <th className="px-4 py-4 font-normal">Original URL</th>
                      <th className="px-4 py-4 font-normal">Status</th>
                      <th className="px-6 py-4 font-normal md:px-8">Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                          <div className="flex items-center justify-center gap-2">
                            <span className="size-4 rounded-full border-2 border-violet-500/40 border-t-violet-500 animate-spin" />
                            Connecting to database...
                          </div>
                        </td>
                      </tr>
                    ) : links.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Link2 className="size-8 text-white/10" strokeWidth={1} />
                            <p className="text-xs text-white/30">No links yet. Create your first link above.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      links.map(link => {
                        const directUrl = `${window.location.origin}/${link.short_code}`
                        const displayBrand = `go.lp/${link.short_code}`
                        return (
                          <tr key={link.id || link.short_code} className="table-row-hover border-b border-white/[0.04] last:border-0">
                            <td className="px-6 py-5 md:px-8">
                              <div className="inline-flex items-center gap-2">
                                <a href={directUrl} target="_blank" rel="noopener noreferrer"
                                  className="font-mono text-xs text-violet-400 hover:text-violet-300 hover:underline transition-colors">
                                  {displayBrand}
                                </a>
                                <button type="button" onClick={() => copyLink(directUrl)}
                                  className="inline-flex items-center p-1 text-white/25 hover:text-white/70 transition-colors" title="Copy link">
                                  {copied === directUrl
                                    ? <Check className="size-3 text-emerald-400" />
                                    : <Copy className="size-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="max-w-[240px] truncate px-4 py-5 text-xs text-white/30">
                              {link.original_url}
                            </td>
                            <td className="px-4 py-5">
                              <span className={`status-badge ${link.is_disabled ? "status-disabled" : link.password_hash ? "status-protected" : "status-active"}`}>
                                <span className={`size-1.5 rounded-full ${link.is_disabled ? "bg-amber-400" : link.password_hash ? "bg-violet-400" : "bg-emerald-400"}`} />
                                {link.is_disabled ? "Disabled" : link.password_hash ? "Protected" : "Active"}
                              </span>
                            </td>
                            <td className="px-6 py-5 md:px-8">
                              <div className="flex items-center gap-3">
                                <div className="h-1 w-20 overflow-hidden rounded-full bg-white/[0.07]">
                                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                                    style={{ width: `${Math.min((link.clicks_count || 0), 100)}%` }} />
                                </div>
                                <span className="text-xs text-white/40 tabular-nums">{link.clicks_count || 0}</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ──────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="section-badge mx-auto mb-4">
              <Sparkles className="size-3.5 text-violet-400" /> FEATURES
            </div>
            <h2 className="section-title">Everything you need.<br /><span className="gradient-text">Nothing you don't.</span></h2>
            <p className="section-sub mx-auto">A full suite of link intelligence tools built for marketers, developers, and creators.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature-card group" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`feature-icon-bg bg-gradient-to-br ${f.color}`} style={{ "--accent": f.accent }}>
                  <f.icon className="size-5" style={{ color: f.accent }} />
                </div>
                <h3 className="mt-5 text-base font-medium text-white/90">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/40">{f.desc}</p>
                <div className="feature-line" style={{ background: `linear-gradient(90deg, ${f.accent}40, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <div className="section-badge mx-auto mb-4">
              <MousePointerClick className="size-3.5 text-violet-400" /> HOW IT WORKS
            </div>
            <h2 className="section-title">From URL to insight<br /><span className="gradient-text">in 3 steps.</span></h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-[28px] top-12 bottom-12 w-px bg-gradient-to-b from-violet-500/40 via-blue-500/20 to-transparent hidden md:block" />
            <div className="flex flex-col gap-10">
              {STEPS.map((step, i) => (
                <div key={step.num} className="step-card group">
                  <div className="step-num">
                    <span>{step.num}</span>
                  </div>
                  <div className="ml-6 md:ml-10">
                    <h3 className="text-lg font-medium text-white/90">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/40">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ────────────────────────────────────────────────────── */}
      <section id="faq" aria-labelledby="faq-title" className="faq-section relative z-10 px-6 py-24 md:px-12 lg:px-20">
        <div className="faq-layout mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="faq-eyebrow">FREQUENTLY ASKED QUESTIONS</p>
            <h2 id="faq-title" className="faq-title">
              Everything you need to know about LinkPulse.
            </h2>
            <p className="faq-intro">Quick answers about creating, protecting, and tracking your links.</p>
          </div>

          <div className="faq-list">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index
              const answerId = `faq-answer-${index}`

              return (
                <div className="faq-item" key={faq.question}>
                  <h3 className="faq-question-heading">
                    <button
                      aria-controls={answerId}
                      aria-expanded={isOpen}
                      className="faq-question"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      type="button"
                    >
                      <span>{faq.question}</span>
                      {isOpen
                        ? <Minus aria-hidden="true" className="faq-icon" />
                        : <Plus aria-hidden="true" className="faq-icon" />}
                    </button>
                  </h3>
                  <div
                    aria-hidden={!isOpen}
                    className={`faq-answer${isOpen ? " is-open" : ""}`}
                    id={answerId}
                  >
                    <div className="faq-answer-inner">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-4xl">
          <div className="cta-banner">
            <div className="cta-banner-glow" />
            <div className="relative z-10 flex flex-col items-center gap-6 text-center">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 border border-white/10">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs text-white/60">Free for personal use. No signup required.</span>
              </div>
              <h2 className="text-4xl font-light tracking-tight md:text-5xl">
                Ready to pulse your <span className="gradient-text">links?</span>
              </h2>
              <p className="max-w-lg text-sm text-white/40 leading-relaxed">
                Join thousands of creators and marketers who trust LinkPulse for smarter, safer link management.
              </p>
              <button onClick={scrollToShortener} className="cta-primary text-base px-8 py-4">
                Get Started Free <ArrowUpRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-6 py-12 md:px-12 lg:px-20 border-t border-white/[0.05]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img
                  className="footer-brand-logo"
                  src={theme === "dark" ? darkThemeLogo : lightThemeLogo}
                  alt="LinkPulse"
                />
              </div>
              <p className="mt-2 text-xs text-white/25 max-w-xs">
                Next-generation URL intelligence. Shorten, protect, analyze.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-white/20">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                <span>Powered by Supabase Edge Network</span>
              </div>
              <p className="text-[11px] text-white/15">© {new Date().getFullYear()} LinkPulse. Built for builders.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── CREATED MODAL ──────────────────────────────────────────────────── */}
      {createdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
          <div className="modal-card">
            <div className="modal-confetti" aria-hidden="true">
              {[...Array(12)].map((_, i) => (
                <span key={i} className="confetti-dot" style={{ "--i": i }} />
              ))}
            </div>
            <button onClick={() => setCreatedModal(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-white/30 hover:bg-white/5 hover:text-white/70 transition-colors z-10">
              <X className="size-4" />
            </button>

            <div className="relative z-10 p-6 md:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                <Check className="size-3.5" /> Link Ready
              </div>
              <h3 className="text-xl font-light text-white">Your link is live 🚀</h3>
              <p className="mt-1 truncate text-xs text-white/35">Redirects to: {createdModal.originalUrl}</p>
              {createdModal.isProtected && (
                <p className="mt-1 text-xs font-medium text-violet-400 flex items-center gap-1.5">
                  <LockKeyhole className="size-3" /> Password protection active
                </p>
              )}

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <span className="truncate font-mono text-xs text-white/70">{createdModal.displayUrl}</span>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <a href={createdModal.workingUrl} target="_blank" rel="noopener noreferrer"
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/40 hover:text-white/80 transition-colors">
                    <ExternalLink className="size-3.5" />
                  </a>
                  <button type="button" onClick={() => copyLink(createdModal.workingUrl)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-xs text-white transition hover:opacity-90 shadow-lg shadow-violet-500/20">
                    {copied === createdModal.workingUrl
                      ? <><Check className="size-3.5 text-emerald-300" /> Copied!</>
                      : <><Copy className="size-3.5" /> Copy Link</>}
                  </button>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => { setCreatedModal(null); tableRef.current?.scrollIntoView({ behavior: "smooth" }) }}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors">
                  View in table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
