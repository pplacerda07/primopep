import { useId } from 'react'
import { cn } from '@/lib/utils'

type VialProps = {
  /** Product name printed on the label band (rendered uppercase). */
  label?: string
  /** Secondary line, e.g. the presentation ("10 mg"). */
  sublabel?: string
  className?: string
  /** Accessible name. When omitted the vial is decorative (aria-hidden). */
  title?: string
}

const VIEW_W = 120
const VIEW_H = 240

const BODY_X = 14
const BODY_W = 92
const BAND_Y = 92
const BAND_H = 102
const TEXT_MAX_W = BODY_W - 16

/** Approximate advance of an uppercase bold glyph + tracking, in em. */
const LABEL_EM = 0.74
const SUBLABEL_EM = 0.6
const INK = '#1d1f22'
const FONT_STACK = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif'

const BODY_PATH =
  'M32 52H88V58C88 65 106 65 106 77V210Q106 224 92 224H28Q14 224 14 210V77C14 65 32 65 32 58Z'

/** Splits long multi-word labels into two balanced lines. */
function splitLabel(text: string): string[] {
  const words = text.trim().split(/\s+/)
  if (text.length <= 11 || words.length < 2) return [text]

  let best: string[] = [text]
  let bestDiff = Infinity
  for (let i = 1; i < words.length; i++) {
    const first = words.slice(0, i).join(' ')
    const second = words.slice(i).join(' ')
    const diff = Math.abs(first.length - second.length)
    if (diff < bestDiff) {
      bestDiff = diff
      best = [first, second]
    }
  }
  return best
}

function fitSize(text: string, em: number, max: number) {
  return Math.min(max, TEXT_MAX_W / Math.max(1, text.length * em))
}

/** Clamps text that would overflow the band even after auto-sizing. */
function fitProps(text: string, size: number, em: number) {
  return text.length * em * size > TEXT_MAX_W
    ? { textLength: TEXT_MAX_W, lengthAdjust: 'spacingAndGlyphs' as const }
    : {}
}

export function Vial({ label, sublabel, className, title }: VialProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const id = (name: string) => `vial-${uid}-${name}`

  const labelText = label?.trim().toUpperCase() ?? ''
  const sublabelText = sublabel?.trim() ?? ''
  const lines = labelText ? splitLabel(labelText) : []
  const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), '')
  const labelSize = lines.length ? fitSize(longest, LABEL_EM, lines.length > 1 ? 12 : 15) : 0
  const sublabelSize = sublabelText ? fitSize(sublabelText, SUBLABEL_EM, 8.5) : 0

  // Vertical stack on the band: label lines, gold hairline, sublabel.
  const lineHeight = labelSize * 1.12
  const gap = 6
  const hairline = 1
  const blockHeight =
    lines.length * lineHeight + (lines.length && sublabelText ? gap * 2 + hairline : 0) + (sublabelText ? sublabelSize * 1.1 : 0)
  const blockTop = BAND_Y + BAND_H / 2 - blockHeight / 2
  const hairlineY = lines.length ? blockTop + lines.length * lineHeight + gap : BAND_Y + BAND_H / 2
  const sublabelCenter = lines.length ? hairlineY + hairline + gap + (sublabelSize * 1.1) / 2 : blockTop + (sublabelSize * 1.1) / 2

  const a11y = title
    ? { role: 'img' as const, 'aria-labelledby': id('title') }
    : { 'aria-hidden': true as const, focusable: 'false' as const }

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={VIEW_W}
      height={VIEW_H}
      className={cn('block h-auto w-24 shrink-0 select-none', className)}
      {...a11y}
    >
      {title ? <title id={id('title')}>{title}</title> : null}

      <defs>
        <radialGradient id={id('shadow')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={id('amber')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a1304" />
          <stop offset="14%" stopColor="#6b3410" />
          <stop offset="32%" stopColor="#a65b1d" />
          <stop offset="52%" stopColor="#8c4716" />
          <stop offset="80%" stopColor="#57290b" />
          <stop offset="100%" stopColor="#241003" />
        </linearGradient>

        <linearGradient id={id('base')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>

        <linearGradient id={id('glint')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.06" />
        </linearGradient>

        <linearGradient id={id('band')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c7f84" />
          <stop offset="16%" stopColor="#c3c6ca" />
          <stop offset="40%" stopColor="#e6e8ea" />
          <stop offset="66%" stopColor="#c9ccd0" />
          <stop offset="100%" stopColor="#74777c" />
        </linearGradient>

        <pattern id={id('brush')} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
          <line x1="0" y1="0" x2="0" y2="9" stroke="#fff" strokeOpacity="0.22" strokeWidth="0.6" />
        </pattern>

        <linearGradient id={id('alu')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#686b70" />
          <stop offset="18%" stopColor="#b7babe" />
          <stop offset="42%" stopColor="#eef0f2" />
          <stop offset="64%" stopColor="#c2c5c9" />
          <stop offset="100%" stopColor="#62656a" />
        </linearGradient>

        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8f6825" />
          <stop offset="45%" stopColor="#e1bb68" />
          <stop offset="70%" stopColor="#c79638" />
          <stop offset="100%" stopColor="#8f6825" />
        </linearGradient>

        <clipPath id={id('clip')}>
          <path d={BODY_PATH} />
        </clipPath>
      </defs>

      {/* soft base shadow */}
      <ellipse cx="60" cy="227" rx="48" ry="7" fill={`url(#${id('shadow')})`} />

      {/* amber glass body */}
      <path d={BODY_PATH} fill={`url(#${id('amber')})`} />

      <g clipPath={`url(#${id('clip')})`}>
        {/* thick glass base */}
        <rect x={BODY_X} y="196" width={BODY_W} height="30" fill={`url(#${id('base')})`} />
        <rect x={BODY_X} y="207" width={BODY_W} height="1" fill="#fff" opacity="0.08" />

        {/* glass highlights */}
        <rect x="21" y="70" width="6" height="140" rx="3" fill={`url(#${id('glint')})`} />
        <rect x="96" y="80" width="2" height="124" rx="1" fill="#fff" opacity="0.12" />

        {/* matte silver label band */}
        <rect x={BODY_X} y={BAND_Y} width={BODY_W} height={BAND_H} fill={`url(#${id('band')})`} />
        <rect x={BODY_X} y={BAND_Y} width={BODY_W} height={BAND_H} fill={`url(#${id('brush')})`} />
        <rect x="24" y={BAND_Y} width="9" height={BAND_H} fill="#fff" opacity="0.18" />
        <rect x={BODY_X} y={BAND_Y} width={BODY_W} height="0.8" fill="#000" opacity="0.28" />
        <rect x={BODY_X} y={BAND_Y + BAND_H - 0.8} width={BODY_W} height="0.8" fill="#000" opacity="0.28" />
      </g>

      {/* label */}
      {lines.length ? (
        <text
          x="60"
          textAnchor="middle"
          fill={INK}
          fillOpacity="0.9"
          style={{ fontFamily: FONT_STACK }}
          fontWeight="700"
          fontSize={labelSize}
          letterSpacing={`${(labelSize * 0.1).toFixed(2)}`}
        >
          {lines.map((line, i) => (
            <tspan
              key={i}
              x="60"
              y={blockTop + lineHeight * i + lineHeight / 2 + labelSize * 0.36}
              {...fitProps(line, labelSize, LABEL_EM)}
            >
              {line}
            </tspan>
          ))}
        </text>
      ) : null}

      <rect x="51" y={hairlineY} width="18" height={hairline} rx="0.5" fill={`url(#${id('gold')})`} />

      {sublabelText ? (
        <text
          x="60"
          y={sublabelCenter + sublabelSize * 0.36}
          textAnchor="middle"
          fill={INK}
          fillOpacity="0.72"
          style={{ fontFamily: FONT_STACK }}
          fontWeight="600"
          fontSize={sublabelSize}
          letterSpacing={`${(sublabelSize * 0.04).toFixed(2)}`}
          {...fitProps(sublabelText, sublabelSize, SUBLABEL_EM)}
        >
          {sublabelText}
        </text>
      ) : null}

      {/* aluminium cap: crimp collar, flip-off top, thin gold ring */}
      <rect x="22" y="25" width="76" height="29" rx="4" fill={`url(#${id('alu')})`} />
      <rect x="22" y="45" width="76" height="1" fill="#000" opacity="0.22" />
      <rect x="22" y="47.5" width="76" height="0.8" fill="#fff" opacity="0.25" />
      <rect x="25" y="12" width="70" height="16" rx="5" fill={`url(#${id('alu')})`} />
      <rect x="29" y="13" width="62" height="2.2" rx="1.1" fill="#fff" opacity="0.55" />
      <rect x="25" y="26.5" width="70" height="1" fill="#000" opacity="0.2" />
      <rect x="23" y="53" width="74" height="3" rx="1.5" fill={`url(#${id('gold')})`} />
    </svg>
  )
}
