// ─── App.jsx ─────────────────────────────────────────────────────────────────
// Ye poori application ka main entry point hai.
// Iska kaam sirf yahi hai: saare pieces ko ek saath joorna.
//
// Kya hota hai yahan:
//   1. useTheme hook se theme (dark/light) manage hoti hai
//   2. useLinkManager hook se saari database logic aur form state manage hoti hai
//   3. Intro animation hoti hai — jab wo khatam ho tab hero section visible hota hai
//   4. Redirect check hota hai — agar URL mein koi slug hai to redirect loader dikhao
//   5. Saare sections ko render karo (HeroSection, ShortenerSection, etc.)
//
// ── File Structure ka Map (kaun kya karta hai) ────────────────────────────────
//  src/
//  ├── App.jsx                     ← YE FILE — sab kuch jodata hai
//  ├── main.jsx                    — React app ko DOM mein mount karta hai
//  ├── index.css                   — saari CSS (themes, components, animations)
// ├── supabase.js                 — Supabase database connection
//  ├── hooks/
//  │   ├── useTheme.js             — dark/light theme logic
//  │   └── useLinkManager.js       — saari database aur link form logic
//  ├── components/
//  │   ├── intro-animation.jsx     — page load pe hone wali intro animation
//  │   ├── mobile-nav.jsx          — mobile navigation bar
//  │   ├── ui-custom/
//  │   │   ├── AnimatedBackground.jsx — page ke peeche wala animated background
//  │   │   ├── CustomCursor.jsx       — glowing custom mouse cursor
//  │   │   ├── GlassCard.jsx          — reusable transparent card component
//  │   │   ├── FloatingPill.jsx       — hero mein floating URL badges
//  │   │   └── AnimatedCounter.jsx    — numbers smoothly count up karta hai
//  │   └── sections/
//  │       ├── HeroSection.jsx        — pehla bada hero section
//  │       ├── ShortenerSection.jsx   — URL shortener form + stats + table
//  │       ├── FeaturesSection.jsx    — 6 features ki grid
//  │       ├── HowItWorksSection.jsx  — 3 steps
//  │       ├── FAQSection.jsx         — accordion FAQs
//  │       ├── CTABanner.jsx          — "Get Started Free" banner
//  │       ├── Footer.jsx             — page ka footer
//  │       ├── CreatedModal.jsx       — link successfully create hone ka modal
//  │       └── RedirectLoader.jsx     — redirect hone ka loading screen

import { useCallback, useEffect, useRef, useState } from "react"
import { HERO_REVEAL_MS, IntroAnimation } from "./components/intro-animation"
import { MobileNav } from "./components/mobile-nav"

// ── Custom Hooks ──────────────────────────────────────────────────────────────
import { useTheme } from "./hooks/useTheme"
import { useLinkManager } from "./hooks/useLinkManager"
import { isSupabaseConfigured } from "./supabase"

// ── Utility Components ────────────────────────────────────────────────────────
import AnimatedBackground from "./components/ui-custom/AnimatedBackground"
import CustomCursor from "./components/ui-custom/CustomCursor"

// ── Page Sections ─────────────────────────────────────────────────────────────
import HeroSection from "./components/sections/HeroSection"
import ShortenerSection from "./components/sections/ShortenerSection"
import FeaturesSection from "./components/sections/FeaturesSection"
import HowItWorksSection from "./components/sections/HowItWorksSection"
import FAQSection from "./components/sections/FAQSection"
import CTABanner from "./components/sections/CTABanner"
import Footer from "./components/sections/Footer"
import CreatedModal from "./components/sections/CreatedModal"
import RedirectLoader from "./components/sections/RedirectLoader"

function SupabaseSetupNotice() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-5 py-12 font-sans antialiased"
      style={{ background: "var(--page-bg)", color: "var(--text-primary)" }}
    >
      <section
        className="w-full max-w-2xl rounded-3xl p-7 sm:p-10"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <p className="mb-3 text-xs uppercase tracking-[0.25em]" style={{ color: "var(--accent-cyan)" }}>
          LinkPulse setup
        </p>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Connect your Supabase project
        </h1>
        <p className="mt-4 leading-7" style={{ color: "var(--text-secondary)" }}>
          The page could not load because its Supabase connection is not configured.
          Add your project URL and anon/public key to start using LinkPulse.
        </p>
        <ol className="mt-7 list-decimal space-y-3 pl-5 leading-6" style={{ color: "var(--text-secondary)" }}>
          <li>Copy <code>frontend/.env.example</code> to <code>frontend/.env.local</code>.</li>
          <li>
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>
            {" "}from your Supabase project settings.
          </li>
          <li>Restart the dev server and refresh this page.</li>
        </ol>
        <p
          className="mt-7 rounded-xl px-4 py-3 text-sm leading-6"
          style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
        >
          Use only the anon/public key in frontend settings. Never use a service-role key here.
        </p>
      </section>
    </main>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <SupabaseSetupNotice />
  return <LinkPulsePage />
}

function LinkPulsePage() {
  // ── Theme hook — dark/light mode manage karta hai ────────────────────────
  const { theme, toggleTheme } = useTheme()

  // ── Link Manager hook — database + form logic ────────────────────────────
  const linkManager = useLinkManager()

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion || !("IntersectionObserver" in window)) return

    const elements = document.querySelectorAll(
      "main > section:not(.hero), .feature-card, .step-card, .faq-item",
    )
    const staggeredClasses = ["feature-card", "step-card", "faq-item"]
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add("is-visible")
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })

    elements.forEach((element) => {
      const staggerClass = staggeredClasses.find((className) => element.classList.contains(className))
      if (staggerClass) {
        const siblings = Array.from(element.parentElement?.children ?? [])
          .filter((sibling) => sibling.classList.contains(staggerClass))
        const delay = Math.min(siblings.indexOf(element) * 70, 280)
        element.style.setProperty("--scroll-reveal-delay", `${delay}ms`)
      }

      element.classList.add("scroll-reveal")
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  // ── Intro Animation State ─────────────────────────────────────────────────
  // heroReady = intro animation khatam hua? (tab hero text dikhao)
  const [heroReady, setHeroReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const handleIntroDone = useCallback(() => setHeroReady(true), [])

  useEffect(() => {
    const timer = window.setTimeout(() => setVideoReady(true), HERO_REVEAL_MS)
    return () => window.clearTimeout(timer)
  }, [])

  // Background video intro ke reveal ke saath zoom-in hota hai.
  // ── Scroll Refs ───────────────────────────────────────────────────────────
  // Shortener section pe smooth scroll karne ke liye
  const shortenerRef = useRef(null)
  const scrollToShortener = () => shortenerRef.current?.scrollIntoView({ behavior: "smooth" })
  const focusShortener = () => {
    scrollToShortener()
    window.setTimeout(() => document.getElementById("long-url")?.focus({ preventScroll: true }), 450)
  }
  const scrollToFeatures = () => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
  const analyticsRef = useRef(null)
  const openAnalytics = () => analyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  const viewLinks = () => linkManager.tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  const createAnotherLink = () => {
    linkManager.closeModal()
    focusShortener()
  }

  // ── Redirect Screen ───────────────────────────────────────────────────────
  // Agar koi shortened link open kara ja raha hai to sirf loading screen dikhao
  if (linkManager.redirecting || linkManager.redirectError) {
    return <RedirectLoader passwordState={linkManager.passwordState} error={linkManager.redirectError} />
  }

  // ── Main Page Render ──────────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen font-sans antialiased overflow-x-hidden"
      style={{ color: "var(--text-primary)" }}
    >
      {/* ── Global decorative elements (har section mein common) ─────────── */}
      <CustomCursor />
      <AnimatedBackground />

      {/* ── Intro animation — page load pe pehli baar dikhti hai ─────────── */}
      <IntroAnimation onDone={handleIntroDone} />

      {/* ── Mobile navigation bar ─────────────────────────────────────────── */}
      <MobileNav
        onGetStarted={scrollToShortener}
        onOpenAnalytics={openAnalytics}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE SECTIONS — upar se neeche
         ══════════════════════════════════════════════════════════════════════ */}

      {/* 1. Hero Section — LinkPulse URL preview + headline + CTAs */}
      <HeroSection
        heroReady={heroReady}
        videoReady={videoReady}
        theme={theme}
        onScrollDown={scrollToShortener}
        onViewLinks={viewLinks}
        onScrollFeatures={scrollToFeatures}
      />

      {/* 2. Shortener Section — link banane ka form + stats + table */}
      <ShortenerSection
        sectionRef={shortenerRef}
        tableRef={linkManager.tableRef}
        analyticsRef={analyticsRef}
        onViewLinks={viewLinks}
        onCreateLink={focusShortener}
        links={linkManager.links}
        loading={linkManager.loading}
        totalClicks={linkManager.totalClicks}
        activeLinksCount={linkManager.activeLinksCount}
        longUrl={linkManager.longUrl}
        setLongUrl={linkManager.setLongUrl}
        alias={linkManager.alias}
        setAlias={linkManager.setAlias}
        aliasError={linkManager.aliasError}
        setAliasError={linkManager.setAliasError}
        passwordProtected={linkManager.passwordProtected}
        setPasswordProtected={linkManager.setPasswordProtected}
        password={linkManager.password}
        setPassword={linkManager.setPassword}
        generating={linkManager.generating}
        copied={linkManager.copied}
        onSubmit={linkManager.handleGenerate}
        onCopy={linkManager.copyLink}
        onToggleDisable={linkManager.toggleDisable}
        onDelete={linkManager.deleteLink}
        expiresAt={linkManager.expiresAt}
        setExpiresAt={linkManager.setExpiresAt}
        clickLimit={linkManager.clickLimit}
        setClickLimit={linkManager.setClickLimit}
        isBurnEnabled={linkManager.isBurnEnabled}
        setIsBurnEnabled={linkManager.setIsBurnEnabled}
        errorMessage={linkManager.errorMessage || linkManager.redirectError}
      />
      {/* 3. Features Section — feature cards grid */}
      <FeaturesSection />

      {/* 4. How It Works Section — 3 steps with connector line */}
      <HowItWorksSection />

      {/* 5. FAQ Section — continuously moving questions and answers */}
      <FAQSection />

      {/* 6. CTA Banner — "Get Started Free" promotional banner */}
      <CTABanner onGetStarted={scrollToShortener} />

      {/* 7. Footer — logo + credits */}
      <Footer theme={theme} />

      {/* ── Modal — link create hone ke baad popup ────────────────────────── */}
      {/* Sirf tab render hota hai jab createdModal null nahi ho */}
      <CreatedModal
        modalData={linkManager.createdModal}
        copied={linkManager.copied}
        onCopy={linkManager.copyLink}
        onClose={linkManager.closeModal}
        onViewTable={linkManager.viewInTable}
        onCreateAnother={createAnotherLink}
      />
    </main>
  )
}
