'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { WhatsAppIcon } from '@/components/ui/icons'
import { WhatsAppPopup } from '@/components/whatsapp-popup'
import { track } from '@/lib/analytics'
import { COPY } from '@/lib/content'
import { SECTION_IDS, whatsappLink } from '@/lib/site'

const EASE = [0.22, 1, 0.36, 1] as const
const LOCATION = 'float'

/** Appears once this share of the hero has scrolled out of view. */
const HERO_PROGRESS = 0.7
/** Pages without a hero: appears after this share of the viewport has been scrolled. */
const FALLBACK_PROGRESS = 0.5
/** While any of these is on screen the float steps aside (they carry their own WhatsApp CTA). */
const END_TARGETS = [`#${SECTION_IDS.contact}`, '[data-site-footer]']
/** Focus in one of these (on-screen keyboard open): the mobile bar gets out of the way. */
const TEXT_ENTRY =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]):not([type="color"]):not([type="file"]),' +
  ' textarea, select, [contenteditable=""], [contenteditable="true"]'

/* -------------------------------------------------------------------------- */
/* Hooks                                                                       */
/* -------------------------------------------------------------------------- */

function isOnScreen(element: Element | null, viewportHeight: number) {
  if (!element) return false
  const { top, bottom } = element.getBoundingClientRect()
  return top < viewportHeight && bottom > 0
}

/**
 * Visible once ~70% of the hero has scrolled away, and hidden while the final CTA or the footer
 * is on screen. Both conditions are measured in the same frame, so it never flashes in when the
 * page jumps (or opens) straight to the bottom. endInView is returned too: the pop-up uses it.
 */
function useFloatVisible(pathname: string) {
  const [state, setState] = useState({ visible: false, endInView: false })

  useEffect(() => {
    let frame = 0

    function measure() {
      frame = 0
      const viewportHeight = window.innerHeight
      const hero = document.getElementById(SECTION_IDS.hero)
      let pastHero: boolean
      if (hero) {
        const { top, height } = hero.getBoundingClientRect()
        pastHero = top + height * HERO_PROGRESS <= 0
      } else {
        pastHero = window.scrollY > viewportHeight * FALLBACK_PROGRESS
      }
      const endInView = END_TARGETS.some((selector) =>
        isOnScreen(document.querySelector(selector), viewportHeight),
      )
      const nextVisible = pastHero && !endInView
      setState((previous) =>
        previous.visible === nextVisible && previous.endInView === endInView
          ? previous
          : { visible: nextVisible, endInView },
      )
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // Content growing or shrinking without a scroll (e.g. the catalog expanding) moves the footer.
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    resizeObserver?.observe(document.body)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      resizeObserver?.disconnect()
    }
  }, [pathname])

  return state
}

function useEditingText() {
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const isTextEntry = (target: EventTarget | null) =>
      target instanceof Element && target.matches(TEXT_ENTRY)

    function onFocusIn(event: FocusEvent) {
      setEditing(isTextEntry(event.target))
    }
    function onFocusOut(event: FocusEvent) {
      setEditing(isTextEntry(event.relatedTarget))
    }

    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return editing
}

/* -------------------------------------------------------------------------- */
/* Float                                                                       */
/* -------------------------------------------------------------------------- */

export function WhatsAppFloat() {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const { visible, endInView } = useFloatVisible(pathname)
  const editing = useEditingText()
  const href = whatsappLink(COPY.whatsappFloat.message)

  function handleClick() {
    track('whatsapp_click', { location: LOCATION })
  }

  return (
    <>
      {/* Mobile: one compact gold pill, centered at the bottom, clear of the safe area. */}
      <AnimatePresence>
        {visible && !editing ? (
          <motion.div
            key="whatsapp-float-mobile"
            initial={{ opacity: 0, y: '140%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '140%' }}
            transition={{ duration: 0.4, ease: EASE }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden"
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={COPY.whatsappFloat.ariaLabel}
              onClick={handleClick}
              className="pointer-events-auto inline-flex min-h-12 items-center gap-2 rounded-full bg-gold-gradient px-5 text-[0.9375rem] font-semibold text-ink shadow-luxe-lg transition-transform duration-200 active:scale-[0.97]"
            >
              <WhatsAppIcon className="size-5" />
              {COPY.whatsappFloat.label}
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* sm and up: round gold button bottom-right, label on hover/focus. */}
      <AnimatePresence>
        {visible ? (
          <motion.div
            key="whatsapp-float-desktop"
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 12 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed bottom-6 right-6 z-40 hidden sm:block lg:bottom-8 lg:right-8"
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={COPY.whatsappFloat.ariaLabel}
              onClick={handleClick}
              className="group relative grid size-14 place-items-center rounded-full bg-gold-gradient text-ink shadow-luxe-lg transition duration-200 hover:-translate-y-0.5 hover:brightness-[1.06] active:translate-y-0 active:scale-95"
            >
              {reduceMotion ? null : (
                // A few calm rings when it first appears, then it stays still (no endless loop).
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full border border-gold-soft/70"
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: [0.7, 0], scale: [1, 1.6] }}
                  transition={{ duration: 1.8, ease: 'easeOut', delay: 0.6, repeat: 2, repeatDelay: 1.4 }}
                />
              )}
              <WhatsAppIcon className="size-6" />
              <span
                aria-hidden="true"
                className="glass pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-full border border-border/70 px-4 py-2 text-sm font-semibold text-bone opacity-0 shadow-luxe transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
              >
                {COPY.whatsappFloat.label}
              </span>
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Chat-bubble nudge every WHATSAPP_POPUP.intervalSeconds, placed just above the float.
          Like the float, it steps aside while the final CTA or the footer is on screen. */}
      <WhatsAppPopup floatVisible={visible} editing={editing} suppressed={endInView} />
    </>
  )
}
