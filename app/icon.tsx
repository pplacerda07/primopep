import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

/** Fraunces "P" from Google Fonts; falls back to the bundled font when offline. */
async function loadMonogramFont() {
  try {
    const css = await fetch('https://fonts.googleapis.com/css2?family=Fraunces:wght@600&text=P', {
      signal: AbortSignal.timeout(4000),
    }).then((res) => res.text())
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1]
    if (!src) return null
    const font = await fetch(src, { signal: AbortSignal.timeout(4000) })
    return font.ok ? await font.arrayBuffer() : null
  } catch {
    return null
  }
}

export default async function Icon() {
  const fraunces = await loadMonogramFont()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          background: 'linear-gradient(145deg, #2a2d31 0%, #1b1d20 55%, #141517 100%)',
          border: '2px solid rgba(199, 150, 56, 0.55)',
        }}
      >
        <div
          style={{
            display: 'flex',
            marginTop: fraunces ? -2 : 0,
            fontSize: 42,
            fontWeight: 600,
            lineHeight: 1,
            color: '#d8b66c',
            fontFamily: fraunces ? 'Fraunces' : undefined,
          }}
        >
          P
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fraunces ? [{ name: 'Fraunces', data: fraunces, weight: 600, style: 'normal' }] : undefined,
    },
  )
}
