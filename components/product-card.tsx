// Card de produto compacto (cabe em ~160px: grade de 2 colunas no celular).
// Sem 'use client' de propósito: renderiza no servidor quando usado sem onOpen e vira
// componente de cliente quando importado por um (ex.: FeaturedProducts).
//
// Mostra só o essencial: vial, família, nome, apresentação, preço (só quando definido) e uma
// ação (Consultar, em contorno: o dourado sólido fica para o WhatsApp flutuante).
// O resto (resumo, caixa, protocolo, referência em reais) fica no ProductSheet.

import { useId } from 'react'
import { Vial } from '@/components/vial'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { track } from '@/lib/analytics'
import {
  getFamily,
  productWhatsappMessage,
  startingPriceUSD,
  type Family,
  type FamilyTone,
  type Product,
} from '@/lib/catalog'
import { COPY, fill } from '@/lib/content'
import { formatUSD } from '@/lib/format'
import { cn } from '@/lib/utils'

// Tom de cada família: ponto ao lado do nome da família e brilho atrás do vial.
export const TONE_STYLES: Record<FamilyTone, { dot: string; glow: string }> = {
  gold: { dot: 'bg-gold', glow: 'rgba(199, 150, 56, 0.24)' },
  silver: { dot: 'bg-silver', glow: 'rgba(177, 179, 183, 0.18)' },
  bronze: { dot: 'bg-[#b9835a]', glow: 'rgba(185, 131, 90, 0.22)' },
}

// Nome da família em caixa normal, com o ponto do tom.
export function FamilyChip({ family, className }: { family: Family; className?: string }) {
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', TONE_STYLES[family.tone].dot)} />
      <span className="truncate">{family.label}</span>
    </span>
  )
}

// Brilho radial no tom da família (decorativo). Posicione o pai como relative.
export function ToneGlow({ tone, className }: { tone: FamilyTone; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full',
        className,
      )}
      style={{ background: `radial-gradient(closest-side, ${TONE_STYLES[tone].glow}, transparent)` }}
    />
  )
}

const LABELS = COPY.featured.labels

// 'Apresentação a confirmar' → 'A confirmar': no card a linha já é a da apresentação.
const TBD_SHORT = (() => {
  const text = LABELS.presentationTbd.replace(/^apresentação\s+/i, '')
  return text.charAt(0).toUpperCase() + text.slice(1)
})()

export function ProductCard({
  product,
  onOpen,
  headingLevel = 'h3',
  location = 'product_card',
}: {
  product: Product
  /** Abre os detalhes (ProductSheet). Sem ele, o card não é clicável (só o Consultar). */
  onOpen?: (p: Product) => void
  headingLevel?: 'h3' | 'h4'
  /** Origem para analytics (whatsapp_click / product_click). */
  location?: string
}) {
  const titleId = useId()
  const Heading = headingLevel
  const family = getFamily(product.family)
  const { presentations } = product

  const price = startingPriceUSD(product)
  const pricedCount = presentations.filter((item) => item.priceUSD !== null).length
  const presentationText = presentations.length > 0 ? presentations.map((item) => item.label).join(' · ') : null
  // Só pré-preenche a apresentação na mensagem quando não há escolha a fazer.
  const onlyPresentation = presentations.length === 1 ? presentations[0] : undefined

  const priceText =
    price === null ? null : pricedCount > 1 ? `${LABELS.fromPrice} ${formatUSD(price)}` : formatUSD(price)

  function handleOpen() {
    track('product_click', { product: product.slug, location })
    onOpen?.(product)
  }

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border border-border/60 glass p-2',
        'transition-colors duration-300 hover:border-gold/40',
      )}
    >
      {/* Vitrine: foto real quando houver; senão, o vial desenhado. */}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-background/50 sm:aspect-[5/4]">
        <ToneGlow
          tone={family.tone}
          className="w-[80%] opacity-80 transition-opacity duration-500 group-hover:opacity-100"
        />

        {product.image ? (
          <img
            src={product.image}
            alt=""
            width={480}
            height={480}
            loading="lazy"
            decoding="async"
            className="relative h-[78%] w-auto max-w-[78%] object-contain"
          />
        ) : (
          <Vial
            label={product.name}
            sublabel={presentations[0]?.label ?? ''}
            className="relative w-12 transition-transform duration-500 ease-out motion-safe:group-hover:-translate-y-1 sm:w-16 lg:w-[4.5rem]"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3 sm:px-2">
        <FamilyChip family={family} />
        <Heading
          id={titleId}
          className="mt-1 text-balance font-serif text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg"
        >
          {product.name}
        </Heading>
        <p
          className={cn(
            'mt-0.5 truncate text-xs tabular-nums',
            presentationText ? 'text-foreground/80' : 'text-muted-foreground',
          )}
        >
          <span className="sr-only">{LABELS.presentations}: </span>
          {presentationText ?? TBD_SHORT}
        </p>

        <div className="mt-auto pt-3">
          {/* Preço só quando existe: "sob consulta" já é o que o Consultar diz. */}
          {priceText !== null ? (
            <p className="mb-3 text-sm font-semibold tabular-nums text-foreground">{priceText}</p>
          ) : null}

          {/* Contorno, igual ao tile dos Mais buscados. z-10: acima da área clicável do card. */}
          <WhatsAppButton
            message={productWhatsappMessage(product, onlyPresentation)}
            location={location}
            product={product.slug}
            size="sm"
            variant="secondary"
            className="z-10 w-full gap-1.5 border-gold/30 px-2 text-gold-soft hover:border-gold/70 hover:text-bone"
          >
            {LABELS.consult}
            <span className="sr-only">: {product.name}</span>
          </WhatsAppButton>
        </div>
      </div>

      {onOpen ? (
        // Cobre o card inteiro (menos o Consultar, que fica acima): qualquer toque abre os
        // detalhes, com um único ponto de foco no teclado e o anel de foco no card todo.
        <button
          type="button"
          onClick={handleOpen}
          aria-haspopup="dialog"
          aria-label={fill(LABELS.detailsAria, { product: product.name })}
          className="absolute inset-0 cursor-pointer rounded-2xl"
        />
      ) : null}
    </article>
  )
}
