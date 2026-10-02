import { cn } from '@/lib/utils'

// Ilustração do bloco "Protocolo de uso incluso": uma pessoa desenhada só pelo
// sistema nervoso, em dourado (cérebro, nervos da face, medula, plexos, nervos de
// braços, tronco e pernas, até os dedos, com ramificações finas). Pulsos de luz
// percorrem os nervos principais; com "reduzir movimento" ativo, a figura fica parada.
// Tudo é calculado no servidor (SVG estático, desenho sempre igual).

type Point = [number, number]
type Nerve = Point[]

const W = 200 // largura do viewBox (200 × 412); o corpo é simétrico em x = 100
const GOLD = '#c79638'
const GOLD_SOFT = '#d8b66c'
const GOLD_LIGHT = '#f0d28a'

const r1 = (n: number) => Math.round(n * 10) / 10
const mirror = (nerve: Nerve): Nerve => nerve.map(([x, y]) => [W - x, y])

/** Curva suave (Catmull-Rom → Bézier) passando por todos os pontos. */
function smoothPath(points: Nerve): string {
  const n = points.length
  const at = (i: number) => points[Math.min(n - 1, Math.max(0, i))]
  let d = `M${r1(points[0][0])} ${r1(points[0][1])}`

  for (let i = 0; i < n - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`
  }

  return d
}

/** Os dois lados (esquerdo + espelhado) de cada nervo, num único `d`. */
const bilateral = (nerves: Nerve[]) => nerves.flatMap((n) => [smoothPath(n), smoothPath(mirror(n))]).join(' ')

/** Gerador pseudoaleatório com semente fixa. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type TwigOptions = { step: number; min: number; max: number; from?: number }

/** Ramificações finas (com sub-ramos) ao longo de um nervo. */
function twigs(nerve: Nerve, rand: () => number, { step, min, max, from = 0 }: TwigOptions): string {
  const out: string[] = []
  let carry = step * (0.3 + rand() * 0.4)
  let side = rand() < 0.5 ? 1 : -1

  for (let i = 0; i < nerve.length - 1; i++) {
    const [ax, ay] = nerve[i]
    const [bx, by] = nerve[i + 1]
    const length = Math.hypot(bx - ax, by - ay)
    const angle = Math.atan2(by - ay, bx - ax)

    for (let t = carry; t < length; t += step) {
      if (i < from) continue
      const x = ax + Math.cos(angle) * t
      const y = ay + Math.sin(angle) * t
      const turn = angle + side * (0.45 + rand() * 0.55)
      const len = min + rand() * (max - min)
      const ex = x + Math.cos(turn) * len
      const ey = y + Math.sin(turn) * len
      const bend = side * len * 0.2
      const cx = (x + ex) / 2 - Math.sin(turn) * bend
      const cy = (y + ey) / 2 + Math.cos(turn) * bend
      out.push(`M${r1(x)} ${r1(y)} Q${r1(cx)} ${r1(cy)} ${r1(ex)} ${r1(ey)}`)

      // Sub-ramos: até dois, saindo do meio e da ponta.
      for (const at of [0.55, 0.9]) {
        if (rand() > 0.5) continue
        const sx = x + Math.cos(turn) * len * at
        const sy = y + Math.sin(turn) * len * at
        const subTurn = turn + (rand() < 0.5 ? 1 : -1) * (0.45 + rand() * 0.45)
        const subLen = len * (0.3 + rand() * 0.25)
        out.push(`M${r1(sx)} ${r1(sy)} L${r1(sx + Math.cos(subTurn) * subLen)} ${r1(sy + Math.sin(subTurn) * subLen)}`)
      }

      side = -side
    }
    carry = (((carry - length) % step) + step) % step
  }

  return out.join(' ')
}

const bilateralTwigs = (nerves: Nerve[], rand: () => number, options: TwigOptions) =>
  nerves.flatMap((n) => [twigs(n, rand, options), twigs(mirror(n), rand, options)]).join(' ')

// ---------------------------------------------------------------------------
// Nervos (lado esquerdo do desenho; o direito é espelhado).

// Sistema nervoso central
const SPINE: Nerve = [[100, 42], [100, 62], [100, 120], [100, 180], [100, 198]]
const CAUDA: Nerve[] = [[[100, 190], [98, 214]], [[100, 192], [96, 212]]]
const CAUDA_CENTER: Nerve = [[100, 194], [100, 216]]

// Face e pescoço
// Nervo facial: leque saindo da frente da orelha.
const FACE: Nerve[] = [
  [[84.5, 43], [88, 45.5], [92, 46.5]],
  [[84.5, 43], [87.5, 49], [91.5, 52.5]],
  [[84.5, 43], [86.5, 51.5], [90.5, 57], [95, 59.5]],
]
const CERVICAL: Nerve[] = [
  [[100, 56], [94, 60], [89, 64]],
  [[100, 61], [94, 67], [90, 73]],
  [[100, 66], [91, 72], [82, 77]],
]

// Braço: plexo braquial e nervos
const BRACHIAL_ROOTS: Nerve[] = [
  [[100, 66], [86, 75], [70, 89]],
  [[100, 72], [84, 80], [68, 91.5]],
  [[100, 79], [83, 86], [67, 94]],
]
const AXILLARY: Nerve = [[68, 91], [61.5, 90.5], [57, 96], [55.5, 104]]
const MEDIAN: Nerve = [[67, 94], [60.5, 104], [56.5, 118], [53.5, 140], [50, 160], [45.5, 181], [41.5, 200], [39, 212]]
const RADIAL: Nerve = [[66, 96], [58.5, 108], [53, 124], [49.5, 142], [46, 158], [42, 178], [38, 196], [35, 206]]
const ULNAR: Nerve = [[68.5, 98], [63, 114], [59.5, 138], [54.5, 160], [49, 182], [44.5, 200], [42.5, 212]]
const MUSCULOCUTANEOUS: Nerve = [[65, 99], [58, 117], [54, 134], [51, 152]]
const FINGERS: Nerve[] = [
  [[35, 206], [32.5, 214], [31.2, 221]], // polegar
  [[39, 212], [35, 220], [33.8, 227]],
  [[39.8, 213], [37.4, 224], [36.3, 232]],
  [[41.2, 213], [39.8, 224], [39.3, 233]],
  [[42.5, 212], [42.3, 222], [41.8, 230]],
]

// Tronco
// Menos pares e com comprimentos/curvas variados, para não parecer costela.
const INTERCOSTALS: Nerve[] = [
  [93, 69, 1.5],
  [103, 72, 2.5],
  [114, 70, 1],
  [125, 74, 3],
  [136, 71, 2],
  [147, 75, 1.5],
  [158, 72.5, 3],
  [168, 76, 2],
].map(([y, edge, sag]): Nerve => [[99.5, y], [90, y + 1.5 + sag * 0.3], [81, y + 4.5 + sag], [edge, y + 9 + sag * 1.6]])
const LUMBAR: Nerve[] = [
  [[100, 178], [89, 182], [80, 187.5], [74, 193]], // subcostal
  [[100, 186], [90, 191], [83, 198.5], [79, 206]], // ílio-hipogástrico
  [[100, 192], [92, 199], [88.5, 209], [89, 218]], // ílio-inguinal
]

// Perna
const SCIATIC: Nerve = [[99, 204], [92, 214], [84.5, 228], [80.5, 246], [79, 266], [79.5, 292], [79, 318], [80, 346], [81.5, 378], [80, 394]]
const FEMORAL: Nerve = [[99, 198], [92, 210], [87.5, 224], [85.5, 244], [84.5, 264]]
const FEMORAL_BRANCHES: Nerve[] = [
  [[87.5, 225], [81.5, 238], [78.5, 252]],
  [[87.5, 227], [90, 244], [91, 258]],
]
const LATERAL_CUTANEOUS: Nerve = [[98, 200], [86, 209], [76, 220], [71.5, 238], [70.5, 260]]
const SAPHENOUS: Nerve = [[86.5, 228], [90, 252], [90.5, 280], [90, 300], [88.8, 326], [88, 352], [87.5, 380], [86.5, 394]]
const FIBULAR: Nerve = [[79.5, 288], [74.5, 300], [72.8, 322], [73.2, 345], [75, 368], [76, 390]]
const SUPERFICIAL_FIBULAR: Nerve = [[75, 368], [73, 386], [71.5, 398]]
const TOES: Nerve[] = [
  [[80, 394], [70.5, 402]],
  [[80, 394], [74.5, 405.5]],
  [[80, 394], [79, 406.5]],
  [[80, 394], [83.5, 406]],
  [[80, 394], [87.5, 404]],
]

// ---------------------------------------------------------------------------
// Camadas prontas (cada uma vira um único <path>).

const MAIN = [smoothPath(SPINE), bilateral([MEDIAN, SCIATIC])].join(' ')
const SECONDARY = bilateral([
  FEMORAL,
  AXILLARY,
  RADIAL,
  ULNAR,
  MUSCULOCUTANEOUS,
  ...BRACHIAL_ROOTS,
  LATERAL_CUTANEOUS,
  SAPHENOUS,
  FIBULAR,
  SUPERFICIAL_FIBULAR,
  ...FEMORAL_BRANCHES,
  ...LUMBAR,
  ...CAUDA,
])
const FINE = [
  bilateral([...FINGERS, ...TOES, ...FACE, ...CERVICAL]),
  smoothPath(CAUDA_CENTER),
].join(' ')
const RIBS = bilateral(INTERCOSTALS)

const rand = seeded(11)
const TWIGS = [
  bilateralTwigs([MEDIAN, RADIAL, ULNAR], rand, { step: 7, min: 2.5, max: 5, from: 2 }),
  bilateralTwigs([AXILLARY, MUSCULOCUTANEOUS], rand, { step: 6, min: 2, max: 4 }),
  bilateralTwigs([SCIATIC, FIBULAR, SAPHENOUS], rand, { step: 7.5, min: 3, max: 6, from: 2 }),
  bilateralTwigs([FEMORAL, LATERAL_CUTANEOUS, ...FEMORAL_BRANCHES], rand, { step: 7, min: 2.5, max: 5, from: 1 }),
  bilateralTwigs(INTERCOSTALS, rand, { step: 7, min: 2, max: 4, from: 1 }),
  bilateralTwigs(LUMBAR, rand, { step: 7, min: 2, max: 4, from: 1 }),
].join(' ')

// Cérebro: hemisférios, fissura, giros e cerebelo.
const BRAIN_LEFT = 'M100 15.5 C92 13.5 84.5 18 84.5 27 C84 35.5 89 41.5 96.5 42 L100 42'
const BRAIN_GYRI = [
  'M88.5 21.5 C91 23.5 90.5 26.5 93.5 27.5',
  'M86.5 30.5 C90 30.5 91 34.5 95 33.5',
  'M91.5 38.5 C93.5 36 96.5 37 97.5 34',
  'M96 18.5 C95 21.5 97.5 23.5 96.5 26.5',
  'M92 17.5 C90.5 19.5 92.5 21 91 23',
  'M86 26 C88 25 89.5 27.5 91.5 26',
  'M89 35.5 C88 38 90 39.5 89.5 41',
]
function mirrorPath(d: string): string {
  // Espelha caminhos feitos só de pares absolutos "x y".
  return d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${r1(W - Number(x))} ${y}`)
}

const BRAIN_FILL = `${BRAIN_LEFT} ${mirrorPath(BRAIN_LEFT)}`
const BRAIN_OUTLINE = [BRAIN_LEFT, mirrorPath(BRAIN_LEFT)].join(' ')
const BRAIN_DETAIL = [...BRAIN_GYRI, ...BRAIN_GYRI.map(mirrorPath), 'M100 15.5 C99 22 101 30 100 42'].join(' ')

// Plexos e gânglios.
const NODES: Point[] = [[100, 62], [68, 92], [132, 92], [94, 212], [106, 212], [79.5, 290], [120.5, 290]]

// Pulsos: [caminho, atraso em segundos].
const PULSES: [string, number][] = [
  [smoothPath(SPINE), 0],
  [smoothPath(MEDIAN), 0.8],
  [smoothPath(mirror(MEDIAN)), 0.8],
  [smoothPath(RADIAL), 1.2],
  [smoothPath(mirror(RADIAL)), 1.2],
  [smoothPath(SCIATIC), 1.6],
  [smoothPath(mirror(SCIATIC)), 1.6],
  [smoothPath(SAPHENOUS), 2.1],
  [smoothPath(mirror(SAPHENOUS)), 2.1],
]

const STYLES = `
.pnf-pulse { opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  .pnf-pulse {
    opacity: 1;
    stroke-dasharray: 6 194;
    stroke-dashoffset: 200;
    animation: pnf-travel 4.2s linear infinite;
  }
  .pnf-brain-glow { animation: pnf-glow 4.2s ease-in-out infinite; }
}
@keyframes pnf-travel { to { stroke-dashoffset: 0; } }
@keyframes pnf-glow { 0%, 100% { opacity: 0.6; } 10% { opacity: 1; } }
`

export function NervousSystemFigure({
  className,
  label = 'Ilustração de uma pessoa com o sistema nervoso em destaque',
}: {
  className?: string
  label?: string
}) {
  return (
    <svg viewBox="0 0 200 412" role="img" aria-label={label} className={cn('h-auto w-full', className)}>
      <style>{STYLES}</style>
      <defs>
        <radialGradient id="pnf-head-glow" cx="100" cy="30" r="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={GOLD_SOFT} stopOpacity="0.38" />
          <stop offset="1" stopColor={GOLD_SOFT} stopOpacity="0" />
        </radialGradient>
        <filter id="pnf-blur" x="-20%" y="-10%" width="140%" height="120%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* Brilho do cérebro */}
      <circle className="pnf-brain-glow" cx="100" cy="30" r="42" fill="url(#pnf-head-glow)" />

      {/* Halo suave dos nervos principais */}
      <path d={MAIN} fill="none" stroke={GOLD} strokeWidth="3.2" strokeLinecap="round" opacity="0.3" filter="url(#pnf-blur)" />

      <g fill="none" stroke={GOLD} strokeLinecap="round" strokeLinejoin="round">
        <path d={TWIGS} strokeWidth="0.42" strokeOpacity="0.5" />
        <path d={RIBS} strokeWidth="0.5" strokeOpacity="0.38" />
        <path d={FINE} strokeWidth="0.6" strokeOpacity="0.6" />
        <path d={SECONDARY} strokeWidth="0.8" strokeOpacity="0.85" />
        <path d={MAIN} strokeWidth="1.25" />
        <path d={smoothPath(SPINE)} strokeWidth="2" />
      </g>

      {/* Cérebro */}
      <path d={BRAIN_FILL} fill={GOLD} fillOpacity="0.12" />
      <g fill="none" stroke={GOLD} strokeLinecap="round" strokeLinejoin="round">
        <path d={BRAIN_OUTLINE} strokeWidth="1.15" />
        <path d={BRAIN_DETAIL} strokeWidth="0.7" strokeOpacity="0.75" />
      </g>

      {NODES.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.7" fill={GOLD_SOFT} />
      ))}

      {/* Pulsos de luz (só com animação permitida) */}
      <g fill="none" stroke={GOLD_LIGHT} strokeWidth="2.1" strokeLinecap="round">
        {PULSES.map(([d, delay]) => (
          <path key={d} className="pnf-pulse" d={d} pathLength={100} style={{ animationDelay: `${delay}s` }} />
        ))}
      </g>
    </svg>
  )
}
