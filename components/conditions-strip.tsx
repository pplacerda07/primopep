'use client'

import { useCallback, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { COPY } from '@/lib/content'

const { items, ariaLabel } = COPY.conditions

const TITLE_ID = 'condicoes-comerciais'

// Same speed on every screen: one loop lasts (copy width / speed).
const SPEED_PX_PER_S = 45
// Server render: each copy holds the list three times (about 3970px), wider than a 2560px
// band even before the web font loads. Until the band is measured, the CSS fallback duration
// (--animate-marquee in globals.css) roughly matches this width at 45 px/s.
const INITIAL_REPEAT = 3

const TEXT = 'whitespace-nowrap text-sm text-silver'
const DOT = 'size-1 shrink-0 rounded-full bg-gold'

/**
 * One copy of the band: the items repeated `repeat` times. Every item carries the same
 * trailing gap and dot, so one copy ends exactly where the next begins (invisible seam).
 */
function MarqueeCopy({ repeat, passRef }: { repeat: number; passRef?: Ref<HTMLSpanElement> }) {
  return (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: repeat }, (_, pass) => (
        <span key={pass} ref={pass === 0 ? passRef : undefined} className="flex shrink-0 items-center">
          {items.map((item, index) => (
            <span key={index} className="flex shrink-0 items-center gap-5 pr-5 sm:gap-6 sm:pr-6">
              <span className={TEXT}>{item}</span>
              <span className={DOT} />
            </span>
          ))}
        </span>
      ))}
    </div>
  )
}

export function ConditionsStrip() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const passRef = useRef<HTMLSpanElement>(null)
  // Distance (px) the running animation travels per loop, as last applied.
  const loopWidthRef = useRef<number | null>(null)
  const repeatRef = useRef(INITIAL_REPEAT)
  const [repeat, setRepeat] = useState(INITIAL_REPEAT)

  /**
   * Gives the running CSS animation the constant speed for the current width and keeps the
   * words exactly where they are, so measuring, resizing or the web font swap never cause a jump.
   */
  const syncSpeed = useCallback(() => {
    const track = trackRef.current
    const pass = passRef.current
    if (!track || !pass) return

    const passWidth = pass.getBoundingClientRect().width
    // The track holds two identical copies; the keyframes travel exactly one (-50%).
    const loopWidth = track.getBoundingClientRect().width / 2
    // Hidden (reduced motion) or not laid out yet.
    if (!passWidth || !loopWidth) return

    const duration = (loopWidth / SPEED_PX_PER_S) * 1000
    const animation = typeof track.getAnimations === 'function' ? track.getAnimations()[0] : undefined
    const effect = animation?.effect

    const previousWidth = loopWidthRef.current ?? loopWidth
    loopWidthRef.current = loopWidth

    if (animation && effect) {
      try {
        const previousDuration = Number(effect.getComputedTiming().duration)
        if (Math.abs(previousDuration - duration) < 1 && Math.abs(previousWidth - loopWidth) < 0.5) return

        const time = typeof animation.currentTime === 'number' ? animation.currentTime : 0
        const traveled =
          previousDuration > 0 ? ((time % previousDuration) / previousDuration) * previousWidth : 0
        // Every pass of the list is identical, so moving back by whole passes shows the same words.
        const offset = traveled % passWidth

        effect.updateTiming({ duration })
        animation.currentTime = (offset / loopWidth) * duration
        return
      } catch {
        // Older engines: fall back to the plain CSS duration below (may jump once).
      }
    }

    track.style.animationDuration = `${duration}ms`
  }, [])

  // Runs on mount and after every change in the number of passes (before paint).
  useLayoutEffect(() => {
    syncSpeed()
  }, [repeat, syncSpeed])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const pass = passRef.current
    if (!viewport || !pass || typeof ResizeObserver === 'undefined') return

    const measure = () => {
      const viewportWidth = viewport.clientWidth
      const passWidth = pass.getBoundingClientRect().width
      if (!viewportWidth || !passWidth) return

      // One copy must be wider than the band, otherwise the loop would show an empty gap.
      const next = Math.max(1, Math.ceil((viewportWidth + 1) / passWidth))
      if (next !== repeatRef.current) {
        repeatRef.current = next
        setRepeat(next)
      } else {
        syncSpeed()
      }
    }

    // Fires once on observe, then on resize, rotation and when the web font swaps in.
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(pass)
    return () => observer.disconnect()
  }, [syncSpeed])

  return (
    <section aria-labelledby={TITLE_ID} className="border-y border-border/60 bg-card/30">
      <h2 id={TITLE_ID} className="sr-only">
        {ariaLabel}
      </h2>

      {/* Continuous line, never paused. Decorative copy: the real list is the <ul> below. */}
      <div
        ref={viewportRef}
        aria-hidden="true"
        className="overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] motion-reduce:hidden"
      >
        <div ref={trackRef} className="flex w-max animate-marquee will-change-transform">
          <MarqueeCopy repeat={repeat} passRef={passRef} />
          <MarqueeCopy repeat={repeat} />
        </div>
      </div>

      {/* Real list: read by screen readers, shown wrapped and static under prefers-reduced-motion. */}
      <div className="mx-auto max-w-7xl px-4 motion-reduce:py-3 sm:px-6">
        <ul className="sr-only flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 motion-reduce:not-sr-only">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <span aria-hidden="true" className={DOT} />
              <span className={TEXT}>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
