// Configuração central do site: marca, contato, WhatsApp e condições comerciais.
// Para trocar o número do WhatsApp, altere SÓ a constante WHATSAPP_NUMBER abaixo.

type Site = {
  name: 'Primo Peptídeos'
  shortName: 'Primo'
  slogan: 'Seu acesso direto ao fornecedor.'
  url: string
  locale: 'pt_BR'
  title: string
  description: string
  keywords: string[]
  logoSrc: string
}

// Endereço público do site (metadados, Open Graph). Ordem: domínio definido na mão
// (NEXT_PUBLIC_SITE_URL) → domínio de produção da Vercel → URL do deploy → local.
function siteUrl(): string {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? (vercelHost ? `https://${vercelHost}` : 'http://localhost:3000')
  return url.replace(/\/+$/, '')
}

export const SITE: Site = {
  name: 'Primo Peptídeos',
  shortName: 'Primo',
  slogan: 'Seu acesso direto ao fornecedor.',
  url: siteUrl(),
  locale: 'pt_BR',
  title: 'Primo Peptídeos · Seu acesso direto ao fornecedor',
  description:
    'O Primo faz a ponte entre você e um fornecedor internacional parceiro. Orçamento no WhatsApp e envio rastreado.',
  keywords: [
    'Primo Peptídeos',
    'peptídeos',
    'catálogo de peptídeos',
    'fornecedor internacional',
    'intermediação comercial',
    'envio para o Brasil',
    'protocolo de uso',
    'WhatsApp',
  ],
  // Asset substituível do logo (personagem do Primo). Trocar aqui quando houver versão final.
  logoSrc:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Imagem%20do%20ChatGPT%2029%20de%20set.%20de%202026%2C%2023_45_15-GtuA899RW5hdrs2ZFtVXJa7B5Ham61.png',
}

// Formato internacional, só dígitos (DDI + DDD + número). Único ponto de troca do número.
export const WHATSAPP_NUMBER = '595991636087'

export const WHATSAPP_DEFAULT_MESSAGE = 'Olá, Primo. Quero entender como funciona.'

export function whatsappLink(message?: string): string {
  const text = message ?? WHATSAPP_DEFAULT_MESSAGE
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

type Contact = {
  instagram: { handle: string; url: string } | null
  email: string | null
}

// TODO: os canais atuais ainda são da VitaPep (Instagram @vitapep.pharma e
// e-mail vitapep.pharma@gmail.com). Pelo briefing, eles serão convertidos para o
// Primo Peptídeos. Enquanto isso ficam null e o rodapé esconde o canal.
// Quando houver os canais do Primo, preencher assim:
//   instagram: { handle: '@primo...', url: 'https://instagram.com/primo...' },
//   email: 'contato@...',
export const CONTACT: Contact = {
  instagram: null,
  email: null,
}

// Condições comerciais vigentes. Todos os textos do site leem daqui.
export const COMMERCIAL = {
  vialsPerBox: 10,
  shippingUSD: 100,
  leadTimeDays: { min: 20, max: 35 },
  usdToBrlRef: 5.2,
  // Protocolo de uso completo em PDF de cada peptídeo comprado, enviado junto com a compra.
  // Vale para todo o catálogo; um produto pode ser exceção com protocol: false (lib/catalog.ts).
  protocolIncluded: true,
} as const

// Ordem = ordem das seções na home.
export const SECTION_IDS = {
  hero: 'inicio',
  how: 'como-funciona',
  model: 'modelo',
  source: 'fonte',
  featured: 'destaques',
  protocol: 'protocolo',
  catalog: 'catalogo',
  faq: 'duvidas',
  contact: 'fale-com-o-primo',
} as const

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Como funciona', href: `/#${SECTION_IDS.how}` },
  { label: 'Produtos', href: `/#${SECTION_IDS.catalog}` },
  { label: 'Dúvidas', href: `/#${SECTION_IDS.faq}` },
]
