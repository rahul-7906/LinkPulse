"use client"

import { useEffect, useState } from "react"

const WORD = "LinkPulse"
const LETTER_INTERVAL_MS = 82
const BOOT_DELAY_MS = 1050
const CURTAIN_DURATION_MS = 760
const REDUCED_BOOT_DELAY_MS = 140
const REDUCED_CURTAIN_DURATION_MS = 180
export const HERO_REVEAL_MS = BOOT_DELAY_MS

type Phase = "boot" | "reveal" | "done"

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("boot")
  const [typedLength, setTypedLength] = useState(0)
  const skipIntro = typeof window !== "undefined" && window.matchMedia("(max-width: 700px), (pointer: coarse)").matches
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    if (skipIntro) {
      onDone()
      return undefined
    }
    const typingDuration = reduceMotion ? 0 : WORD.length * LETTER_INTERVAL_MS
    const bootDelay = reduceMotion ? REDUCED_BOOT_DELAY_MS : Math.max(BOOT_DELAY_MS, typingDuration + 220)
    const curtainDuration = reduceMotion ? REDUCED_CURTAIN_DURATION_MS : CURTAIN_DURATION_MS
    const typingTimers: number[] = []
    if (!reduceMotion) for (let index = 1; index <= WORD.length; index += 1) {
      typingTimers.push(window.setTimeout(() => setTypedLength(index), index * LETTER_INTERVAL_MS))
    }
    const revealTimer = window.setTimeout(() => { setPhase("reveal"); onDone() }, bootDelay)
    const finishTimer = window.setTimeout(() => setPhase("done"), bootDelay + curtainDuration + 80)
    return () => {
      typingTimers.forEach(window.clearTimeout)
      window.clearTimeout(revealTimer)
      window.clearTimeout(finishTimer)
    }
  }, [onDone, reduceMotion, skipIntro])

  if (skipIntro || phase === "done") return null
  const visibleLength = reduceMotion ? WORD.length : typedLength
  return (
    <div className={`intro-screen intro-screen--${phase}`} aria-hidden="true">
      <div className="intro-content">
        <h1 className="intro-title" aria-label="LinkPulse">
          <span className="intro-title-link">{WORD.slice(0, Math.min(visibleLength, 4))}</span>
          <span className="intro-title-pulse">{WORD.slice(4, visibleLength)}</span>
          <span className="intro-caret" />
        </h1>
      </div>
    </div>
  )
}
