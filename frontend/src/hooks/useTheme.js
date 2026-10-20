// ─── useTheme.js ─────────────────────────────────────────────────────────────
// Ye ek custom React hook hai jo theme (dark/light) ko manage karta hai.
// Custom hooks ka naam "use" se shuru hota hai — ye React ka rule hai.
//
// Ye hook kya karta hai:
//   1. Har page load par dark theme se start karta hai
//   2. Theme change hone pe <html> element ka data-theme attribute update karta hai
//      (taaki CSS variables globally kaam karein)
//   3. toggleTheme function return karta hai jisse dark/light switch ho sake
//
// Usage:
//   const { theme, toggleTheme } = useTheme()

import { useCallback, useEffect, useState } from "react"
import { flushSync } from "react-dom"

export function useTheme() {
  // Dark mode is the default for every page load.
  // Ye sirf ek baar run hoga — har render pe nahi
  const [theme, setTheme] = useState("dark")

  // Theme change hone pe HTML element pe data-theme set karo
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  // Toggle function — dark → light ya light → dark
  // useCallback se ye function re-render pe recreate nahi hoga (performance optimization)
  const toggleTheme = useCallback((event) => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    const updateTheme = () => flushSync(() => setTheme(nextTheme))
    if (event?.clientX && event?.clientY) {
      document.documentElement.style.setProperty("--theme-x", `${event.clientX}px`)
      document.documentElement.style.setProperty("--theme-y", `${event.clientY}px`)
    }

    if (typeof document.startViewTransition === "function") {
      document.startViewTransition(updateTheme)
    } else {
      document.documentElement.classList.add("theme-transitioning")
      updateTheme()
      window.setTimeout(() => {
        document.documentElement.classList.remove("theme-transitioning")
      }, 650)
    }
  }, [theme])

  // Hook se theme aur toggleTheme return karo
  return { theme, toggleTheme }
}
