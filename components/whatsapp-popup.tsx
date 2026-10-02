'use client'

import { X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent as ReactFocusEvent,
} from 'react'
import { Logo } from '@/components/logo'
import { track, WHATSAPP_CLICK_EVENT } from '@/lib/analytics'
import { COPY } from '@/lib/content'
import { WHATSAPP_POPUP } from '@/lib/site'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const
const LOCATION = 'popup'

/** Segundos de tela visível nesta sessão (continua entre / e /catalogo). */
const ELAPSED_KEY = 'primo:popup-elapsed'
/** Aberto agora: continua aberto ao trocar de página, até a pessoa fechar. */
const OPEN_KEY = 'primo:popup-open'
/** Já apareceu uma vez neste navegador: nunca mais aparece. */
const SEEN_KEY = 'primo:popup-seen'

/** Outro diálogo, o menu do celular ou uma trava de rolagem: o balão espera. */
const BLOCKING_SELECTOR = '[aria-modal="true"], header button[aria-controls][aria-expanded="true"]'
const WHATSAPP_LINK_SELECTOR = 'a[href*="wa.me/"]'
const TEXT_ENTRY =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]):not([type="color"]):not([type="file"]),' +
  ' textarea, select, [contenteditable=""], [contenteditable="true"]'

/* -------------------------------------------------------------------------- */
/* Armazenamento (com memória de reserva para o modo anônimo)                  */
/* -------------------------------------------------------------------------- */

const memory = new Map<string, string>()

function storage(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function read(kind: 'local' | 'session', key: string): string | null {
  try {
    const value = storage(kind)?.getItem(key)
    if (value != null) return value
  } catch {
    // indisponível: usa a memória
  }
  return memory.get(`${kind}:${key}`) ?? null
}

function write(kind: 'local' | 'session', key: string, value: string) {
  memory.set(`${kind}:${key}`, value)
  try {
    storage(kind)?.setItem(key, value)
  } catch {
    // ignora
  }
}

function remove(kind: 'local' | 'session', key: string) {
  memory.delete(`${kind}:${key}`)
  try {
    storage(kind)?.removeItem(key)
  } catch {
    // ignora
  }
}

function readElapsed(): number {
  const value = Number.parseInt(read('session', ELAPSED_KEY) ?? '0', 10)
  return Number.isFinite(value) && value > 0 ? Math.min(value, WHATSAPP_POPUP.delaySeconds) : 0
}

const isOpenStored = () => read('session', OPEN_KEY) === '1'
const isSeenStored = () => read('local', SEEN_KEY) === '1'

/* -------------------------------------------------------------------------- */
/* DOM                                                                         */
/* -------------------------------------------------------------------------- */

function isBlocked(): boolean {
  const { documentElement: html, body } = document
  return (
    html.style.overflow === 'hidden' ||
    body.style.overflow === 'hidden' ||
    document.querySelector(BLOCKING_SELECTOR) !== null
  )
}

function isTextEntry(element: Element | null): boolean {
  return element instanceof Element && element.matches(TEXT_ENTRY)
}

const subscribeNothing = () => () => {}

/* -------------------------------------------------------------------------- */
/* Balão                                                                       */
/* -------------------------------------------------------------------------- */

type WhatsAppPopupProps = {
  /** O botão principal (pílula no celular, botão redondo no desktop) está na tela. */
  floatVisible?: boolean
  /** A pessoa está digitando (teclado do celular aberto): a pílula some, o balão também. */
  editing?: boolean
  /** O CTA final ou o rodapé estão na tela (o botão principal sai de cena): o balão também. */
  suppressed?: boolean
}

/**
 * Balão de mensagem que sai do botão principal "Falar com o Primo", ligado a ele por bolinhas
 * de pensamento. Aparece uma vez por navegador, depois de WHATSAPP_POPUP.delaySeconds de tela
 * visível, e não tem botão próprio: o CTA é o botão de onde ele sai. Só existe no cliente.
 */
export function WhatsAppPopup(props: WhatsAppPopupProps = {}) {
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  )
  return hydrated ? <PopupController {...props} /> : null
}

function PopupController({
  floatVisible = false,
  editing = false,
  suppressed = false,
}: WhatsAppPopupProps) {
  const copy = COPY.whatsappPopup
  const reduceMotion = useReducedMotion()
  const messageId = useId()

  const [open, setOpen] = useState(isOpenStored)
  // Já apareceu antes (e não está aberto agora): não há mais nada a fazer.
  const [finished, setFinished] = useState(() => isSeenStored() && !isOpenStored())
  const [blocked, setBlocked] = useState(isBlocked)

  const containerRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const canShow = floatVisible && !editing && !suppressed
  const canShowRef = useRef(canShow)

  useEffect(() => {
    canShowRef.current = canShow
  }, [canShow])

  /** Se o foco estiver no balão, devolve para onde estava antes de ele sumir. */
  const releaseFocus = useCallback(() => {
    const container = containerRef.current
    const active = document.activeElement
    if (container && active instanceof HTMLElement && container.contains(active)) {
      const target = returnFocusRef.current
      if (target && target.isConnected) target.focus({ preventScroll: true })
      else active.blur()
    }
    returnFocusRef.current = null
  }, [])

  /** Fecha de vez: nunca mais aparece neste navegador. */
  const finish = useCallback(() => {
    releaseFocus()
    write('local', SEEN_KEY, '1')
    remove('session', OPEN_KEY)
    setOpen(false)
    setFinished(true)
  }, [releaseFocus])

  const dismiss = useCallback(
    (method: 'close' | 'escape') => {
      finish()
      track('whatsapp_popup_dismissed', { location: LOCATION, method, path: window.location.pathname })
    },
    [finish],
  )

  // Relógio de 1 s: conta só com a aba visível, até o balão aparecer pela primeira vez.
  useEffect(() => {
    if (finished || open) return

    const timer = window.setInterval(() => {
      const nowBlocked = isBlocked()
      setBlocked(nowBlocked)
      if (document.visibilityState !== 'visible') return

      const elapsed = Math.min(readElapsed() + 1, WHATSAPP_POPUP.delaySeconds)
      write('session', ELAPSED_KEY, String(elapsed))

      // Na hora certa, espera o botão principal estar na tela para sair dele.
      if (elapsed >= WHATSAPP_POPUP.delaySeconds && !nowBlocked && canShowRef.current) {
        write('local', SEEN_KEY, '1')
        write('session', OPEN_KEY, '1')
        setOpen(true)
        track('whatsapp_popup_shown', { location: LOCATION, path: window.location.pathname })
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [finished, open])

  // Um diálogo abrindo ou uma trava de rolagem (ficha, galeria, menu) esconde o balão na hora.
  useEffect(() => {
    if (finished || typeof MutationObserver === 'undefined') return
    const update = () => setBlocked(isBlocked())
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
    observer.observe(document.body, { childList: true, attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [finished])

  // Qualquer CTA de WhatsApp do site: o balão cumpriu o papel, encerra de vez.
  useEffect(() => {
    if (finished) return

    function onLinkClick(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest(WHATSAPP_LINK_SELECTOR)) finish()
    }

    window.addEventListener(WHATSAPP_CLICK_EVENT, finish)
    document.addEventListener('click', onLinkClick)
    document.addEventListener('auxclick', onLinkClick)
    return () => {
      window.removeEventListener(WHATSAPP_CLICK_EVENT, finish)
      document.removeEventListener('click', onLinkClick)
      document.removeEventListener('auxclick', onLinkClick)
    }
  }, [finished, finish])

  // É uma extensão do botão principal: só aparece junto com ele.
  const visible = open && !finished && !blocked && floatVisible && !suppressed

  // Esc fecha, a não ser que a tecla seja de um campo de texto (ex.: limpar a busca).
  useEffect(() => {
    if (!visible) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return
      const active = document.activeElement
      if (isTextEntry(active) && !containerRef.current?.contains(active)) return
      dismiss('escape')
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [visible, dismiss])

  function handleFocus(event: ReactFocusEvent<HTMLDivElement>) {
    const from = event.relatedTarget
    if (from instanceof HTMLElement && !event.currentTarget.contains(from)) {
      returnFocusRef.current = from
    }
  }

  // Bolinhas sobem do botão uma a uma; o balão chega por último.
  const dot: Variants = {
    hidden: { opacity: 0, scale: reduceMotion ? 1 : 0.3 },
    shown: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.25, delay: reduceMotion ? 0 : i * 0.14, ease: EASE },
    }),
  }
  const card: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 },
    shown: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.35, delay: reduceMotion ? 0 : 0.42, ease: EASE },
    },
  }
  // Mesmo acabamento do balão, com a borda um pouco mais clara para não sumir sobre fotos.
  const dotClass = 'glass absolute rounded-full border border-silver/40 shadow-luxe'

  return (
    <>
      {/* Um diálogo não modal não é anunciado ao montar: esta região avisa o leitor de tela. */}
      <p className="sr-only" aria-live="polite">
        {visible ? copy.message : ''}
      </p>

      <AnimatePresence>
        {visible ? (
          <motion.div
            key="whatsapp-popup"
            ref={containerRef}
            role="dialog"
            aria-modal="false"
            aria-labelledby={messageId}
            onFocus={handleFocus}
            initial="hidden"
            animate="shown"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {/* Celular: bolinhas saindo do topo da pílula "Falar com o Primo" (centralizada, h-12). */}
            <div
              aria-hidden="true"
              className={cn(
                'pointer-events-none fixed left-1/2 z-40 sm:hidden',
                'bottom-[calc(max(1rem,env(safe-area-inset-bottom))_+_3rem)]',
              )}
            >
              <motion.span custom={0} variants={dot} className={cn(dotClass, 'bottom-1.5 -left-1 size-2')} />
              <motion.span custom={1} variants={dot} className={cn(dotClass, 'bottom-[1.125rem] left-1 size-3')} />
              <motion.span custom={2} variants={dot} className={cn(dotClass, 'bottom-[2.125rem] left-3.5 size-4')} />
            </div>

            {/* Desktop: bolinhas subindo em diagonal do botão redondo (size-14, canto inferior direito). */}
            <div
              aria-hidden="true"
              className="pointer-events-none fixed bottom-6 right-6 z-40 hidden size-14 sm:block lg:bottom-8 lg:right-8"
            >
              <motion.span custom={0} variants={dot} className={cn(dotClass, 'bottom-[calc(100%+2px)] right-[62%] size-2')} />
              <motion.span custom={1} variants={dot} className={cn(dotClass, 'bottom-[calc(100%+14px)] right-[92%] size-3')} />
              <motion.span custom={2} variants={dot} className={cn(dotClass, 'bottom-[calc(100%+30px)] right-[124%] size-4')} />
            </div>

            {/* O balão: mesmo estilo de antes, sem botão (o CTA é o botão de onde ele sai). */}
            <motion.div
              variants={card}
              className={cn(
                'fixed left-4 right-4 z-40 mx-auto max-w-[19rem] origin-bottom',
                'bottom-[calc(max(1rem,env(safe-area-inset-bottom))_+_6.5rem)]',
                'sm:left-auto sm:right-[4.5rem] sm:mx-0 sm:w-[19rem] sm:origin-bottom-right sm:bottom-[8.25rem]',
                'lg:right-[5rem] lg:bottom-[8.75rem]',
              )}
            >
              <div className="glass relative rounded-3xl border border-border/70 py-3 pl-3 pr-11 shadow-luxe-lg">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-background/70"
                  >
                    <Logo className="h-9 w-9" />
                  </span>
                  <p
                    id={messageId}
                    className="min-w-0 rounded-2xl bg-secondary px-3 py-2 text-sm leading-snug text-bone"
                  >
                    {copy.message}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label={copy.close}
                  onClick={() => dismiss('close')}
                  className="absolute right-1.5 top-1.5 inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-accent/60 hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
