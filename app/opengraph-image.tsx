import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { SITE } from '@/lib/site'

export const alt = `${SITE.name} · ${SITE.slogan}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Sem eyebrow, sem caixa alta espaçada e sem travessão (regras do cliente).
// Primo + Peptídeos em caixa normal, como o logo do site.
const WORDMARK = 'Primo'
const WORDMARK_SUB = 'Peptídeos'
const FOOTER = 'O Primo conhece a fonte.'

const COLORS = {
  background: '#1b1d20',
  bone: '#eef0f2',
  silver: '#b1b3b7',
  gold: '#c79638',
  goldSoft: '#d8b66c',
}

/** Loads a Google font subset (TTF) for Satori; null when offline so we fall back gracefully. */
async function loadGoogleFont(family: string, weight: number, text: string) {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`
    const css = await fetch(url, { signal: AbortSignal.timeout(4000) }).then((res) => res.text())
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1]
    if (!src) return null
    const font = await fetch(src, { signal: AbortSignal.timeout(4000) })
    return font.ok ? await font.arrayBuffer() : null
  } catch {
    return null
  }
}

async function loadBrandImage() {
  try {
    const file = await readFile(join(process.cwd(), 'public', 'primo-hero.png'))
    return `data:image/png;base64,${file.toString('base64')}`
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  const [fraunces, manrope, brandImage] = await Promise.all([
    loadGoogleFont('Fraunces', 600, WORDMARK + SITE.slogan),
    loadGoogleFont('Manrope', 600, WORDMARK_SUB + FOOTER),
    loadBrandImage(),
  ])

  const fonts = [
    ...(fraunces ? [{ name: 'Fraunces', data: fraunces, weight: 600 as const, style: 'normal' as const }] : []),
    ...(manrope ? [{ name: 'Manrope', data: manrope, weight: 600 as const, style: 'normal' as const }] : []),
  ]
  const serif = fraunces ? 'Fraunces' : undefined
  const sans = manrope ? 'Manrope' : undefined

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: COLORS.background,
          color: COLORS.bone,
        }}
      >
        {brandImage ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 560,
              height: 630,
              display: 'flex',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandImage} alt="" width={560} height={630} style={{ objectFit: 'cover' }} />
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                display: 'flex',
                background: `linear-gradient(90deg, ${COLORS.background} 0%, rgba(27, 29, 32, 0.55) 30%, rgba(27, 29, 32, 0) 60%)`,
              }}
            />
          </div>
        ) : null}

        {/* Graphite sheen (same mood as the site background) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 760,
            height: 630,
            display: 'flex',
            background: 'linear-gradient(145deg, rgba(42, 45, 49, 0.9) 0%, rgba(27, 29, 32, 0) 70%)',
          }}
        />

        {/* Soft gold glow */}
        <div
          style={{
            position: 'absolute',
            top: -220,
            left: -160,
            width: 640,
            height: 640,
            display: 'flex',
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(199, 150, 56, 0.16) 0%, rgba(199, 150, 56, 0) 70%)',
          }}
        />

        {/* Top gold hairline */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            display: 'flex',
            background: 'linear-gradient(90deg, rgba(143, 104, 37, 0) 0%, #8f6825 20%, #e1bb68 50%, #8f6825 80%, rgba(143, 104, 37, 0) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 720,
            height: '100%',
            padding: '112px 0 64px 80px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                fontFamily: serif,
                fontSize: 132,
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: 0,
                color: COLORS.bone,
              }}
            >
              {WORDMARK}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 18,
                fontFamily: sans,
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: 0,
                color: COLORS.silver,
              }}
            >
              {WORDMARK_SUB}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 40,
                width: 380,
                height: 2,
                background: 'linear-gradient(90deg, #8f6825 0%, #e1bb68 50%, rgba(143, 104, 37, 0) 100%)',
              }}
            />
            <div
              style={{
                display: 'flex',
                marginTop: 36,
                maxWidth: 600,
                fontFamily: serif,
                fontSize: 46,
                fontWeight: 600,
                lineHeight: 1.15,
                color: COLORS.goldSoft,
              }}
            >
              {SITE.slogan}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: sans,
              fontSize: 24,
              color: COLORS.silver,
            }}
          >
            <div style={{ display: 'flex', width: 28, height: 2, background: COLORS.gold }} />
            {FOOTER}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  )
}
