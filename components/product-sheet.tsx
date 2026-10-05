'use client'

// Ficha do produto em diálogo acessível: um esclarecedor sobre o peptídeo, não um carrinho.
// Celular: bottom sheet (arrasta pela alça para fechar). Desktop: painel central em duas colunas
// (foto à esquerda, texto à direita).
// Hierarquia: foto (só vitrine, sem zoom), nome, categoria (+ apelidos), "Como age" com a
// descrição e o aviso, uma linha de apresentação com as notas de protocolo e reenvio e o CTA.
// Nada acima do nome (sem selo de família no estilo eyebrow, regra 3 do cliente).
// Nada de "preço sob consulta", reais ou disponibilidade: isso é conversa do WhatsApp.
// AnimatePresence fica sempre montado para a animação de saída rodar.

import { useEffect, useEffectEvent, useId, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls, useIsPresent } from 'motion/react'
import { FileText, Package, RefreshCw, X } from 'lucide-react'
import { ProductPhoto, ToneGlow } from '@/components/product-card'
import { Vial } from '@/components/vial'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { track } from '@/lib/analytics'
import { getFamily, hasProtocol, productWhatsappMessage, type Product } from '@/lib/catalog'
import { COPY } from '@/lib/content'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const
const DESKTOP_QUERY = '(min-width: 768px)'
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

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

// Parágrafos separados por linha em branco viram <p> próprios.
function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
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
  const aboutId = `${uid}-como-age`

  const copy = COPY.productSheet
  const family = getFamily(product.family)
  const paragraphs = toParagraphs(product.description)
  const aliases =
    product.aliases?.filter((alias) => alias.toLowerCase() !== product.name.toLowerCase()) ?? []
  // Uma linha sob o nome: categoria e apelidos ('Análogo de GLP-1 · Semaglutide · Sema').
  // Espaço fixo antes do ponto: se quebrar, o ponto fica no fim da linha, não no começo.
  const subtitle = [product.category, ...aliases].filter(Boolean).join('\u00a0· ')

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
    track('sku_consult', { product: product.slug })
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
          'md:max-h-[min(88dvh,38rem)] md:min-h-[26rem] md:max-w-[52rem] md:flex-row md:rounded-[2rem] md:border-b',
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
          {/* Vitrine: foto 4:3 só de exibição (sem zoom), sempre inteira (sem corte).
              Celular: caixa 4:3 centralizada com 208px de altura (~277px de largura), longe do X.
              Desktop: coluna de 40% com a foto inteira sobre um fundo escuro. */}
          <div className="relative mx-3 shrink-0 md:my-3 md:ml-3 md:mr-0 md:flex md:w-[40%] md:items-center md:justify-center md:overflow-hidden md:rounded-[1.5rem] md:bg-background/50 md:p-4">
            <ToneGlow tone={family.tone} className="hidden w-[95%] md:block" />
            <div className="relative mx-auto flex aspect-[4/3] h-52 max-w-full items-center justify-center overflow-hidden rounded-[1.25rem] bg-background/50 md:h-auto md:w-full md:rounded-2xl">
              {product.image ? (
                <ProductPhoto src={product.image} eager />
              ) : (
                <>
                  <ToneGlow tone={family.tone} className="w-[70%] md:hidden" />
                  <Vial label={product.name} sublabel="" className="relative w-16 md:w-20" />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain">
            <div className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-5 sm:px-6 md:px-8 md:pt-8">
              <header className="flex flex-col items-start gap-1.5 md:pr-12">
                <h2
                  id={titleId}
                  className="text-balance font-serif text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl"
                >
                  <span className="sr-only">{copy.dialogLabel}: </span>
                  {product.name}
                </h2>
                {subtitle ? (
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    {product.category ? <span className="sr-only">{copy.categoryLabel}: </span> : null}
                    {subtitle}
                  </p>
                ) : null}
              </header>

              {/* O conteúdo principal: como o peptídeo age. */}
              <section aria-labelledby={aboutId}>
                <h3 id={aboutId} className="font-serif text-lg font-semibold leading-snug text-gold-soft">
                  {copy.aboutTitle}
                </h3>
                <div className="mt-2 flex flex-col gap-3 text-pretty text-sm leading-relaxed text-foreground/85 md:text-[0.9375rem]">
                  {paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                {/* Aviso do texto explicativo (resumo da observação geral do cliente). */}
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{copy.disclaimer}</p>
              </section>

              {/* Uma linha de apresentação e as duas notas curtas, sem repetir nada. */}
              <div className="mt-auto border-t border-border/60 pt-4">
                {/* Sem miligramas: cada peptídeo tem várias dosagens (regra do cliente). */}
                  <p className="mb-3 flex items-start gap-2 text-sm font-medium text-foreground">
                    <Package aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-soft" />
                    <span>{copy.presentationNote}</span>
                  </p>

                <ul className="flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
                  <li className="flex gap-2">
                    <RefreshCw aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-gold-soft/80" />
                    <span className="text-foreground/85">{copy.resend}</span>
                  </li>
                  {/* O protocolo sempre aparece com o aviso (regra do cliente). */}
                  {hasProtocol(product) ? (
                    <li className="flex gap-2">
                      <FileText aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-gold-soft/80" />
                      <span>
                        <span className="text-foreground/85">{COPY.protocol.badge}.</span> {COPY.protocol.note}
                      </span>
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>

            {/* CTA sempre à vista: gruda no rodapé da área que rola. */}
            <div className="sticky bottom-0 z-10 border-t border-border/60 bg-card/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md sm:px-6 md:px-8 md:pb-6">
              {/* Captura o clique do link para registrar a consulta do SKU (o botão registra o whatsapp_click). */}
              <div onClick={handleConsult}>
                <WhatsAppButton
                  message={productWhatsappMessage(product)}
                  location="product_sheet"
                  product={product.slug}
                  size="lg"
                  className="w-full"
                >
                  {copy.cta}
                </WhatsAppButton>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
