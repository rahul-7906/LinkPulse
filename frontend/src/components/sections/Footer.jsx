// ─── Footer.jsx ──────────────────────────────────────────────────────────────
// Page ka sabse neeche wala hissa (footer).
// Isme hai:
//   - LinkPulse ka logo (theme ke hisaab se dark ya light version)
//   - Tagline
//   - "Built by Rahul & Dipanshu" — LinkedIn links ke saath
//   - Copyright year
//
// Props:
//   theme — "dark" ya "light" (sahi logo select karne ke liye)

import darkThemeLogo from "../../assets/linkpulse-logo.png"
import lightThemeLogo from "../../assets/linkpulse-logo-light.png"
import { Mail } from "lucide-react"

function SocialMark({ type }) {
  if (type === "github") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.77.6-3.36-1.18-3.36-1.18-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.21-.25-4.54-1.1-4.54-4.91 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 7.69c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.82-2.33 4.66-4.55 4.9.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.5 8.5A2.5 2.5 0 1 1 6.5 3a2.5 2.5 0 0 1 0 5.5ZM4.3 21H8.7V10H4.3v11ZM11.3 10h4.2v1.5h.06c.58-1.1 2-1.9 4.04-1.9 4.32 0 5.12 2.84 5.12 6.53V21h-4.38v-4.3c0-1.03-.02-2.36-1.44-2.36-1.43 0-1.65 1.12-1.65 2.28V21h-4.35V10Z" transform="translate(-1.4 0)" /></svg>
}

export default function Footer({ theme }) {
  return (
    <footer className="relative z-10 px-6 py-12 md:px-12 lg:px-20 border-t border-white/[0.05]">
      <div className="mx-auto max-w-6xl">

        <div className="footer-top flex flex-col items-center gap-8 md:flex-row md:justify-between">

          {/* ── Left: Logo + Tagline ──────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-3">
              {/* Theme ke hisaab se sahi logo dikhao */}
              <img
                className="footer-brand-logo"
                src={theme === "dark" ? darkThemeLogo : lightThemeLogo}
                alt="LinkPulse"
              />
            </div>
            <p className="mt-2 text-xs max-w-xs" style={{ color: "var(--text-faint)" }}>
              Next-generation URL intelligence. Shorten, protect, analyze.
            </p>
          </div>

          <p className="text-xs md:text-right" style={{ color: "var(--text-muted)" }}>Built by <strong style={{ color: "var(--text-primary)" }}>Team Tech Titans</strong></p>
        </div>
        <div className="footer-connect">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Connect with me</p>
          <div className="footer-socials">
            <a href="https://www.linkedin.com/in/rahulmelkani/" target="_blank" rel="noreferrer" aria-label="Rahul on LinkedIn" className="footer-social-link">
              <SocialMark type="linkedin" />
            </a>
            <a href="https://github.com/rahul-7906" target="_blank" rel="noreferrer" aria-label="Rahul on GitHub" className="footer-social-link">
              <SocialMark type="github" />
            </a>
            <a href="mailto:rahulmelkani4280@gmail.com" aria-label="Email Rahul" className="footer-social-link">
              <Mail className="size-4" />
            </a>
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
            © {new Date().getFullYear()} LinkPulse
          </p>
        </div>
      </div>
    </footer>
  )
}
