import { useEffect, useState } from "react"
import {
  ArrowLeft, ArrowRight, BarChart3, Check, Link2, MousePointerClick,
  Pause, Play, ShieldCheck,
} from "lucide-react"

const STEPS = [
  {
    num: "01",
    title: "Paste your URL",
    desc: "Drop any long URL into the input field. We accept any valid web address.",
    preview: "Add the destination you want to share.",
  },
  {
    num: "02",
    title: "Customize & secure",
    desc: "Set a custom alias, add password protection, configure expiry rules.",
    preview: "Choose a memorable alias and optional safeguards.",
  },
  {
    num: "03",
    title: "Share and track",
    desc: "Your short link is ready to share. Review visits, device type, expiry, and click-limit status in your table.",
    preview: "Share your link and follow its activity.",
  },
]

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )

  useEffect(() => {
    if (!isPlaying) return undefined

    const interval = window.setInterval(() => {
      setActiveStep(current => (current + 1) % STEPS.length)
    }, 5200)
    return () => window.clearInterval(interval)
  }, [isPlaying])

  const selectStep = index => setActiveStep((index + STEPS.length) % STEPS.length)

  return (
    <section id="how-it-works" className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <div className="section-badge mx-auto mb-4">
            <MousePointerClick className="size-3.5 text-violet-400" /> HOW IT WORKS
          </div>
          <h2 className="section-title">
            From URL to insight<br />
            <span className="gradient-text">in 3 steps.</span>
          </h2>
          <p className="section-sub mx-auto mt-4">
            Watch how each step turns a long link into one you can share and understand.
          </p>
        </div>

        <div className="how-it-works-layout">
          <div className="how-it-works-steps" role="tablist" aria-label="LinkPulse walkthrough steps">
            {STEPS.map((step, index) => {
              const active = activeStep === index
              return (
                <button
                  key={step.num}
                  type="button"
                  role="tab"
                  id={`walkthrough-tab-${index}`}
                  aria-selected={active}
                  aria-controls="walkthrough-preview"
                  className={`step-card walkthrough-step${active ? " is-active" : ""}`}
                  onClick={() => selectStep(index)}
                >
                  <span className="step-num"><span>{step.num}</span></span>
                  <span className="walkthrough-step-copy">
                    <span className="walkthrough-step-title">{step.title}</span>
                    <span className="walkthrough-step-description">{step.desc}</span>
                  </span>
                  <ArrowRight className="walkthrough-step-arrow" aria-hidden="true" />
                </button>
              )
            })}
          </div>

          <div className="walkthrough-panel">
            <div className="walkthrough-panel-header">
              <span className="walkthrough-live-dot" />
              <span>PRODUCT WALKTHROUGH</span>
              <span className="walkthrough-step-count">{STEPS[activeStep].num} / 03</span>
            </div>

            <div
              key={activeStep}
              id="walkthrough-preview"
              role="tabpanel"
              aria-labelledby={`walkthrough-tab-${activeStep}`}
              aria-live="polite"
              className={`walkthrough-scene walkthrough-scene--${activeStep + 1}`}
            >
              <div className="walkthrough-browser">
                <div className="walkthrough-browser-bar">
                  <span /><span /><span />
                  <div className="walkthrough-address"><Link2 aria-hidden="true" /> linkpulse.app</div>
                </div>
                <div className="walkthrough-browser-content">
                  <div className="walkthrough-mini-label">LINKPULSE · {activeStep === 2 ? "YOUR LINKS" : "CREATE A LINK"}</div>
                  {activeStep === 0 && <PasteScene />}
                  {activeStep === 1 && <CustomizeScene />}
                  {activeStep === 2 && <TrackScene />}
                </div>
              </div>
              <p className="walkthrough-caption">{STEPS[activeStep].preview}</p>
            </div>

            <div className="walkthrough-controls">
              <div className="walkthrough-dots" aria-label="Choose walkthrough step">
                {STEPS.map((step, index) => (
                  <button
                    key={step.num}
                    type="button"
                    aria-label={`Show step ${index + 1}: ${step.title}`}
                    aria-current={activeStep === index ? "step" : undefined}
                    className={`walkthrough-dot${activeStep === index ? " is-active" : ""}`}
                    onClick={() => selectStep(index)}
                  />
                ))}
              </div>
              <div className="walkthrough-control-buttons">
                <button type="button" className="walkthrough-control" onClick={() => selectStep(activeStep - 1)} aria-label="Previous step">
                  <ArrowLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="walkthrough-control walkthrough-play"
                  onClick={() => setIsPlaying(playing => !playing)}
                  aria-label={isPlaying ? "Pause walkthrough" : "Play walkthrough"}
                >
                  {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                </button>
                <button type="button" className="walkthrough-control" onClick={() => selectStep(activeStep + 1)} aria-label="Next step">
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="walkthrough-progress" aria-hidden="true">
              <span key={`${activeStep}-${isPlaying}`} className={isPlaying ? "is-playing" : ""} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PasteScene() {
  return (
    <div className="walkthrough-form-scene">
      <span className="walkthrough-field-label">LONG URL</span>
      <div className="walkthrough-input">
        <span>https://example.com/your/very/long/destination</span>
        <span className="walkthrough-caret" />
      </div>
      <div className="walkthrough-input-hint">Paste the link you want to shorten</div>
      <div className="walkthrough-scene-footer"><span className="walkthrough-secondary-action">Custom alias <span>Optional</span></span><span className="walkthrough-continue">Continue <ArrowRight aria-hidden="true" /></span></div>
    </div>
  )
}

function CustomizeScene() {
  return (
    <div className="walkthrough-form-scene">
      <span className="walkthrough-field-label">YOUR SHORT LINK</span>
      <div className="walkthrough-input walkthrough-alias"><span>go.lp/</span><strong>launch-day</strong><Check aria-hidden="true" /></div>
      <div className="walkthrough-option-row"><ShieldCheck aria-hidden="true" /><span>Password protection</span><span className="walkthrough-switch" /></div>
      <div className="walkthrough-scene-footer"><span className="walkthrough-secondary-action">Expiry date <span>Optional</span></span><span className="walkthrough-continue">Save link <Check aria-hidden="true" /></span></div>
    </div>
  )
}

function TrackScene() {
  return (
    <div className="walkthrough-track-scene">
      <div className="walkthrough-created-link"><span><Check aria-hidden="true" /></span><div><strong>Link is ready to share</strong><small>go.lp/launch-day</small></div><Link2 aria-hidden="true" /></div>
      <div className="walkthrough-activity-card">
        <div><span>CLICK ACTIVITY</span><small>Visits over time</small></div>
        <BarChart3 className="walkthrough-chart-icon" aria-hidden="true" />
        <div className="walkthrough-chart" aria-hidden="true">
          {[22, 42, 30, 58, 38, 78, 54, 92, 63, 72, 100, 76].map((height, index) => <i key={index} style={{ "--bar-height": `${height}%`, "--bar-delay": `${index * 70}ms` }} />)}
        </div>
        <div className="walkthrough-chart-labels"><span>PAST</span><span>NOW</span></div>
      </div>
    </div>
  )
}
