'use client'

import { X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
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
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { track, WHATSAPP_CLICK_EVENT } from '@/lib/analytics'
import { COPY } from '@/lib/content'
import { WHATSAPP_POPUP } from '@/lib/site'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const
const LOCATION = 'popup'

/** Seconds of visible time on the site, carried across / and /catalogo. */
const ELAPSED_KEY = 'primo:popup-elapsed'
/** Set once the visitor clicks any WhatsApp CTA: no more pop-ups this session. */
const DONE_KEY = 'primo:popup-done'
/** Set while the pop-up is open, so it survives navigating between / and /catalogo. */
const OPEN_KEY = 'primo:popup-open'

/** Another dialog, the mobile menu or a scroll lock is active: the pop-up waits. */
const BLOCKING_SELECTOR = '[aria-modal="true"], header button[aria-controls][aria-expanded="true"]'
const WHATSAPP_LINK_SELECTOR = 'a[href*="wa.me/"]'
const TEXT_ENTRY =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]):not([type="color"]):not([type="file"]),' +
  ' textarea, select, [contenteditable=""], [contenteditable="true"]'

/* -------------------------------------------------------------------------- */
/* Session storage (with an in-memory fallback for private mode)              */
/* -------------------------------------------------------------------------- */

const memory = new Map<string, string>()

function readStore(key: string): string | null {
  try {
    const value = window.sessionStorage.getItem(key)
    if (value !== null) return value
  } catch {
    // sessionStorage indisponível: usa a memória.
  }
  return memory.get(key) ?? null
}

function writeStore(key: string, value: string) {
  memory.set(key, value)
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // ignora
  }
}

function removeStore(key: string) {
  memory.delete(key)
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // ignora
  }
}

function readElapsed(): number {
  const value = Number.parseInt(readStore(ELAPSED_KEY) ?? '0', 10)
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(value, WHATSAPP_POPUP.intervalSeconds)
}

function writeElapsed(seconds: number) {
  writeStore(ELAPSED_KEY, String(seconds))
}

function readDone(): boolean {
  return readStore(DONE_KEY) === '1'
}

/** Was open when the visitor navigated away (and nothing has stopped it since). */
function readOpen(): boolean {
  return !readDone() && readStore(OPEN_KEY) === '1'
}

/* -------------------------------------------------------------------------- */
/* DOM checks                                                                  */
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
/* Pop-up                                                                      */
/* -------------------------------------------------------------------------- */

type WhatsAppPopupProps = {
  /** The floating WhatsApp button/bar is on screen: sit just above it. */
  floatVisible?: boolean
  /** The visitor is typing (mobile keyboard open): stay out of the way. */
  editing?: boolean
  /**
   * The final CTA or the footer is on screen (they carry the same WhatsApp CTA): stay hidden,
   * and a pop-up that is due waits until the visitor scrolls back up.
   */
  suppressed?: boolean
}

/**
 * Small WhatsApp-style chat bubble shown after every WHATSAPP_POPUP.intervalSeconds of visible
 * time on the site. Client only: nothing is rendered on the server or during hydration.
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

  const [done, setDone] = useState(readDone)
  const [shown, setShown] = useState(readOpen)
  const [blocked, setBlocked] = useState(isBlocked)

  const containerRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const shownRef = useRef(shown)
  const editingRef = useRef(editing)
  const suppressedRef = useRef(suppressed)

  useEffect(() => {
    editingRef.current = editing
  }, [editing])

  useEffect(() => {
    suppressedRef.current = suppressed
  }, [suppressed])

  /** If focus is inside the pop-up, hand it back to where it came from before it disappears. */
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

  const hide = useCallback(() => {
    releaseFocus()
    shownRef.current = false
    removeStore(OPEN_KEY)
    setShown(false)
  }, [releaseFocus])

  const dismiss = useCallback(
    (method: 'close' | 'escape') => {
      hide()
      writeElapsed(0)
      track('whatsapp_popup_dismissed', { location: LOCATION, method, path: window.location.pathname })
    },
    [hide],
  )

  // One 1s clock: counts only while the tab is visible and the pop-up is closed.
  useEffect(() => {
    if (done) return

    const timer = window.setInterval(() => {
      const nowBlocked = isBlocked()
      setBlocked(nowBlocked)
      if (shownRef.current || document.visibilityState !== 'visible') return

      const elapsed = Math.min(readElapsed() + 1, WHATSAPP_POPUP.intervalSeconds)
      if (
        elapsed >= WHATSAPP_POPUP.intervalSeconds &&
        !nowBlocked &&
        !editingRef.current &&
        !suppressedRef.current
      ) {
        writeElapsed(0)
        writeStore(OPEN_KEY, '1')
        shownRef.current = true
        setShown(true)
        track('whatsapp_popup_shown', { location: LOCATION, path: window.location.pathname })
        return
      }
      writeElapsed(elapsed)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [done])

  // A dialog opening or a scroll lock (sheet, lightbox, mobile menu) hides it right away.
  useEffect(() => {
    if (done || typeof MutationObserver === 'undefined') return
    const update = () => setBlocked(isBlocked())
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
    observer.observe(document.body, { childList: true, attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [done])

  // Any WhatsApp CTA on the site: stop for the rest of the session.
  useEffect(() => {
    if (done) return

    function stop() {
      writeStore(DONE_KEY, '1')
      hide()
      setDone(true)
    }
    function onLinkClick(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest(WHATSAPP_LINK_SELECTOR)) stop()
    }

    // track('whatsapp_click') fires the event; the click listener covers any untracked wa.me link.
    window.addEventListener(WHATSAPP_CLICK_EVENT, stop)
    document.addEventListener('click', onLinkClick)
    document.addEventListener('auxclick', onLinkClick)
    return () => {
      window.removeEventListener(WHATSAPP_CLICK_EVENT, stop)
      document.removeEventListener('click', onLinkClick)
      document.removeEventListener('auxclick', onLinkClick)
    }
  }, [done, hide])

  const visible = shown && !blocked && !done && !suppressed

  // Esc closes it, unless the key belongs to a text field elsewhere (e.g. clearing the search).
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

  return (
    <>
      {/* Mounting a non-modal dialog is not announced: this polite region tells screen readers
          it appeared, without moving focus. */}
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
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.35, ease: EASE }}
            className={cn(
              'fixed left-4 right-4 z-40 mx-auto max-w-[20rem] origin-bottom',
              'transition-[bottom] duration-300 ease-out motion-reduce:transition-none',
              // Mobile: just above the bottom WhatsApp bar (min-h-12), or the safe area when it is hidden.
              floatVisible && !editing
                ? 'bottom-[calc(max(1rem,env(safe-area-inset-bottom))_+_3.75rem)]'
                : 'bottom-[max(1rem,env(safe-area-inset-bottom))]',
              editing && 'max-sm:hidden',
              // sm and up: bottom-right, just above the round button (size-14).
              'sm:left-auto sm:right-6 sm:mx-0 sm:w-[20rem] sm:origin-bottom-right lg:right-8',
              floatVisible ? 'sm:bottom-[5.75rem] lg:bottom-[6.25rem]' : 'sm:bottom-6 lg:bottom-8',
            )}
          >
            <div className="glass relative rounded-3xl border border-border/70 p-3 shadow-luxe-lg sm:rounded-br-lg">
              <div className="flex items-end gap-2.5 pr-9">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-background/70"
                >
                  <Logo className="h-9 w-9" />
                </span>
                <p
                  id={messageId}
                  className="min-w-0 rounded-2xl rounded-bl-md bg-secondary px-3 py-2 text-sm leading-snug text-bone"
                >
                  {copy.message}
                </p>
              </div>

              {/* Outline, like the catalog tiles: the solid gold pill stays the float's alone. */}
              <WhatsAppButton
                location={LOCATION}
                message={copy.ctaMessage}
                size="sm"
                variant="secondary"
                className="mt-3 w-full border-gold/30 text-gold-soft hover:border-gold/70 hover:text-bone"
              >
                {copy.cta}
              </WhatsAppButton>

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
        ) : null}
      </AnimatePresence>
    </>
  )
}
