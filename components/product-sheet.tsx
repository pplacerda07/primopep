'use client'

// Detalhes do produto em diálogo acessível.
// Celular: bottom sheet (arrasta pela alça para fechar). Desktop: painel central em duas colunas.
// Hierarquia: vial, família, nome, resumo, apresentações, preço, caixa + reenvio, protocolo
// (sempre com o aviso), CTA.
// AnimatePresence fica sempre montado para a animação de saída rodar.

import { useEffect, useEffectEvent, useId, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls, useIsPresent } from 'motion/react'
import { FileText, Package, RefreshCw, X } from 'lucide-react'
import { FamilyChip, ToneGlow } from '@/components/product-card'
import { Vial } from '@/components/vial'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { track } from '@/lib/analytics'
import {
  getFamily,
  hasProtocol,
  productWhatsappMessage,
  STATUS_LABEL,
  type Product,
  type ProductStatus,
} from '@/lib/catalog'
import { COPY, fill } from '@/lib/content'
import { brlReference, formatUSD } from '@/lib/format'
import { COMMERCIAL } from '@/lib/site'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const
const DESKTOP_QUERY = '(min-width: 768px)'
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// 'sob-consulta' não aparece na ficha (a nota do CTA já fala da confirmação).
const STATUS_DOT: Record<ProductStatus, string> = {
  'sob-consulta': 'bg-gold-soft',
  disponivel: 'bg-[#8fbf9a]',
  indisponivel: 'bg-silver/50',
}

/* ------------------------------------------------------------------ */
/* Trava de rolagem com contador (seguro com mais de um diálogo).       */
/* ------------------------------------------------------------------ */

let lockCount = 0
let restoreScroll: (() => void) | null = null

function lockScroll() {
  lockCount += 1
  if (lockCount > 1) return

  const root = document.documentElement
  const hasScrollbar = window.innerWidth - root.clientWidth > 0
  const previous = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter }

  root.style.overflow = 'hidden'
  // Mantém o espaço da barra de rolagem: nada "pula" de lado (nem o header fixo).
  if (hasScrollbar) root.style.scrollbarGutter = 'stable'

  restoreScroll = () => {
    root.style.overflow = previous.overflow
    root.style.scrollbarGutter = previous.gutter
  }
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0) return
  restoreScroll?.()
  restoreScroll = null
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  )
}

const subscribeNothing = () => () => {}

// false no servidor e na hidratação; true depois (portal só existe no cliente).
function useMounted() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  )
}

function trapFocus(event: KeyboardEvent, container: HTMLElement) {
  const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.getClientRects().length > 0,
  )
  if (items.length === 0) {
    event.preventDefault()
    container.focus()
    return
  }

  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  const inside = active instanceof Node && container.contains(active)

  if (event.shiftKey) {
    if (!inside || active === first || active === container) {
      event.preventDefault()
      last.focus()
    }
  } else if (!inside || active === last) {
    event.preventDefault()
    first.focus()
  }
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export function ProductSheet({
  product,
  onClose,
}: {
  product: Product | null
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {product ? <SheetDialog key={product.slug} product={product} onClose={onClose} /> : null}
    </AnimatePresence>
  )
}

function SheetDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const mounted = useMounted()
  const isDesktop = useIsDesktop()
  const isPresent = useIsPresent()
  const dragControls = useDragControls()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const uid = useId()
  const titleId = `${uid}-titulo`
  const groupName = `${uid}-apresentacao`

  const presentations = product.presentations
  const [selectedId, setSelectedId] = useState<string | null>(presentations[0]?.id ?? null)
  const selected = presentations.find((item) => item.id === selectedId)

  const copy = COPY.productSheet
  const family = getFamily(product.family)
  const price = selected?.priceUSD ?? null
  const vials = selected?.vials ?? presentations[0]?.vials ?? COMMERCIAL.vialsPerBox

  const requestClose = useEffectEvent(() => onClose())

  // Abertura: trava a rolagem, foca o botão de fechar, prende o Tab e escuta o Esc.
  // Na saída (isPresent = false) solta tudo na hora e devolve o foco a quem abriu.
  useEffect(() => {
    if (!mounted || !isPresent) return

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    lockScroll()
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }))

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }
      if (event.key === 'Tab' && panelRef.current) trapFocus(event, panelRef.current)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      unlockScroll()
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [mounted, isPresent])

  function handleDragEnd(_event: unknown, info: { offset: { y: number }; velocity: { y: number } }) {
    if (info.offset.y > 120 || info.velocity.y > 650) onClose()
  }

  function handleConsult() {
    track('sku_consult', { product: product.slug, presentation: selected?.label ?? null })
  }

  if (!mounted) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-6',
        !isPresent && 'pointer-events-none',
      )}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-[#0b0c0e]/75 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={isDesktop ? { opacity: 0, y: 24, scale: 0.97 } : { y: '100%' }}
        animate={
          isDesktop
            ? { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE } }
            : { y: 0, transition: { duration: 0.45, ease: EASE } }
        }
        exit={
          isDesktop
            ? { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.22, ease: 'easeIn' } }
            : { y: '100%', transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }
        }
        drag={isDesktop ? false : 'y'}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden outline-none',
          'rounded-t-[1.75rem] border border-b-0 border-border/70 bg-card shadow-luxe-lg',
          'md:h-[min(88dvh,36rem)] md:max-h-none md:max-w-[52rem] md:flex-row md:rounded-[2rem] md:border-b',
        )}
      >
        {/* Alça do bottom sheet: arrastar para baixo fecha. */}
        <div
          aria-hidden="true"
          onPointerDown={(event) => dragControls.start(event)}
          className="flex shrink-0 cursor-grab touch-none justify-center pb-2 pt-3 active:cursor-grabbing md:hidden"
        >
          <span className="h-1.5 w-11 rounded-full bg-silver/30" />
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className={cn(
            'absolute right-3 top-3 z-20 inline-flex size-11 cursor-pointer items-center justify-center rounded-full',
            'border border-border/70 bg-background/70 text-foreground backdrop-blur-md transition-colors duration-200',
            'hover:border-gold/50 hover:text-gold-soft md:right-5 md:top-5',
          )}
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        {/* Celular: uma área de rolagem só. Desktop (md:contents): vitrine fixa + coluna que rola. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain md:contents">
          <div className="relative mx-3 flex h-40 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-background/50 md:my-3 md:ml-3 md:mr-0 md:h-auto md:w-[40%] md:rounded-[1.5rem]">
            <ToneGlow tone={family.tone} className="w-[70%] md:w-[85%]" />

            {product.image ? (
              <img
                src={product.image}
                alt=""
                width={640}
                height={640}
                decoding="async"
                className="relative h-[78%] w-auto max-w-[80%] object-contain"
              />
            ) : (
              <Vial label={product.name} sublabel={selected?.label ?? ''} className="relative w-16 md:w-28 lg:w-32" />
            )}
          </div>

          <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain">
            <div className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-5 sm:px-6 md:px-8 md:pt-8">
              <header className="flex flex-col items-start gap-1.5 md:pr-12">
                <FamilyChip family={family} />
                <h2
                  id={titleId}
                  className="text-balance font-serif text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl"
                >
                  <span className="sr-only">{copy.dialogLabel}: </span>
                  {product.name}
                </h2>
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{product.summary}</p>
              </header>

              {presentations.length > 1 ? (
                <fieldset>
                  <legend className="mb-2.5 text-sm text-muted-foreground">{copy.choosePresentation}</legend>
                  <div className="flex flex-wrap gap-2">
                    {presentations.map((presentation) => {
                      const checked = presentation.id === selectedId
                      return (
                        <label
                          key={presentation.id}
                          className={cn(
                            'inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full border pl-3 pr-4',
                            'text-sm font-semibold tabular-nums transition-colors duration-200',
                            'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-soft',
                            checked
                              ? 'border-gold/70 bg-gold/10 text-gold-soft'
                              : 'border-border/80 bg-background/40 text-foreground hover:border-gold/40',
                          )}
                        >
                          <input
                            type="radio"
                            name={groupName}
                            value={presentation.id}
                            checked={checked}
                            onChange={() => setSelectedId(presentation.id)}
                            className="sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={cn(
                              'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-200',
                              checked ? 'border-gold bg-gold' : 'border-silver/50',
                            )}
                          >
                            {checked ? <span className="size-1.5 rounded-full bg-ink" /> : null}
                          </span>
                          {presentation.label}
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              ) : presentations.length === 1 ? (
                // Uma apresentação só: nada a escolher.
                <p className="text-sm font-semibold tabular-nums text-foreground">{presentations[0].label}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{copy.presentationTbd}</p>
              )}

              <div className="border-t border-border/60 pt-5">
                <div aria-live="polite" aria-atomic="true">
                  {price !== null ? (
                    <>
                      <p className="text-sm text-muted-foreground">{copy.price}</p>
                      <p className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-serif text-3xl font-semibold leading-tight tabular-nums text-foreground">
                          {formatUSD(price)}
                        </span>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {fill(copy.brlRef, { brl: brlReference(price) })}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="font-serif text-2xl font-semibold leading-tight text-gold-soft">
                      {copy.priceOnRequest}
                    </p>
                  )}
                </div>

                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground">
                  <li className="flex items-center gap-2">
                    <Package aria-hidden="true" className="size-4 shrink-0 text-gold-soft" />
                    {fill(copy.box, { n: vials })}
                  </li>
                  <li className="flex items-center gap-2">
                    <RefreshCw aria-hidden="true" className="size-4 shrink-0 text-gold-soft" />
                    {copy.resend}
                  </li>
                  {product.status !== 'sob-consulta' ? (
                    <li className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cn('mx-[0.3125rem] size-1.5 shrink-0 rounded-full', STATUS_DOT[product.status])}
                      />
                      {STATUS_LABEL[product.status]}
                    </li>
                  ) : null}
                </ul>

                {/* O protocolo sempre aparece com o aviso (regra do cliente). */}
                {hasProtocol(product) ? (
                  <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted-foreground">
                    <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-soft" />
                    <span>
                      <span className="font-medium text-foreground">{COPY.protocol.badge}.</span>{' '}
                      {COPY.protocol.note}
                    </span>
                  </p>
                ) : null}

                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{copy.shippingNote}</p>
              </div>
            </div>

            {/* CTA sempre à vista: gruda no rodapé da área que rola. */}
            <div className="sticky bottom-0 z-10 border-t border-border/60 bg-card/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md sm:px-6 md:px-8 md:pb-6">
              {/* Captura o clique do link para registrar a consulta do SKU (o botão registra o whatsapp_click). */}
              <div onClick={handleConsult}>
                <WhatsAppButton
                  message={productWhatsappMessage(product, selected)}
                  location="product_sheet"
                  product={product.slug}
                  size="lg"
                  className="w-full"
                >
                  {copy.cta}
                </WhatsAppButton>
              </div>
              <p className="mt-2.5 text-center text-xs leading-relaxed text-muted-foreground">{copy.note}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
