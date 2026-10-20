// ─── HeroSection.jsx ─────────────────────────────────────────────────────────
// Ye page ka sabse pehla (aur sabse bada) section hai.
// Isme ye sab hai:
//   - Background video (theme ke hisaab se toned)
//   - LinkPulse URL signal card
//   - Floating URL pills (decorative)
//   - Main headline "Links That Think For You."
//   - CTA buttons (Shorten a Link, View Links, See Features)
//   - Feature pillars (click tracking, password protection, expiry rules)
//   - Scroll indicator button (neeche arrow)
//   - Mouse parallax effect (hero glass layer mouse ke saath thoda tilt hoti hai)
//
// Props:
//   heroReady      — intro animation khatam hua ya nahi (text fade-in ke liye)
//   videoReady     — video zoom-in shuru karna hai ya nahi
//   theme          — "dark" ya "light" (video filter ke liye)
//   onScrollDown   — shortener section pe scroll karne ke liye function
//   onViewLinks    — links table pe scroll karne ke liye function
//   onScrollFeatures — features section pe scroll karne ke liye function

import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowUpRight, ChevronRight, Sparkles } from "lucide-react"
import FloatingPill from "../ui-custom/FloatingPill"

const TYPED_PHRASES = ["secure links.", "clean analytics.", "better campaigns."]
const GLOBE_VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104036_bd6924f6-3c8e-417e-8465-6d03c8c2e9e6.mp4"
const GLOBE_VIDEO_POSTER = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/82e7eb75-c65f-490a-99b5-f3d1cad54200.webp"

export default function HeroSection({
  heroReady,
  videoReady,
  theme,
  onScrollDown,
  onViewLinks,
  onScrollFeatures,
}) {
  const [typedText, setTypedText] = useState("")
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  // heroRef = poora hero section element (parallax calculation ke liye)
  // heroBackgroundRef = globe video layer jo mouse se parallax hoti hai
  // heroParallaxFrame = animation frame ID (cleanup ke liye)
  const heroRef = useRef(null)
  const heroBackgroundRef = useRef(null)
  const globeVideoRefs = useRef([])
  const activeGlobeVideoRef = useRef(0)
  const globeSwapRef = useRef(false)
  const globeSwapTimerRef = useRef(null)
  const [activeGlobeVideo, setActiveGlobeVideo] = useState(0)
  const heroParallaxFrame = useRef(null)

  // ── Mouse parallax effect — hero glass layer mouse pe react kare ───────────
  const handleHeroPointerMove = (event) => {
    // Touch screens aur reduced-motion users ke liye skip karo
    if (
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return

    const bounds = heroRef.current?.getBoundingClientRect()
    if (!bounds) return

    // Mouse position ko center se relative coordinates mein convert karo
    // phir 40px range mein scale karo
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 40
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 40

    cancelAnimationFrame(heroParallaxFrame.current)
    heroParallaxFrame.current = requestAnimationFrame(() => {
      // CSS custom properties set karo — ye CSS mein use hoti hain
      heroBackgroundRef.current?.style.setProperty("--parallax-x", `${x}px`)
      heroBackgroundRef.current?.style.setProperty("--parallax-y", `${y}px`)
    })
  }

  // ── Mouse bahar jaane pe glass layer reset karo ────────────────────────────
  const resetHeroParallax = () => {
    cancelAnimationFrame(heroParallaxFrame.current)
    heroParallaxFrame.current = requestAnimationFrame(() => {
      heroBackgroundRef.current?.style.setProperty("--parallax-x", "0px")
      heroBackgroundRef.current?.style.setProperty("--parallax-y", "0px")
    })
  }

  // Cleanup — unmount pe pending animation frame cancel karo
  useEffect(() => () => cancelAnimationFrame(heroParallaxFrame.current), [])

  useEffect(() => {
    const videos = globeVideoRefs.current
    const crossfadeSeconds = 0.9

    const swapVideo = async () => {
      if (globeSwapRef.current) return
      const currentIndex = activeGlobeVideoRef.current
      const currentVideo = videos[currentIndex]
      const nextIndex = 1 - currentIndex
      const nextVideo = videos[nextIndex]

      if (
        !currentVideo ||
        !nextVideo ||
        !Number.isFinite(currentVideo.duration) ||
        currentVideo.duration - currentVideo.currentTime > crossfadeSeconds ||
        nextVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      ) return

      globeSwapRef.current = true
      nextVideo.currentTime = 0

      try {
        await nextVideo.play()
      } catch {
        globeSwapRef.current = false
        return
      }

      activeGlobeVideoRef.current = nextIndex
      setActiveGlobeVideo(nextIndex)
      globeSwapTimerRef.current = window.setTimeout(() => {
        currentVideo.pause()
        currentVideo.currentTime = 0
        globeSwapRef.current = false
      }, crossfadeSeconds * 1000 + 100)
    }

    videos.forEach(video => video?.addEventListener("timeupdate", swapVideo))
    return () => {
      videos.forEach(video => video?.removeEventListener("timeupdate", swapVideo))
      if (globeSwapTimerRef.current !== null) window.clearTimeout(globeSwapTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const phrase = TYPED_PHRASES[phraseIndex]
    const completed = typedText === phrase
    const empty = typedText.length === 0
    const delay = completed ? 1500 : empty && isDeleting ? 350 : isDeleting ? 42 : 78
    const timer = window.setTimeout(() => {
      if (completed) setIsDeleting(true)
      else if (isDeleting && empty) {
        setIsDeleting(false)
        setPhraseIndex(index => (index + 1) % TYPED_PHRASES.length)
      } else {
        setTypedText(value => isDeleting ? value.slice(0, -1) : phrase.slice(0, value.length + 1))
      }
    }, delay)
    return () => window.clearTimeout(timer)
  }, [isDeleting, phraseIndex, typedText])

  return (
    <section
      ref={heroRef}
      className="hero relative h-screen overflow-hidden flex items-end"
      onPointerLeave={resetHeroParallax}
      onPointerMove={handleHeroPointerMove}
    >
      {/* Looping globe video — theme overlay keeps the scene aligned with the UI. */}
      <div
        ref={heroBackgroundRef}
        className="hero-globe-layer absolute inset-[-5%] z-0"
        aria-hidden="true"
        style={{ transform: "translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0)" }}
      >
        {[0, 1].map(index => (
          <video
            key={index}
            ref={element => { globeVideoRefs.current[index] = element }}
            autoPlay={index === 0}
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            poster={GLOBE_VIDEO_POSTER}
            className={`hero-globe-video absolute inset-0 h-full w-full object-cover${activeGlobeVideo === index ? " is-active" : ""}`}
            src={GLOBE_VIDEO_URL}
            style={{
              transform: videoReady ? "scale(1.05)" : "scale(0.85)",
              filter: theme === "dark"
                ? "brightness(0.56) saturate(1.12) contrast(1.08)"
                : "brightness(0.60) saturate(0.76) contrast(0.98)",
              transition: "opacity 0.9s linear, transform 2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.7s ease",
            }}
          />
        ))}
      </div>
      <div className="hero-globe-tint absolute inset-0 z-[1]" aria-hidden="true" />
      <div className="hero-light-content-scrim absolute inset-0 z-[1]" aria-hidden="true" />

      {/* ── Bottom gradient overlay — text ko background se separate karta hai */}
      <div
        className="hero-bottom-overlay absolute inset-x-0 bottom-0 h-[70%]"
        aria-hidden="true"
      />

      {/* ── Floating URL pills — right side pe decorative badges ─────────── */}
      <FloatingPill text="go.lp/launch-2025"   delay={0}   x={76} y={18} />
      <FloatingPill text="go.lp/product-hunt"  delay={1.2} x={78} y={38} className="floating-pill-hide-tablet" />
      <FloatingPill text="go.lp/investor-deck" delay={2.4} x={72} y={58} />
      <FloatingPill text="go.lp/waitlist"      delay={0.8} x={82} y={76} className="floating-pill-hide-tablet" />

      {/* ── Main hero content — headline, subtext, buttons ───────────────── */}
      <div className="hero-content relative z-[2] w-full px-6 pb-16 md:px-14 lg:px-20">
        <div className="max-w-5xl">

          {/* Badge — "Next-Gen URL Intelligence Platform" */}
          <div
            className="hero-badge mb-6"
            style={{
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? "translateY(0)" : "translateY(16px)",
              transition: "opacity .6s ease, transform .6s ease",
            }}
          >
            <Sparkles className="size-3 text-violet-400" />
            <span>Next-Gen URL Intelligence Platform</span>
          </div>

          {/* Main headline */}
          <h1
            className="hero-headline"
            style={{
              opacity: heroReady ? 1 : 0,
              filter: heroReady ? "blur(0px)" : "blur(24px)",
              transform: heroReady ? "translateY(0px)" : "translateY(32px)",
              transition: "opacity 1s cubic-bezier(0.16,1,0.3,1), filter 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            Links That<br />
            <span className="gradient-text">Think For You.</span>
          </h1>
          <div className="hero-typed-line" aria-live="polite">
            Build <span>{typedText}</span><i aria-hidden="true" />
          </div>

          {/* Subtitle / description */}
          <p
            className="hero-sub"
            style={{
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? "translateY(0)" : "translateY(20px)",
              transition: "opacity .8s ease 120ms, transform .8s ease 120ms",
            }}
          >
            LinkPulse goes beyond shortening. Create memorable links with optional
            passwords, expiry rules, click limits, and useful visit analytics.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-wrap items-center gap-4 mt-8"
            style={{
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? "translateY(0)" : "translateY(20px)",
              transition: "opacity .8s ease 200ms, transform .8s ease 200ms",
            }}
          >
            {/* Primary button — shortener section pe le jaata hai */}
            <button onClick={onScrollDown} className="cta-primary">
              Shorten a Link <ArrowUpRight className="size-4" />
            </button>

            <button onClick={onViewLinks} className="cta-ghost">
              View your shortened links <ArrowUpRight className="size-4" />
            </button>

            {/* Ghost button — features section pe le jaata hai */}
            <button onClick={onScrollFeatures} className="cta-ghost">
              See Features <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Feature pillars — 3 chhote text badges */}
          <div
            className="flex items-center gap-6 mt-10"
            style={{ opacity: heroReady ? 1 : 0, transition: "opacity .8s ease 280ms" }}
          >
            {["CLICK TRACKING", "PASSWORD PROTECTION", "EXPIRY RULES"].map((p, i) => (
              <div key={p} className="hero-pillar" style={{ transitionDelay: `${300 + i * 80}ms` }}>
                <span className="pillar-dot" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scroll indicator — bottom-right mein bouncing arrow button ───── */}
      <button onClick={onScrollDown} className="scroll-indicator z-30">
        <ArrowDown className="size-4 animate-bounce" />
      </button>
    </section>
  )
}
