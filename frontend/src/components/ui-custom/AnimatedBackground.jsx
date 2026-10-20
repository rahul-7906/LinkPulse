// ─── AnimatedBackground.jsx ──────────────────────────────────────────────────
// Ye component page ke peeche wala animated background banata hai.
// Isme 4 glowing "orbs" (bade rang ke circles), ek grid pattern,
// aur ek interactive dot field hai jo mouse ke saath react karta hai.

import { useEffect, useRef } from "react"

export default function AnimatedBackground() {
  // canvasRef se hum canvas element ko directly access karte hain (DOM element pakadne ke liye)
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    // 2D drawing context milta hai canvas ka — isse hum dots aur lines draw karte hain
    const context = canvas.getContext("2d")
    if (!context) return undefined

    // pointer = mouse ki current position track karta hai
    const pointer = { x: -1000, y: -1000, active: false }

    // Agar user ne browser mein "reduce motion" preference set ki hai to animation band karo
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let width = 0
    let height = 0
    let nodes = []
    let animationFrame      // requestAnimationFrame ka ID (cleanup ke liye)

    // ── Canvas ko resize karna jab window size change ho ──────────────────────
    const resize = () => {
      // High-DPI (Retina) screens ke liye pixel ratio adjust karo
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)

      nodes = Array.from({ length: width < 700 ? 42 : 78 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        phase: Math.random() * Math.PI * 2,
        radius: 0.6 + Math.random() * 1.2,
      }))
    }

    // ── Main draw loop — har frame mein ye chalti hai ──────────────────────────
    const draw = (time = 0) => {
      // Dark theme check: agar theme "light" nahi hai to dark hai
      const dark = document.documentElement.dataset.theme !== "light"

      // Pichla frame erase karo
      context.clearRect(0, 0, width, height)

      const motionTime = reduceMotion ? 0 : time * 0.0007
      const influenceRadius = 260

      nodes.forEach((node) => {
        const driftX = Math.sin(motionTime * 0.9 + node.phase) * 10
        const driftY = Math.cos(motionTime * 0.7 + node.phase) * 10
        let x = node.x + driftX
        let y = node.y + driftY

        const distance = Math.hypot(pointer.x - x, pointer.y - y)
        const influence = pointer.active ? Math.max(0, 1 - distance / influenceRadius) : 0
        if (influence > 0) {
          const push = influence * 14
          x += (x - pointer.x) / Math.max(distance, 1) * push
          y += (y - pointer.y) / Math.max(distance, 1) * push
        }

        context.beginPath()
        context.arc(x, y, node.radius + influence * 1.8, 0, Math.PI * 2)
        context.fillStyle = dark
          ? `rgba(125, 211, 252, ${0.22 + influence * 0.65})`
          : `rgba(109, 40, 217, ${0.12 + influence * 0.45})`
        context.fill()
      })

      // A soft radar sweep replaces the old hover constellation.
      if (pointer.active) {
        const pulse = reduceMotion ? 0 : (Math.sin(time * 0.003) + 1) * 0.5
        const radius = 72 + pulse * 34
        const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, influenceRadius)
        glow.addColorStop(0, dark ? "rgba(86, 216, 255, 0.08)" : "rgba(139, 92, 246, 0.06)")
        glow.addColorStop(0.45, dark ? "rgba(86, 216, 255, 0.025)" : "rgba(139, 92, 246, 0.018)")
        glow.addColorStop(1, "rgba(0, 0, 0, 0)")
        context.fillStyle = glow
        context.fillRect(pointer.x - influenceRadius, pointer.y - influenceRadius, influenceRadius * 2, influenceRadius * 2)

        context.beginPath()
        context.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2)
        context.strokeStyle = dark ? `rgba(86, 216, 255, ${0.16 + pulse * 0.10})` : "rgba(124, 58, 237, 0.12)"
        context.lineWidth = 1
        context.stroke()

        context.beginPath()
        context.arc(pointer.x, pointer.y, radius + 16, -0.8, 0.75)
        context.strokeStyle = dark ? "rgba(155, 140, 255, 0.22)" : "rgba(124, 58, 237, 0.14)"
        context.stroke()
      }

      // Agar reduce motion nahi hai to next frame request karo
      if (!reduceMotion) animationFrame = requestAnimationFrame(draw)
    }

    // ── Mouse movement track karna ────────────────────────────────────────────
    const movePointer = (event) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
    }
    const leavePointer = () => { pointer.active = false }

    // Setup: resize karo, draw shuru karo, aur events attach karo
    resize()
    draw()
    window.addEventListener("resize", resize)
    window.addEventListener("pointermove", movePointer, { passive: true })
    window.addEventListener("pointerleave", leavePointer)

    // Cleanup function: jab component unmount ho to sab hata do
    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", movePointer)
      window.removeEventListener("pointerleave", leavePointer)
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, []) // [] = sirf ek baar run karo (mount pe)

  return (
    // pointer-events-none = ye sirf visual hai, click nahi hogi
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* 4 animated glowing orbs (colourful blurred circles) */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />

      {/* Subtle grid lines overlay */}
      <div className="grid-overlay" />

      {/* Ambient signal field — pointer par radar sweep aur arcs dikhata hai */}
      <canvas ref={canvasRef} className="interactive-signal-field" />
    </div>
  )
}
