import type { Ref } from 'react'

/* -------------------------------------------------------------------------- */
/* The object travelling on <WorldRouteMap />: the ampoule box the Primo       */
/* sells (public/peptideos/*.webp). A frosted clear plastic tray with moulded */
/* pockets (4 across the front, as in the photos) holding two rows of glass    */
/* vials with gold flip-off caps, silver crimp collars and white powder. No    */
/* label: in the photos it sits on the separate lid, not on the tray. Pure     */
/* vector, drawn in its own unit space (origin = centre of the case footprint) */
/* and kept upright by the map (only a slight lean into travel).               */
/* -------------------------------------------------------------------------- */

type Vec = [number, number]
type IdFn = (name: string) => string
type Ellipse = { cx: number; cy: number; rx: number; ry: number }

/*
 * View: orthographic 3/4, seen from the front right and a little above. With no roll,
 * horizontal circles project to axis-aligned ellipses (rx = r, ry = r * sin(pitch)),
 * which keeps every vial a clean ellipse + rectangle.
 */
const YAW = (25 * Math.PI) / 180
const PITCH = (30 * Math.PI) / 180
const COS_YAW = Math.cos(YAW)
const SIN_YAW = Math.sin(YAW)
const COS_PITCH = Math.cos(PITCH)
const SIN_PITCH = Math.sin(PITCH)

/* Case: x runs along the long front face, y from back (0) to front (D), z up. */
const COLS = 4
const ROWS = 2
const VIAL_R = 3
const GAP = 1.8
const PAD = 1.2
const STEP = 2 * VIAL_R + GAP
const L = 2 * PAD + COLS * 2 * VIAL_R + (COLS - 1) * GAP
const D = 2 * PAD + ROWS * 2 * VIAL_R + (ROWS - 1) * GAP
const WALL = 9.6
const RIM = 0.7

/* Vial profile (z), bottom to top: glass body with powder, dark stopper neck, collar, cap. */
const Z_FLOOR = 0.5
const Z_POWDER = 3.5
const Z_BODY = 10.6
const Z_NECK = 12
const Z_COLLAR = 13.4
const Z_CAP = 15.4
const POWDER_R = 2.6
const NECK_R = 2.1
const COLLAR_R = 2.6
const CAP_R = 2.85

const round2 = (n: number) => Math.round(n * 100) / 100
const f = (n: number) => String(round2(n))
const pt = ([x, y]: Vec) => `${f(x)} ${f(y)}`
const line = (...pts: Vec[]) => `M${pts.map(pt).join('L')}`
const poly = (...pts: Vec[]) => `${line(...pts)}Z`

const rawX = (x: number, y: number) => x * COS_YAW - y * SIN_YAW
const rawY = (x: number, y: number, z: number) => (x * SIN_YAW + y * COS_YAW) * SIN_PITCH - z * COS_PITCH
const OX = rawX(L / 2, D / 2)
const OY = rawY(L / 2, D / 2, 0)

/** 3D case coordinates to 2D drawing coordinates. */
const P = (x: number, y: number, z: number): Vec => [rawX(x, y) - OX, rawY(x, y, z) - OY]

/** Vertical cylinder. 'solid' closes over the far rim (full silhouette), 'band' over the near rim (side only). */
function cylinder(cx: number, cy: number, r: number, z0: number, z1: number, mode: 'solid' | 'band') {
  const [x, y0] = P(cx, cy, z0)
  const y1 = y0 - (z1 - z0) * COS_PITCH
  const rx = f(r)
  const ry = f(r * SIN_PITCH)
  const left = f(x - r)
  const right = f(x + r)
  const top = f(y1)
  const bottom = f(y0)
  const close = mode === 'band' ? 1 : 0
  return `M${left} ${top}L${left} ${bottom}A${rx} ${ry} 0 0 0 ${right} ${bottom}L${right} ${top}A${rx} ${ry} 0 0 ${close} ${left} ${top}Z`
}

function disc(cx: number, cy: number, r: number, z: number, dx = 0, dy = 0): Ellipse {
  const [x, y] = P(cx, cy, z)
  return { cx: round2(x + dx), cy: round2(y + dy), rx: round2(r), ry: round2(r * SIN_PITCH) }
}

/* Vials, painted far to near ------------------------------------------------- */

type Vial = {
  key: string
  /** Back row: its powder is seen through more plastic, so it reads softer. */
  far: boolean
  glass: string
  shine: string
  powder: string
  powderTop: Ellipse
  neck: string
  collar: string
  capSide: string
  capTop: Ellipse
  capRing: Ellipse
  glint: Ellipse
}

const VIALS: Vial[] = (() => {
  const spots: { cx: number; cy: number; key: string }[] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      spots.push({ cx: PAD + VIAL_R + col * STEP, cy: PAD + VIAL_R + row * STEP, key: `${row}-${col}` })
    }
  }
  spots.sort((a, b) => a.cx * SIN_YAW + a.cy * COS_YAW - (b.cx * SIN_YAW + b.cy * COS_YAW))

  return spots.map(({ cx, cy, key }) => {
    const [x, yLow] = P(cx, cy, Z_FLOOR + 1.3)
    const yHigh = P(cx, cy, Z_BODY - 0.9)[1]
    const glint = disc(cx, cy, 0.95, Z_CAP, -1, -0.32)
    return {
      key,
      far: cy < D / 2,
      glass: cylinder(cx, cy, VIAL_R, Z_FLOOR, Z_BODY, 'solid'),
      shine: line([x - VIAL_R * 0.55, yHigh], [x - VIAL_R * 0.55, yLow]),
      powder: cylinder(cx, cy, POWDER_R, Z_FLOOR + 0.2, Z_POWDER, 'solid'),
      powderTop: disc(cx, cy, POWDER_R, Z_POWDER),
      neck: cylinder(cx, cy, NECK_R, Z_BODY - 0.4, Z_NECK, 'solid'),
      collar: cylinder(cx, cy, COLLAR_R, Z_NECK, Z_COLLAR, 'solid'),
      capSide: cylinder(cx, cy, CAP_R, Z_COLLAR, Z_CAP, 'band'),
      capTop: disc(cx, cy, CAP_R, Z_CAP),
      capRing: disc(cx, cy, 1.5, Z_CAP),
      glint: { ...glint, ry: round2(glint.ry * 0.7) },
    }
  })
})()

/* Case faces ----------------------------------------------------------------- */

const B_BL = P(0, 0, 0)
const B_BR = P(L, 0, 0)
const B_FR = P(L, D, 0)
const B_FL = P(0, D, 0)
const T_BL = P(0, 0, WALL)
const T_BR = P(L, 0, WALL)
const T_FR = P(L, D, WALL)
const T_FL = P(0, D, WALL)

const SILHOUETTE = poly(T_BL, T_BR, B_BR, B_FR, B_FL, T_FL)
const FLOOR = poly(B_BL, B_BR, B_FR, B_FL)
const BACK_WALL = poly(B_BL, B_BR, T_BR, T_BL)
const LEFT_WALL = poly(B_BL, B_FL, T_FL, T_BL)
const FRONT_WALL = poly(B_FL, B_FR, T_FR, T_FL)
const RIGHT_WALL = poly(B_FR, B_BR, T_BR, T_FR)

/** Soft diagonal sheen across the left part of the front wall. */
const front = (x: number, z: number) => P(x, D, z)
const GLOSS = [
  poly(front(L * 0.12, WALL), front(L * 0.21, WALL), front(L * 0.11, 0), front(L * 0.02, 0)),
  poly(front(L * 0.235, WALL), front(L * 0.26, WALL), front(L * 0.16, 0), front(L * 0.135, 0)),
].join('')
const SIDE_SHEEN = poly(P(L, D * 0.62, WALL), P(L, D * 0.48, WALL), P(L, D * 0.48, 0), P(L, D * 0.62, 0))

/* Moulded pockets: faint vertical seams between the vials, on the front and the right side. */
const POCKETS = [
  ...Array.from({ length: COLS - 1 }, (_, i) => {
    const x = PAD + (i + 1) * STEP - GAP / 2
    return line(front(x, 0.8), front(x, WALL - 0.8))
  }),
  ...Array.from({ length: ROWS - 1 }, (_, i) => {
    const y = PAD + (i + 1) * STEP - GAP / 2
    return line(P(L, y, 0.8), P(L, y, WALL - 0.8))
  }),
].join('')

/* Edge light. */
const RIM_FAR = line(T_FL, T_BL, T_BR)
const RIM_FRONT = line(T_FL, T_FR)
const RIM_SIDE = line(T_FR, T_BR)
const RIM_INNER = line(P(RIM, D - RIM, WALL), P(L - RIM, D - RIM, WALL), P(L - RIM, RIM, WALL))
const EDGE_FRONT_RIGHT = line(B_FR, T_FR)
const EDGE_FRONT_LEFT = line(B_FL, T_FL)
const EDGE_BACK_RIGHT = line(B_BR, T_BR)
const EDGE_BOTTOM = line(B_FL, B_FR, B_BR)

/* Bounds -------------------------------------------------------------------- */

const MIN_X = B_FL[0]
const MAX_X = B_BR[0]
const MIN_Y = Math.min(T_BL[1], ...VIALS.map((v) => v.capTop.cy - v.capTop.ry))
const MAX_Y = B_FR[1]

/** Projected width of the whole box, used by the map to size it on screen. */
export const BOX_WIDTH = round2(MAX_X - MIN_X)
const BOX_HEIGHT = MAX_Y - MIN_Y
const CENTER_Y = round2((MIN_Y + MAX_Y) / 2)

/** Where the soft gold pool sits under the case (the map scales it as the box bobs). */
export const BOX_GROUND_Y = round2(MAX_Y * 0.38)

export function RouteBoxDefs({ id }: { id: IdFn }) {
  return (
    <>
      <radialGradient id={id('box-halo')}>
        <stop offset="0%" stopColor="#e1bb68" stopOpacity="0.32" />
        <stop offset="45%" stopColor="#c79638" stopOpacity="0.11" />
        <stop offset="100%" stopColor="#c79638" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('box-pool')}>
        <stop offset="0%" stopColor="#e1bb68" stopOpacity="0.5" />
        <stop offset="50%" stopColor="#c79638" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#c79638" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('box-contact')}>
        <stop offset="0%" stopColor="#050506" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#050506" stopOpacity="0" />
      </radialGradient>

      {/* frosted plastic */}
      <linearGradient id={id('box-front')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f4f6f8" stopOpacity="0.1" />
        <stop offset="60%" stopColor="#eef1f4" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#e6eaee" stopOpacity="0.28" />
      </linearGradient>
      <linearGradient id={id('box-side')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#e3e7eb" stopOpacity="0.26" />
        <stop offset="100%" stopColor="#9ca3ab" stopOpacity="0.12" />
      </linearGradient>
      <linearGradient id={id('box-inner')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.04" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
      </linearGradient>

      {/* vials */}
      <linearGradient id={id('box-powder')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#d6dbe0" />
        <stop offset="35%" stopColor="#f7f8f9" />
        <stop offset="100%" stopColor="#c5cbd2" />
      </linearGradient>
      <linearGradient id={id('box-neck')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1f2226" />
        <stop offset="40%" stopColor="#4a4f56" />
        <stop offset="100%" stopColor="#1b1d21" />
      </linearGradient>
      <linearGradient id={id('box-collar')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#787e86" />
        <stop offset="28%" stopColor="#f5f7f9" />
        <stop offset="58%" stopColor="#b8bdc3" />
        <stop offset="100%" stopColor="#646a71" />
      </linearGradient>
      <linearGradient id={id('box-cap-side')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#8f6825" />
        <stop offset="24%" stopColor="#ecca7c" />
        <stop offset="50%" stopColor="#c79638" />
        <stop offset="100%" stopColor="#7a5820" />
      </linearGradient>
      <linearGradient id={id('box-cap-top')} x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stopColor="#f8e4a8" />
        <stop offset="50%" stopColor="#e4c071" />
        <stop offset="100%" stopColor="#c79638" />
      </linearGradient>
    </>
  )
}

/** Halo and ground glow. They stay put while the box bobs above them. */
export function RouteBoxBackdrop({ id, groundRef }: { id: IdFn; groundRef?: Ref<SVGGElement> }) {
  return (
    <>
      <circle cy={CENTER_Y} r={round2(BOX_HEIGHT * 0.95)} fill={`url(#${id('box-halo')})`} />
      <g ref={groundRef} transform={`translate(0 ${BOX_GROUND_Y})`}>
        <ellipse rx={round2(BOX_WIDTH * 0.64)} ry="8.5" fill={`url(#${id('box-pool')})`} />
        <ellipse rx={round2(BOX_WIDTH * 0.44)} ry="4.4" fill={`url(#${id('box-contact')})`} />
      </g>
    </>
  )
}

export function RouteBox({ id }: { id: IdFn }) {
  const url = (name: string) => `url(#${id(name)})`

  return (
    <>
      {/* smoky backing: calms the map behind the clear case so the vials read, and crisps the outline */}
      <path
        d={SILHOUETTE}
        fill="#0e0f11"
        fillOpacity="0.42"
        stroke="#0e0f11"
        strokeOpacity="0.4"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* inside of the case, seen through the opening and the front walls */}
      <path d={FLOOR} fill="#ffffff" fillOpacity="0.05" />
      <path d={BACK_WALL} fill={url('box-inner')} />
      <path d={LEFT_WALL} fill={url('box-inner')} />
      <path d={RIM_FAR} fill="none" stroke="#f4f6f8" strokeOpacity="0.4" strokeWidth="0.45" strokeLinejoin="round" />

      {/* vials */}
      {VIALS.map((v) => (
        <g key={v.key}>
          <path d={v.glass} fill="#ffffff" fillOpacity="0.08" stroke="#f4f6f8" strokeOpacity="0.42" strokeWidth="0.4" />
          <g opacity={v.far ? 0.55 : 1}>
            <path d={v.powder} fill={url('box-powder')} />
            <ellipse {...v.powderTop} fill="#e2e6ea" />
          </g>
          <path d={v.shine} stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.5" strokeLinecap="round" />
          <path d={v.neck} fill={url('box-neck')} />
          <path d={v.collar} fill={url('box-collar')} />
          <path d={v.capSide} fill={url('box-cap-side')} />
          <ellipse {...v.capTop} fill={url('box-cap-top')} />
          <ellipse {...v.capRing} fill="none" stroke="#a8792f" strokeOpacity="0.5" strokeWidth="0.35" />
          <ellipse {...v.glint} fill="#fffaf0" fillOpacity="0.75" />
        </g>
      ))}

      {/* outer walls: frosted, faintly showing what is behind */}
      <path d={FRONT_WALL} fill={url('box-front')} />
      <path d={RIGHT_WALL} fill={url('box-side')} />
      <path d={GLOSS} fill="#ffffff" fillOpacity="0.1" />
      <path d={SIDE_SHEEN} fill="#ffffff" fillOpacity="0.07" />
      <path d={POCKETS} fill="none" stroke="#f4f6f8" strokeOpacity="0.22" strokeWidth="0.4" strokeLinecap="round" />

      {/* edge light. The outer silhouette uses non-scaling strokes: a steady 0.75px hairline
          at the 22 to 34px the box is drawn at, instead of a sub-pixel line that shimmers. */}
      <path
        d={EDGE_BOTTOM}
        fill="none"
        stroke="#f4f6f8"
        strokeOpacity="0.38"
        strokeWidth="0.75"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={EDGE_FRONT_LEFT}
        fill="none"
        stroke="#f4f6f8"
        strokeOpacity="0.45"
        strokeWidth="0.75"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path d={EDGE_BACK_RIGHT} fill="none" stroke="#f4f6f8" strokeOpacity="0.32" strokeWidth="0.4" strokeLinecap="round" />
      <path d={RIM_INNER} fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="0.35" strokeLinejoin="round" />
      <path
        d={RIM_SIDE}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.7"
        strokeWidth="0.75"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={RIM_FRONT}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.88"
        strokeWidth="0.75"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={EDGE_FRONT_RIGHT}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.72"
        strokeWidth="0.75"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </>
  )
}
