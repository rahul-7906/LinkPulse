import { useCallback, useEffect, useMemo, useState } from "react"
import { Activity, Monitor, RefreshCw, Smartphone } from "lucide-react"
import { supabase } from "../../supabase"

function getVisitorId() {
  let id = null
  try {
    id = localStorage.getItem("linkpulse_visitor_id")
  } catch (error) {
    console.warn("Visitor ID storage is unavailable:", error.message)
  }
  if (!id) {
    id = "usr_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
    try {
      localStorage.setItem("linkpulse_visitor_id", id)
    } catch (error) {
      console.warn("Visitor ID could not be saved:", error.message)
    }
  }
  return id
}

export default function CompactAnalytics({ analyticsRef }) {
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    const { data: links, error: linksError } = await supabase
      .from("links")
      .select("id")
      .eq("visitor_id", getVisitorId())

    if (linksError) {
      setError("Analytics unavailable")
      setLoading(false)
      setRefreshing(false)
      return
    }

    const ids = (links || []).map(link => link.id)
    const { data, error: clicksError } = ids.length
      ? await supabase.from("clicks")
        .select("device_type, created_at, is_ghost, is_bot, counted, source_platform")
        .in("link_id", ids)
        .order("created_at", { ascending: false })
        .limit(5000)
      : { data: [], error: null }

    setError(clicksError ? "Analytics unavailable" : "")
    setClicks(data || [])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    // Load once and stay fresh while the workspace is open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    const interval = window.setInterval(load, 5000)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") load()
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [load])

  const stats = useMemo(() => ({
    total: clicks.length,
    verified: clicks.filter(click => click.counted).length,
    human: clicks.filter(click => !click.is_bot && !click.is_ghost).length,
    ghost: clicks.filter(click => click.is_ghost).length,
    bots: clicks.filter(click => click.is_bot).length,
    mobile: clicks.filter(click => click.device_type === "mobile").length,
    desktop: clicks.filter(click => click.device_type === "desktop").length,
  }), [clicks])

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - (6 - index))
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    return {
      label: day.toLocaleDateString("en", { weekday: "short" }),
      verified: clicks.filter(click => {
        const created = new Date(click.created_at)
        return created >= day && created < next
          && click.counted
      }).length,
      ghost: clicks.filter(click => {
        const created = new Date(click.created_at)
        return created >= day && created < next && click.is_ghost
      }).length,
      bots: clicks.filter(click => {
        const created = new Date(click.created_at)
        return created >= day && created < next && click.is_bot
      }).length,
    }
  }), [clicks])

  const max = Math.max(...days.map(day => day.verified + day.ghost + day.bots), 1)
  const humanShare = stats.total ? Math.round((stats.human / stats.total) * 100) : 0

  return (
    <div ref={analyticsRef} id="analytics" className="mt-4 scroll-mt-24">
      <div className="rounded-3xl p-5 md:p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-violet-400" />
              <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Click analytics</h3>
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-400"><span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> Live</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Verified activity with bots and ghost clicks separated.</p>
          </div>
          <button type="button" onClick={() => load(true)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {error ? <p role="alert" className="text-xs text-rose-400">{error}</p> : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Counted clicks" value={stats.verified} accent="var(--analytics-verified)" />
              <Metric label="All visits" value={stats.total} accent="var(--analytics-total)" />
              <Metric label="Ghost" value={stats.ghost} accent="var(--analytics-ghost)" />
              <Metric label="Bots / preview" value={stats.bots} accent="var(--analytics-bots)" />
            </div>

            {clicks.length === 0 ? (
              <AnalyticsEmptyState />
            ) : (
              <div className="mt-5 grid gap-5 md:grid-cols-[1.5fr_1fr]">
                <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Traffic classification · last 7 days</p>
                  <div className="flex gap-3 text-[9px]" style={{ color: "var(--text-muted)" }}>
                    <span><i className="analytics-dot analytics-dot--verified" /> Verified</span>
                    <span><i className="analytics-dot analytics-dot--ghost" /> Ghost</span>
                    <span><i className="analytics-dot analytics-dot--bot" /> Bots</span>
                  </div>
                </div>
                <div className="analytics-bars flex h-28 items-end gap-2">
                  {days.map(day => (
                    <div key={day.label} className="flex h-full flex-1 flex-col items-center gap-1">
                      <div className="analytics-bar-track flex w-full flex-1 items-end justify-center rounded-md" style={{ background: "var(--input-bg)" }}>
                        <div className="analytics-stack rounded-md" style={{ height: `${(Math.max(day.verified + day.ghost + day.bots, 0) / max) * 100}%` }}>
                          <div className="analytics-stack-segment analytics-stack-segment--verified" style={{ flex: day.verified }} />
                          <div className="analytics-stack-segment analytics-stack-segment--ghost" style={{ flex: day.ghost }} />
                          <div className="analytics-stack-segment analytics-stack-segment--bot" style={{ flex: day.bots }} />
                        </div>
                      </div>
                      <span className="text-[9px]" style={{ color: "var(--text-faint)" }}>{day.label}</span>
                    </div>
                  ))}
                </div>
                </div>
                <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                <div className="quality-ring" style={{ "--quality": `${humanShare * 3.6}deg` }}>
                  <div><strong>{humanShare}%</strong><span>human traffic</span></div>
                </div>
                <div className="grid gap-3">
                  <Audience icon={<Smartphone className="size-3.5" style={{ color: "var(--analytics-mobile)" }} />} label="Mobile" value={stats.mobile} total={stats.total} />
                  <Audience icon={<Monitor className="size-3.5" style={{ color: "var(--analytics-desktop)" }} />} label="Desktop" value={stats.desktop} total={stats.total} />
                  </div>
                </div>
              </div>
              )}
          </>
        )}
        {loading && <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>Loading analytics...</p>}
      </div>
    </div>
  )
}

function AnalyticsEmptyState() {
  return (
    <div className="analytics-empty-state">
      <div className="analytics-empty-visual" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <div className="analytics-empty-beacon" />
      </div>
      <div>
        <p className="analytics-empty-title">Your first signal is waiting</p>
        <p className="analytics-empty-copy">Share a shortened link to see verified visits, device mix, and filtered traffic appear here in real time.</p>
        <div className="analytics-empty-hints">
          <span>Verified traffic</span>
          <span>Device insights</span>
          <span>Bot filtering</span>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, accent }) {
  return <div className="rounded-2xl p-3" style={{ background: "var(--input-bg)" }}><p className="text-xl font-light tabular-nums" style={{ color: accent }}>{value}</p><p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p></div>
}

function Audience({ icon, label, value, total }) {
  const percentage = total ? Math.round((value / total) * 100) : 0
  return <div className="rounded-2xl p-3" style={{ background: "var(--input-bg)" }}><p className="flex items-center gap-1.5 text-xs">{icon}{label}</p><p className="mt-2 text-sm tabular-nums">{value} <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{percentage}%</span></p></div>
}
