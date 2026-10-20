"use client"

import { useEffect, useState } from "react"

const CURTAIN_DELAY = 2100
const CURTAIN_DURATION = 1200
const ANIM_TOTAL = CURTAIN_DELAY + CURTAIN_DURATION + 900

export const INTRO_DURATION_MS = CURTAIN_DELAY + CURTAIN_DURATION
export const HERO_REVEAL_MS = CURTAIN_DELAY + CURTAIN_DURATION - 160

type Phase = "boot" | "reveal" | "done"

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("boot")

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), CURTAIN_DELAY)
    const t2 = setTimeout(() => onDone(), HERO_REVEAL_MS)
    const t3 = setTimeout(() => setPhase("done"), ANIM_TOTAL)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onDone])

  if (phase === "done") return null

  return (
    <div className={`intro-screen intro-screen--${phase}`} aria-hidden="true">
      <div className="intro-noise" />
      <div className="intro-grid" />
      <div className="intro-aura" />

      <div className="intro-content">
        <div className="intro-mark">
          <span className="intro-mark-ring intro-mark-ring--outer" />
          <span className="intro-mark-ring intro-mark-ring--inner" />
          <span className="intro-mark-core">LP</span>
        </div>
        <div className="intro-wordmark">
          <span>LINK</span><b>PULSE</b>
        </div>
        <div className="intro-status">
          <span className="intro-status-dot" />
          <span>Establishing secure signal</span>
          <span className="intro-status-code">LP / 01</span>
        </div>
      </div>

      <div className="intro-progress"><span /></div>
      <div className="intro-corner intro-corner--tl">LINKPULSE<span>SYS.ONLINE</span></div>
      <div className="intro-corner intro-corner--br">SECURE ROUTING<span>2026.01</span></div>
    </div>
  )
}
