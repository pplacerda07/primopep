import { track as vercelTrack } from '@vercel/analytics'

// Eventos instrumentados (briefing §15). Seguro para importar em qualquer lugar:
// no servidor, track() e captureUtm() simplesmente não fazem nada.

export type AnalyticsEvent =
  | 'whatsapp_click'
  | 'primary_cta_click'
  | 'product_click'
  | 'catalog_open'
  | 'sku_consult'
  | 'catalog_search'
  | 'catalog_filter'
  | 'faq_open'
  | 'whatsapp_popup_shown'
  | 'whatsapp_popup_dismissed'

type AnalyticsValue = string | number | boolean | null | undefined
type AnalyticsProps = Record<string, AnalyticsValue>
type CleanProps = Record<string, string | number | boolean | null>

// Disparado em window a cada track('whatsapp_click'): o pop-up do WhatsApp escuta e para de aparecer.
export const WHATSAPP_CLICK_EVENT = 'primo:whatsapp-click'

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

const UTM_STORAGE_KEY = 'primo:utm'
const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
] as const

function readStoredUtm(): Record<string, string> {
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') result[key] = value
    }
    return result
  } catch {
    return {}
  }
}

// Lê utm_* (+ gclid/fbclid) da URL atual e guarda na sessão.
// Valores novos substituem os antigos; sem parâmetros na URL, nada muda.
export function captureUtm(): void {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    const found: Record<string, string> = {}
    for (const key of UTM_KEYS) {
      const value = params.get(key)
      if (value) found[key] = value.slice(0, 200)
    }
    if (Object.keys(found).length === 0) return
    const merged = { ...readStoredUtm(), ...found }
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // sessionStorage indisponível (modo privado, bloqueio de cookies): ignora.
  }
}

function cleanProps(props?: AnalyticsProps): CleanProps {
  const result: CleanProps = {}
  if (!props) return result
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value
  }
  return result
}

// Envia o evento para window.dataLayer (GTM) e para o Vercel Analytics,
// já com os parâmetros de origem guardados na sessão.
export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (typeof window === 'undefined') return

  const payload: CleanProps = { ...readStoredUtm(), ...cleanProps(props) }

  try {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push({ event, ...payload })
  } catch {
    // ignora
  }

  try {
    vercelTrack(event, payload)
  } catch {
    // ignora
  }

  if (event === 'whatsapp_click') {
    try {
      window.dispatchEvent(new CustomEvent(WHATSAPP_CLICK_EVENT, { detail: payload }))
    } catch {
      // ignora
    }
  }
}
