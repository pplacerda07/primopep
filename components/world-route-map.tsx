'use client'

import { useCallback, useEffect, useId, useRef, type RefObject } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { BOX_GROUND_Y, BOX_WIDTH, RouteBox, RouteBoxBackdrop, RouteBoxDefs } from '@/components/route-box'
import {
  BRAZIL_DOTS_PATH,
  CHINA_DOTS_PATH,
  DESTINATION,
  LAND_DOTS_PATH,
  MAP_HEIGHT,
  MAP_WIDTH,
  ORIGIN,
  type MapPoint,
} from '@/lib/world-dots'

type WorldRouteMapProps = {
  className?: string
  originLabel?: string
  originCaption?: string
  destinationLabel?: string
  destinationCaption?: string
  /** Accessible description of the map. Defaults to a pt-BR sentence built from the labels. */
  ariaLabel?: string
}

/* -------------------------------------------------------------------------- */
/* Route geometry: a cubic "flight" arc bowing north, Hong Kong -> Brasil.    */
/* Pure math so the server render and the client agree.                       */
/* -------------------------------------------------------------------------- */

const ARC_LIFT = MAP_HEIGHT * 0.43
const round1 = (n: number) => Math.round(n * 10) / 10

const P0: MapPoint = { x: ORIGIN.x, y: ORIGIN.y }
const P3: MapPoint = { x: DESTINATION.x, y: DESTINATION.y }
const SPAN = P0.x - P3.x
/** Control points: a steep climb out of Hong Kong and a long, soft descent into Brasil. */
const C1: MapPoint = { x: round1(P0.x - SPAN * 0.18), y: round1(P0.y - ARC_LIFT) }
const C2: MapPoint = { x: round1(P3.x + SPAN * 0.3), y: round1(P3.y - ARC_LIFT * 1.25) }
const ROUTE_PATH = `M${P0.x} ${P0.y}C${C1.x} ${C1.y} ${C2.x} ${C2.y} ${P3.x} ${P3.y}`

function pointAt(t: number): MapPoint {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * P0.x + b * C1.x + c * C2.x + d * P3.x,
    y: a * P0.y + b * C1.y + c * C2.y + d * P3.y,
  }
}

/** Cumulative arc length lookup, so motion along the arc is uniform and matches the trail. */
const LUT_STEPS = 160
const LENGTHS: number[] = (() => {
  const lengths = [0]
  let prev = pointAt(0)
  for (let i = 1; i <= LUT_STEPS; i++) {
    const next = pointAt(i / LUT_STEPS)
    lengths.push(lengths[i - 1] + Math.hypot(next.x - prev.x, next.y - prev.y))
    prev = next
  }
  return lengths
})()
const ROUTE_LENGTH = LENGTHS[LUT_STEPS]
/** Integer dash length (> route length) used for the progressive trail. */
const DASH = Math.ceil(ROUTE_LENGTH) + 2

function tAtDistance(fraction: number) {
  const target = Math.min(Math.max(fraction, 0), 1) * ROUTE_LENGTH
  let lo = 0
  let hi = LUT_STEPS
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (LENGTHS[mid] <= target) lo = mid
    else hi = mid
  }
  const span = LENGTHS[hi] - LENGTHS[lo]
  return (lo + (span > 0 ? (target - LENGTHS[lo]) / span : 0)) / LUT_STEPS
}

/* -------------------------------------------------------------------------- */
/* Timeline: depart -> travel -> arrive -> rest, as fractions of one cycle.    */
/* -------------------------------------------------------------------------- */

const CYCLE_SECONDS = 8.4
const TRAVEL_START = 0.08
const TRAVEL_END = 0.64
const STATIC_PROGRESS = 0.65

/** Gentle bob while travelling: whole cycles per loop, height in box units. */
const BOB_CYCLES = 7
const BOB_UNITS = 2.4
/** The box stays upright, leaning only a few degrees into the direction of travel (west) at full speed. */
const MAX_TILT_DEG = 3.5

type Frame = {
  /** Box position along the arc (0..1 of its length). */
  progress: number
  /** Drawn portion of the gold trail (0..1). */
  trail: number
  trailOpacity: number
  boxOpacity: number
  boxScale: number
  /** Vertical bob of the box, -1 (down) .. 1 (up). */
  bob: number
  /** Lean of the box in degrees (negative leans west). */
  tilt: number
  originPulse: number
  arrivalPulse: number
  arrivalEcho: number
  /** Brazil highlight intensity (0..1). */
  flash: number
}

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1)
const segment = (p: number, from: number, to: number) => clamp01((p - from) / (to - from))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
/** Derivative of easeInOutCubic, normalized to 0..1 (peaks at mid-flight). */
const easeInOutCubicSpeed = (t: number) => (t < 0.5 ? 4 * t * t : Math.pow(2 - 2 * t, 2))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInCubic = (t: number) => t * t * t

function frameAt(p: number): Frame {
  const travel = segment(p, TRAVEL_START, TRAVEL_END)
  const progress = easeInOutCubic(travel)
  const appear = easeOutCubic(segment(p, 0.015, 0.1))
  const vanish = easeInCubic(segment(p, TRAVEL_END - 0.005, TRAVEL_END + 0.07))
  const flashIn = segment(p, TRAVEL_END - 0.02, TRAVEL_END + 0.03)
  const flashOut = easeInCubic(segment(p, TRAVEL_END + 0.06, 0.95))

  return {
    progress,
    trail: progress,
    trailOpacity: progress > 0.002 ? 1 - segment(p, 0.84, 0.97) : 0,
    boxOpacity: appear * (1 - vanish),
    boxScale: (0.55 + 0.45 * appear) * (1 - 0.5 * vanish),
    bob: Math.sin(p * Math.PI * 2 * BOB_CYCLES) * Math.sin(Math.PI * travel),
    tilt: -MAX_TILT_DEG * easeInOutCubicSpeed(travel),
    originPulse: segment(p, 0, 0.2),
    arrivalPulse: segment(p, TRAVEL_END - 0.015, TRAVEL_END + 0.19),
    arrivalEcho: segment(p, TRAVEL_END + 0.05, TRAVEL_END + 0.26),
    flash: flashIn * (1 - flashOut),
  }
}

const INITIAL_FRAME = frameAt(0)

/** Reduced motion: full trail, box resting upright ~65% along the arc, nothing looping. */
const STATIC_FRAME: Frame = {
  progress: STATIC_PROGRESS,
  trail: 1,
  trailOpacity: 1,
  boxOpacity: 1,
  boxScale: 1,
  bob: 0,
  tilt: 0,
  originPulse: 0,
  arrivalPulse: 0,
  arrivalEcho: 0,
  flash: 0,
}

/* -------------------------------------------------------------------------- */
/* Responsive sizing: strokes and the box keep a pleasant on-screen size       */
/* whatever the rendered width of the map.                                     */
/* -------------------------------------------------------------------------- */

const DEFAULT_WIDTH = 860

type Layout = { k: number; boxScale: number }

function layoutFor(width: number): Layout {
  const unitPx = width / MAP_WIDTH
  // ~26px wide on a 375px phone (the map is drawn at 125% there), up to 34px on desktop.
  const boxPx = Math.min(Math.max(15 + width * 0.023, 22), 34)
  return { k: 1 / unitPx, boxScale: boxPx / (BOX_WIDTH * unitPx) }
}

const DEFAULT_LAYOUT = layoutFor(DEFAULT_WIDTH)
const px = (value: number, layout: Layout) => Math.round(value * layout.k * 100) / 100

/** Dots get relatively larger on small screens so the texture stays visible. */
const DOT_CLASS = '[stroke-width:7.4] sm:[stroke-width:6.4] lg:[stroke-width:5.8]'

const DEFAULT_ARIA_LABEL =
  'Mapa-múndi em pontos: uma caixinha de ampolas sai do fornecedor parceiro em Hong Kong e viaja até o Brasil.'

/* -------------------------------------------------------------------------- */

export function WorldRouteMap({
  className,
  originLabel = 'Hong Kong',
  originCaption = 'Fornecedor',
  destinationLabel = 'Brasil',
  destinationCaption = 'Você',
  ariaLabel,
}: WorldRouteMapProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const id = (name: string) => `wrm-${uid}-${name}`

  const reduceMotion = useReducedMotion()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapperRef, { amount: 0.2 })

  const baseRouteRef = useRef<SVGPathElement>(null)
  const trailRef = useRef<SVGGElement>(null)
  const trailGlowRef = useRef<SVGPathElement>(null)
  const trailCoreRef = useRef<SVGPathElement>(null)
  const boxRef = useRef<SVGGElement>(null)
  const boxBodyRef = useRef<SVGGElement>(null)
  const boxGroundRef = useRef<SVGGElement>(null)
  const flashRef = useRef<SVGPathElement>(null)
  const glowRef = useRef<SVGCircleElement>(null)
  const originRingRef = useRef<HTMLSpanElement>(null)
  const arrivalRingRef = useRef<HTMLSpanElement>(null)
  const arrivalEchoRef = useRef<HTMLSpanElement>(null)

  const layoutRef = useRef<Layout>(DEFAULT_LAYOUT)
  const frameRef = useRef<Frame>(INITIAL_FRAME)
  const controlsRef = useRef<ReturnType<typeof animate> | null>(null)

  /** Writes a frame straight to the DOM (no React re-render per animation frame). */
  const paint = useCallback((frame: Frame) => {
    frameRef.current = frame
    const layout = layoutRef.current

    const box = boxRef.current
    if (box) {
      // The box never follows the path tangent: it stays upright and only bobs and leans a little.
      const point = pointAt(tAtDistance(frame.progress))
      const scale = frame.boxScale * layout.boxScale
      box.setAttribute(
        'transform',
        `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) scale(${scale.toFixed(3)})`
      )
      box.style.opacity = frame.boxOpacity.toFixed(3)
    }
    if (boxBodyRef.current) {
      boxBodyRef.current.setAttribute(
        'transform',
        `translate(0 ${(-frame.bob * BOB_UNITS).toFixed(2)}) rotate(${frame.tilt.toFixed(2)})`
      )
    }
    if (boxGroundRef.current) {
      // The glow under the box tightens and fades a touch as the box rises.
      boxGroundRef.current.setAttribute(
        'transform',
        `translate(0 ${BOX_GROUND_Y}) scale(${(1 - 0.1 * frame.bob).toFixed(3)})`
      )
      boxGroundRef.current.style.opacity = (1 - 0.25 * frame.bob).toFixed(3)
    }

    const offset = (DASH - frame.trail * ROUTE_LENGTH).toFixed(1)
    if (trailGlowRef.current) trailGlowRef.current.style.strokeDashoffset = offset
    if (trailCoreRef.current) trailCoreRef.current.style.strokeDashoffset = offset
    if (trailRef.current) trailRef.current.style.opacity = frame.trailOpacity.toFixed(3)

    if (flashRef.current) flashRef.current.style.opacity = frame.flash.toFixed(3)
    if (glowRef.current) glowRef.current.style.opacity = (0.35 + 0.65 * frame.flash).toFixed(3)

    paintRing(originRingRef.current, frame.originPulse, 2.6)
    paintRing(arrivalRingRef.current, frame.arrivalPulse, 3)
    paintRing(arrivalEchoRef.current, frame.arrivalEcho, 4.2)
  }, [])

  // Keep strokes and the box at a consistent on-screen size.
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const applyLayout = (width: number) => {
      if (width <= 0) return
      const layout = layoutFor(width)
      layoutRef.current = layout

      const base = baseRouteRef.current
      if (base) {
        base.style.strokeWidth = String(px(1.1, layout))
        base.style.strokeDasharray = `${px(3, layout)} ${px(5, layout)}`
      }
      if (trailGlowRef.current) trailGlowRef.current.style.strokeWidth = String(px(7, layout))
      if (trailCoreRef.current) trailCoreRef.current.style.strokeWidth = String(px(1.8, layout))
      if (glowRef.current) glowRef.current.setAttribute('r', String(px(34, layout)))

      paint(frameRef.current)
    }

    applyLayout(wrapper.getBoundingClientRect().width)
    const observer = new ResizeObserver((entries) => applyLayout(entries[0]?.contentRect.width ?? 0))
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [paint])

  // The delivery loop (or a calm static composition under reduced motion).
  useEffect(() => {
    if (reduceMotion) {
      paint(STATIC_FRAME)
      return
    }

    paint(INITIAL_FRAME)
    const controls = animate(0, 1, {
      duration: CYCLE_SECONDS,
      ease: 'linear',
      repeat: Infinity,
      onUpdate: (p) => paint(frameAt(p)),
    })
    controls.pause()
    controlsRef.current = controls

    return () => {
      controls.stop()
      controlsRef.current = null
    }
  }, [reduceMotion, paint])

  // Only spend frames while the map is on screen.
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    if (inView) controls.play()
    else controls.pause()
  }, [inView, reduceMotion])

  // Short labels sit beside the point; longer copy drops below it so it never clips on a phone.
  const destinationPlacement =
    Math.max(destinationLabel.length, destinationCaption.length) > 12 ? 'below-right' : 'left'

  const label =
    ariaLabel ??
    (originLabel === 'Hong Kong' && destinationLabel === 'Brasil'
      ? DEFAULT_ARIA_LABEL
      : `Mapa-múndi em pontos: uma caixinha de ampolas sai de ${originLabel} (${originCaption}) e viaja até ${destinationLabel} (${destinationCaption}).`)

  return (
    <div
      ref={wrapperRef}
      className={cn('relative w-full select-none', className)}
      style={{ aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
    >
      {/* Static layer: dots + dotted route. Painted once. */}
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={label}
      >
        <defs>
          <radialGradient id={id('vignette')} cx="50%" cy="46%" r="62%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="55%" stopColor="#fff" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id={id('fade')} maskUnits="userSpaceOnUse" x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT}>
            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill={`url(#${id('vignette')})`} />
          </mask>
        </defs>

        <g fill="none" strokeLinecap="round" className={DOT_CLASS}>
          <path d={LAND_DOTS_PATH} stroke="#b1b3b7" strokeOpacity="0.28" mask={`url(#${id('fade')})`} />
          <path d={CHINA_DOTS_PATH} stroke="#e4e6e8" strokeOpacity="0.72" />
          <path d={BRAZIL_DOTS_PATH} stroke="#c79638" strokeOpacity="0.92" />
        </g>

        <path
          ref={baseRouteRef}
          d={ROUTE_PATH}
          fill="none"
          stroke="#d8b66c"
          strokeOpacity="0.4"
          strokeWidth={px(1.1, DEFAULT_LAYOUT)}
          strokeDasharray={`${px(3, DEFAULT_LAYOUT)} ${px(5, DEFAULT_LAYOUT)}`}
        />
      </svg>

      {/* Animated layer: arrival glow, Brazil highlight, gold trail, box. */}
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id={id('arrival-glow')}>
            <stop offset="0%" stopColor="#c79638" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#c79638" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#c79638" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id={id('trail')}
            gradientUnits="userSpaceOnUse"
            x1={P0.x}
            y1={P0.y}
            x2={P3.x}
            y2={P3.y}
          >
            <stop offset="0%" stopColor="#d4d6d9" stopOpacity="0.35" />
            <stop offset="45%" stopColor="#c79638" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f0d28a" />
          </linearGradient>
          <RouteBoxDefs id={id} />
        </defs>

        <circle
          ref={glowRef}
          cx={P3.x}
          cy={P3.y}
          r={px(34, DEFAULT_LAYOUT)}
          fill={`url(#${id('arrival-glow')})`}
          style={{ opacity: 0.35 }}
        />

        <path
          ref={flashRef}
          d={BRAZIL_DOTS_PATH}
          fill="none"
          stroke="#f0d28a"
          strokeLinecap="round"
          className={DOT_CLASS}
          style={{ opacity: 0 }}
        />

        <g ref={trailRef} fill="none" strokeLinecap="round" style={{ opacity: 0 }}>
          <path
            ref={trailGlowRef}
            d={ROUTE_PATH}
            stroke="#c79638"
            strokeOpacity="0.16"
            strokeWidth={px(7, DEFAULT_LAYOUT)}
            strokeDasharray={`${DASH} ${DASH}`}
            style={{ strokeDashoffset: DASH }}
          />
          <path
            ref={trailCoreRef}
            d={ROUTE_PATH}
            stroke={`url(#${id('trail')})`}
            strokeWidth={px(1.8, DEFAULT_LAYOUT)}
            strokeDasharray={`${DASH} ${DASH}`}
            style={{ strokeDashoffset: DASH }}
          />
        </g>

        <g ref={boxRef} transform={`translate(${P0.x} ${P0.y})`} style={{ opacity: 0 }}>
          <RouteBoxBackdrop id={id} groundRef={boxGroundRef} />
          <g ref={boxBodyRef}>
            <RouteBox id={id} />
          </g>
        </g>
      </svg>

      {/* Markers + labels as HTML so text stays crisp and legible at any width. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <RouteMarker
          point={P0}
          tone="silver"
          placement="below-left"
          label={originLabel}
          caption={originCaption}
          ringRefs={[originRingRef]}
        />
        <RouteMarker
          point={P3}
          tone="gold"
          placement={destinationPlacement}
          label={destinationLabel}
          caption={destinationCaption}
          ringRefs={[arrivalRingRef, arrivalEchoRef]}
        />
      </div>
    </div>
  )
}

function paintRing(node: HTMLElement | null, k: number, maxScale: number) {
  if (!node) return
  if (k <= 0 || k >= 1) {
    node.style.opacity = '0'
    return
  }
  const scale = 1 + (maxScale - 1) * easeOutCubic(k)
  node.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`
  node.style.opacity = (0.75 * (1 - k)).toFixed(3)
}

/* -------------------------------------------------------------------------- */
/* Markers                                                                     */
/* -------------------------------------------------------------------------- */

type RouteMarkerProps = {
  point: MapPoint
  tone: 'silver' | 'gold'
  /** Where the label sits relative to the point (chosen so it never clips on a 375px screen). */
  placement: keyof typeof PLACEMENTS
  label: string
  caption: string
  ringRefs: RefObject<HTMLSpanElement | null>[]
}

const MARKER_TONES = {
  silver: {
    dot: 'bg-[#e4e6e8] shadow-[0_0_12px_rgba(228,230,232,0.55)]',
    halo: 'border-[#b1b3b7]/40',
    ring: 'border-[#e4e6e8]/80',
  },
  gold: {
    dot: 'bg-gold-gradient shadow-[0_0_14px_rgba(199,150,56,0.7)]',
    halo: 'border-gold/50',
    ring: 'border-gold-soft',
  },
} as const

const PLACEMENTS = {
  left: 'right-4 top-0 -translate-y-1/2 text-right',
  'below-left': '-right-2.5 top-3 text-right',
  'below-right': '-left-2.5 top-3 text-left',
} as const

function RouteMarker({ point, tone, placement, label, caption, ringRefs }: RouteMarkerProps) {
  const styles = MARKER_TONES[tone]

  return (
    <div
      className="absolute size-0"
      style={{ left: `${(point.x / MAP_WIDTH) * 100}%`, top: `${(point.y / MAP_HEIGHT) * 100}%` }}
    >
      {ringRefs.map((ref, i) => (
        <span
          key={i}
          ref={ref}
          className={cn('absolute left-0 top-0 size-3 rounded-full border', styles.ring)}
          style={{ transform: 'translate(-50%, -50%)', opacity: 0 }}
        />
      ))}
      <span
        className={cn(
          'absolute left-0 top-0 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border',
          styles.halo
        )}
      />
      <span
        className={cn('absolute left-0 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full', styles.dot)}
      />

      <span
        className={cn(
          'absolute block whitespace-nowrap rounded-xl border border-border bg-background/80 px-2.5 py-1.5 shadow-luxe',
          PLACEMENTS[placement]
        )}
      >
        <span className="block text-[12px] font-semibold leading-tight text-foreground sm:text-[13px]">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground sm:text-xs">{caption}</span>
      </span>
    </div>
  )
}
