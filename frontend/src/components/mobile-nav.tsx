"use client"

import { useState } from "react"
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react"
import darkThemeLogo from "../assets/linkpulse-logo.png"
import lightThemeLogo from "../assets/linkpulse-logo-light.png"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Click Tracking", href: "#shortener" },
  { label: "Your Links", href: "#your-links" },
  { label: "Click Analytics", href: "#analytics" },
]

interface MobileNavProps {
  onGetStarted: () => void
  onOpenAnalytics: () => void
  theme: string
  onToggleTheme: () => void
}

export function MobileNav({ onGetStarted, onOpenAnalytics, theme, onToggleTheme }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const isDark = theme === "dark"
  const close = () => setOpen(false)

  return (
    <div className="fixed top-0 inset-x-0 z-50 pointer-events-none">
      <div className="pointer-events-auto w-full">
        <nav
          className="flex items-center justify-between px-5 py-3"
          style={{
            borderBottom: "1px solid var(--nav-border)",
            background: "var(--nav-bg)",
            boxShadow: "0 8px 28px var(--nav-shadow)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <img
              src={isDark ? darkThemeLogo : lightThemeLogo}
              alt="LinkPulse"
              className="nav-brand-logo"
            />
          </div>

          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} onClick={link.label === "Click Analytics" ? (event) => { event.preventDefault(); onOpenAnalytics() } : undefined} className="nav-link text-xs tracking-wide no-underline transition-colors"
                style={{ color: "var(--text-muted)" }}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="theme-toggle"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun className="size-3.75" /> : <Moon className="size-3.75" />}
            </button>
            <button
              onClick={onGetStarted}
              className="nav-cta hidden md:inline-flex items-center gap-2"
              style={{
                fontSize: 12, padding: "7px 16px", borderRadius: 100,
                background: "linear-gradient(135deg, #10b981 0%, #0f766e 100%)",
                border: "none", color: "white", fontWeight: 500,
                boxShadow: "0 4px 16px rgba(16,185,129,0.28)",
              }}
            >
              Get Started <ArrowUpRight className="size-3" />
            </button>
            <button
              onClick={() => setOpen(value => !value)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-secondary)" }}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="size-3.5" /> : <Menu className="size-3.5" />}
            </button>
          </div>
        </nav>

        <div className="md:hidden mt-2 overflow-hidden transition-all duration-300" style={{ maxHeight: open ? 360 : 0, opacity: open ? 1 : 0 }}>
          <div className="px-2 py-2 flex flex-col gap-0.5"
            style={{ borderBottom: "1px solid var(--nav-border)", borderLeft: "1px solid var(--nav-border)", borderRight: "1px solid var(--nav-border)", background: "var(--nav-bg)" }}>
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} onClick={link.label === "Click Analytics" ? (event) => { event.preventDefault(); onOpenAnalytics(); close() } : close}
                className="nav-mobile-link px-4 py-3 text-sm rounded-xl no-underline"
                style={{ color: "var(--text-secondary)" }}>
                {link.label}
              </a>
            ))}
            <div className="flex items-center justify-between px-4 py-3 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>{isDark ? "Dark mode" : "Light mode"}</span>
              <button onClick={onToggleTheme} className="theme-toggle" style={{ width: 32, height: 32 }} aria-label="Toggle theme">
                {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              </button>
            </div>
            <button onClick={() => { onGetStarted(); close() }} className="nav-cta mx-2 mb-1 rounded-[14px] py-3 text-[13px] font-medium text-white"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #0f766e 100%)", border: "none" }}>
              Get Started Free →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
