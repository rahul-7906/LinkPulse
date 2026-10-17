"use client"

import { useState } from "react"


const NAV_LINKS = [
  { label: "Features",    href: "#features" },
  { label: "How It Works", href: "#how-it-works" },

  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const isDark = theme === "dark"

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-3xl">

        {/* ── Main bar ─────────────────────────────────────────────────────── */}
        <nav
          className="flex items-center justify-between px-5 py-3 rounded-2xl"
          style={{
            border: "1px solid var(--nav-border)",
            background: "var(--nav-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: `0 8px 32px var(--nav-shadow), 0 1px 0 var(--border) inset`,
            transition: "background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="nav-logo">LP</div>
            <span style={{
              fontSize: 13, fontWeight: 500, letterSpacing: "0.04em",
              color: "var(--text-primary)",
              transition: "color 0.5s ease",
            }}>
              LinkPulse
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                style={{
                  fontSize: 12, color: "var(--text-muted)",
                  letterSpacing: "0.03em", textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* ── Theme Toggle ─────────────────────────────────────────── */}
            <button
              onClick={onToggleTheme}
              className="theme-toggle"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {/* Sun (visible when dark → switch to light) */}
              <span
                style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  opacity: isDark ? 1 : 0,
                  transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
                  transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <Sun style={{ width: 15, height: 15 }} />
              </span>
              {/* Moon (visible when light → switch to dark) */}
              <span
                style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  opacity: isDark ? 0 : 1,
                  transform: isDark ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
                  transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <Moon style={{ width: 15, height: 15 }} />
              </span>
            </button>

            {/* Get Started — desktop */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="theme-toggle"
              aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
              title={`Switch to ${isDark ? "light" : "dark"} theme`}
            >
              {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </button>
            <button
              onClick={onGetStarted}
              className="hidden md:inline-flex items-center gap-2"
              style={{
                fontSize: 12, padding: "7px 16px", borderRadius: 100,
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                border: "none", color: "white", cursor: "pointer",
                fontWeight: 500, letterSpacing: "0.02em",
                boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
            >
              Get Started <ArrowUpRight style={{ width: 12, height: 12 }} />
            </button>

            {/* Burger — mobile only */}
            <button
              onClick={() => setOpen(v => !v)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open
                ? <X style={{ width: 14, height: 14 }} />
                : <Menu style={{ width: 14, height: 14 }} />
              }
            </button>
          </div>
        </nav>

        {/* ── Mobile dropdown ──────────────────────────────────────────────── */}
        <div
          className="md:hidden mt-2 overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: open ? "360px" : "0px", opacity: open ? 1 : 0 }}
        >
          <div
            className="rounded-2xl px-2 py-2 flex flex-col gap-0.5"
            style={{
              border: "1px solid var(--nav-border)",
              background: isDark ? "rgba(5,5,7,0.95)" : "rgba(250,248,255,0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              transition: "background 0.5s ease, border-color 0.5s ease",
            }}
          >
            {NAV_LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={close}
                style={{
                  padding: "12px 16px", fontSize: 14,
                  color: "var(--text-secondary)", borderRadius: 12,
                  textDecoration: "none", transition: "background 0.15s ease, color 0.15s ease",
                  display: "block",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "var(--surface-hover)"
                  e.currentTarget.style.color = "var(--text-primary)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "var(--text-secondary)"
                }}
              >
                {l.label}
              </a>
            ))}

            {/* Mobile theme toggle row */}
            <div className="flex items-center justify-between px-4 py-3 mt-1"
              style={{ borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {isDark ? "Dark mode" : "Light mode"}
              </span>
              <button
                onClick={onToggleTheme}
                className="theme-toggle"
                style={{ width: 32, height: 32 }}
                aria-label="Toggle theme"
              >
                <span style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  opacity: isDark ? 1 : 0,
                  transform: isDark ? "scale(1)" : "scale(0)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                }}>
                  <Sun style={{ width: 13, height: 13 }} />
                </span>
                <span style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  opacity: isDark ? 0 : 1,
                  transform: isDark ? "scale(0)" : "scale(1)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                }}>
                  <Moon style={{ width: 13, height: 13 }} />
                </span>
              </button>
            </div>

            <div className="px-2 pb-1">
              <button
                onClick={() => { onGetStarted(); close() }}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 14,
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  border: "none", color: "white", cursor: "pointer",
                  fontSize: 13, fontWeight: 500,
                  boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
                }}
              >
                Get Started Free →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
