'use client'

// Galeria em tela cheia das imagens do fornecedor parceiro.
// Teclado: ← → navegam, Esc fecha. Toque: deslizar para o lado troca a imagem.
// Só a mídia atual fica montada (o vídeo só carrega quando aberto).
// AnimatePresence fica sempre montado para a animação de saída rodar.

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type Variants } from 'motion/react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { COPY } from '@/lib/content'
import type { SourceMedia } from '@/lib/media'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const
const SWIPE_MIN = 48
// Faixa inferior do vídeo onde ficam os controles nativos: arrastar ali não troca de item.
const VIDEO_CONTROLS_ZONE = 64
const FOCUSABLE =
  'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])'

const ICON_BUTTON = cn(
  'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full',
  'border border-border/70 bg-background/60 text-foreground backdrop-blur-md transition-colors duration-200',
  'hover:border-gold/50 hover:text-gold-soft',
)

const SLIDE: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE } },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -40,
    transition: { duration: 0.16, ease: 'easeIn' },
  }),
}

/* ------------------------------------------------------------------ */
/* Trava de rolagem com contador.                                      */
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

// Garante o atributo muted (iOS exige para tocar sozinho).
function keepMuted(video: HTMLVideoElement | null) {
  if (!video) return
  video.muted = true
  video.defaultMuted = true
}

function preload(item: SourceMedia | undefined) {
  const src = item ? (item.type === 'photo' ? item.src : item.poster) : undefined
  if (!src) return
  const image = new Image()
  image.decoding = 'async'
  image.src = src
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export function MediaLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: SourceMedia[]
  index: number | null
  onClose: () => void
  onIndexChange: (i: number) => void
}) {
  const open = index !== null && items[index] !== undefined

  return (
    <AnimatePresence>
      {open ? (
        <LightboxDialog
          key="lightbox"
          items={items}
          index={index}
          onClose={onClose}
          onIndexChange={onIndexChange}
        />
      ) : null}
    </AnimatePresence>
  )
}

function LightboxDialog({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: SourceMedia[]
  index: number
  onClose: () => void
  onIndexChange: (i: number) => void
}) {
  const mounted = useMounted()
  const isPresent = useIsPresent()
  const reduceMotion = useReducedMotion()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null)
  const swiped = useRef(false)
  const [direction, setDirection] = useState<1 | -1>(1)

  const copy = COPY.source
  const total = items.length
  const item = items[index]
  const canNavigate = total > 1

  function go(delta: 1 | -1) {
    if (!canNavigate) return
    setDirection(delta)
    onIndexChange((index + delta + total) % total)
  }

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === 'Tab') {
      if (dialogRef.current) trapFocus(event, dialogRef.current)
      return
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    // Com o foco no vídeo, as setas ficam com o player (avançar/voltar o vídeo).
    if (event.target instanceof HTMLMediaElement) return
    if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return
    event.preventDefault()
    go(event.key === 'ArrowRight' ? 1 : -1)
  })

  // Abertura: trava a rolagem, foca o botão de fechar, prende o Tab e escuta o teclado.
  // Na saída (isPresent = false) solta tudo na hora e devolve o foco a quem abriu.
  useEffect(() => {
    if (!mounted || !isPresent) return

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    lockScroll()
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }))

    function onKeyDown(event: KeyboardEvent) {
      handleKeyDown(event)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      unlockScroll()
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [mounted, isPresent])

  // Deixa o vizinho de cada lado no cache do navegador (sem montar nada).
  useEffect(() => {
    if (!mounted || !canNavigate) return
    preload(items[(index + 1) % total])
    preload(items[(index - 1 + total) % total])
  }, [mounted, canNavigate, items, index, total])

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    swiped.current = false
    gesture.current = null
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return

    const target = event.target
    if (target instanceof HTMLVideoElement) {
      const rect = target.getBoundingClientRect()
      if (event.clientY > rect.bottom - VIDEO_CONTROLS_ZONE) return
    }

    gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = gesture.current
    gesture.current = null
    if (!start || start.id !== event.pointerId) return

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.2) return

    swiped.current = true
    go(dx < 0 ? 1 : -1)
  }

  // Clique fora da mídia (no fundo escuro) fecha.
  function handleAreaClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (swiped.current) {
      swiped.current = false
      return
    }
    const target = event.target
    if (target instanceof Element && target.closest('img, video')) return
    onClose()
  }

  if (!mounted || !item) return null

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={copy.galleryLabel}
      tabIndex={-1}
      className={cn(
        'fixed inset-0 z-[90] flex flex-col text-bone outline-none',
        !isPresent && 'pointer-events-none',
      )}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-[#0b0c0e]/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      <motion.div
        className="relative flex min-h-0 flex-1 flex-col"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1, transition: { duration: 0.35, ease: EASE } }}
        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: 'easeIn' } }}
      >
        <div className="flex items-center justify-between gap-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
          <p className="text-sm tabular-nums text-muted-foreground">
            {index + 1} / {total}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className={ICON_BUTTON}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            gesture.current = null
          }}
          onClick={handleAreaClick}
          className="relative min-h-0 flex-1 touch-pan-y touch-pinch-zoom select-none"
        >
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            <motion.div
              key={item.id}
              custom={direction}
              variants={SLIDE}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center px-3 py-3 sm:px-6 md:px-24"
            >
              {item.type === 'video' ? (
                <video
                  ref={keepMuted}
                  src={item.src}
                  poster={item.poster}
                  aria-label={item.alt}
                  controls
                  muted
                  loop
                  playsInline
                  autoPlay={!reduceMotion}
                  preload={reduceMotion ? 'metadata' : 'auto'}
                  className="max-h-full min-h-0 min-w-0 max-w-full rounded-xl bg-black shadow-luxe-lg"
                />
              ) : (
                <img
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  decoding="async"
                  draggable={false}
                  className="h-auto max-h-full min-h-0 w-auto min-w-0 max-w-full rounded-xl object-contain shadow-luxe-lg"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 md:justify-center md:pb-6">
          {canNavigate ? (
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={copy.prev}
              className={cn(ICON_BUTTON, 'z-10 md:absolute md:left-6 md:top-1/2 md:size-12 md:-translate-y-1/2')}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
          ) : null}

          <p
            aria-live="polite"
            className="min-w-0 flex-1 text-center text-sm font-medium text-bone md:flex-none"
          >
            {item.caption}
          </p>

          {canNavigate ? (
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={copy.next}
              className={cn(ICON_BUTTON, 'z-10 md:absolute md:right-6 md:top-1/2 md:size-12 md:-translate-y-1/2')}
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          ) : null}
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
