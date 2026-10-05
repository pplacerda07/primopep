// Card de produto compacto (cabe em ~160px: grade de 2 colunas no celular).
// Sem 'use client' de propósito: renderiza no servidor quando usado sem onOpen e vira
// componente de cliente quando importado por um (ex.: FeaturedProducts).
//
// Mostra só o essencial: foto real da caixa, nome, resumo de 7 palavras, preço (só quando
// definido) e uma ação (Consultar, em contorno: o dourado sólido fica para o WhatsApp
// flutuante). O resto (como age, apresentação, protocolo) fica no ProductSheet.
// Nada acima do nome: sem selo de família no estilo eyebrow (regra 3 do cliente).
// A foto é só vitrine: não amplia, não é link e não tem zoom no hover.

import { useId } from 'react'
import { Vial } from '@/components/vial'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { track } from '@/lib/analytics'
import {
  getFamily,
  productWhatsappMessage,
  startingPriceUSD,
  type FamilyTone,
  type Product,
} from '@/lib/catalog'
import { COPY, fill } from '@/lib/content'
import { formatUSD } from '@/lib/format'
import { cn } from '@/lib/utils'

// Tom de cada família: brilho atrás do vial (quando não há foto).
export const TONE_STYLES: Record<FamilyTone, { glow: string }> = {
  gold: { glow: 'rgba(199, 150, 56, 0.24)' },
  silver: { glow: 'rgba(177, 179, 183, 0.18)' },
  bronze: { glow: 'rgba(185, 131, 90, 0.22)' },
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

// Fotos dos produtos (public/peptideos): 960 × 720, 4:3.
const PHOTO_WIDTH = 960
const PHOTO_HEIGHT = 720

// Foto real do produto preenchendo o pai (que define tamanho, cantos e overflow-hidden).
// Só vitrine: sem link, sem zoom, sem arrastar. Borda interna sutil e um degradê leve no
// terço de baixo (sem escurecer o pó branco e o vial solto da foto).
export function ProductPhoto({
  src,
  eager = false,
  className,
}: {
  src: string
  /** true na ficha (abre por clique, a foto precisa vir na hora); no card fica lazy. */
  eager?: boolean
  className?: string
}) {
  return (
    <>
      <img
        src={src}
        alt=""
        width={PHOTO_WIDTH}
        height={PHOTO_HEIGHT}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className={cn(
          'pointer-events-none absolute inset-0 size-full select-none object-cover object-[50%_45%]',
          className,
        )}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-card/45 to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10"
      />
    </>
  )
}

const LABELS = COPY.featured.labels

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
        'group relative flex h-full flex-col rounded-2xl border border-border/60 glass p-1.5 sm:p-2',
        'transition-colors duration-300 hover:border-gold/40',
      )}
    >
      {/* Vitrine 4:3: foto real da caixa; sem foto, o vial desenhado. */}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-background/50">
        {product.image ? (
          <ProductPhoto src={product.image} />
        ) : (
          <>
            <ToneGlow tone={family.tone} className="w-[80%] opacity-80" />
            <Vial label={product.name} className="relative w-10 sm:w-12 lg:w-14" />
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-2.5 sm:px-2 sm:pt-3">
        <Heading
          id={titleId}
          className="text-balance font-serif text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg"
        >
          {product.name}
        </Heading>
        <p className="mt-1 line-clamp-3 text-xs leading-snug text-muted-foreground">{product.summary}</p>

        <div className="mt-auto pt-3">
          {/* Preço só quando existe: "sob consulta" já é o que o Consultar diz. */}
          {priceText !== null ? (
            <p className="mb-3 text-sm font-semibold tabular-nums text-foreground">{priceText}</p>
          ) : null}

          {/* Contorno, igual ao tile dos Mais buscados. z-10: acima da área clicável do card.
              min-h-11: alvo de toque de 44px na grade de 2 colunas do celular. */}
          <WhatsAppButton
            message={productWhatsappMessage(product)}
            location={location}
            product={product.slug}
            size="sm"
            variant="secondary"
            className="z-10 min-h-11 w-full gap-1.5 border-gold/30 px-2 text-gold-soft hover:border-gold/70 hover:text-bone"
          >
            {LABELS.consult}
            <span className="sr-only">: {product.name}</span>
          </WhatsAppButton>
        </div>
      </div>

      {onOpen ? (
        // Cobre o card inteiro (menos o Consultar, que fica acima): qualquer toque abre a ficha
        // explicativa (não é zoom da foto), com um único ponto de foco no teclado.
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
