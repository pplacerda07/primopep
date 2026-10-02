'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
} from 'react'
import { Logo } from '@/components/logo'
import { ButtonLink } from '@/components/ui/button-link'
import { WhatsAppIcon } from '@/components/ui/icons'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { COPY } from '@/lib/content'
import { NAV_LINKS, SECTION_IDS, whatsappLink } from '@/lib/site'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const
const SCROLL_THRESHOLD = 24
const MENU_ID = 'menu-principal'
const DESKTOP_QUERY = '(min-width: 1024px)'
const HOME_HREF = `/#${SECTION_IDS.hero}`
const CATALOG_ROUTE = '/catalogo'

type NavItem = { label: string; href: string; sectionId: string | null }

// Label and href always come from the same NAV_LINKS entry; the section id is read from the hash.
const NAV_ITEMS: NavItem[] = NAV_LINKS.map((link) => {
  const hash = link.href.indexOf('#')
  return { ...link, sectionId: hash === -1 ? null : link.href.slice(hash + 1) }
})

const NAV_SECTION_IDS = NAV_ITEMS.flatMap((item) => (item.sectionId ? [item.sectionId] : []))

/* -------------------------------------------------------------------------- */
/* Hooks                                                                       */
/* -------------------------------------------------------------------------- */

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

/** True once the page is scrolled past `threshold` px. Server render is always false. */
function useScrolledPast(threshold: number) {
  return useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > threshold,
    () => false,
  )
}

/** Id of the nav section crossing a thin band near the top third of the viewport. */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return

    const targets = NAV_SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (element): element is HTMLElement => element !== null,
    )
    if (targets.length === 0) return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        setActive(NAV_SECTION_IDS.find((id) => visible.has(id)) ?? null)
      },
      { rootMargin: '-38% 0px -58% 0px' },
    )

    targets.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [enabled])

  return enabled ? active : null
}

/** Locks page scroll while `locked`, compensating the scrollbar width to avoid a layout jump. */
function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const { documentElement: html, body } = document
    const scrollbarWidth = window.innerWidth - html.clientWidth
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    }

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      html.style.overflow = previous.htmlOverflow
      body.style.overflow = previous.bodyOverflow
      body.style.paddingRight = previous.bodyPaddingRight
    }
  }, [locked])
}

/* -------------------------------------------------------------------------- */
/* Header                                                                      */
/* -------------------------------------------------------------------------- */

export function SiteHeader() {
  const pathname = usePathname()
  const scrolled = useScrolledPast(SCROLL_THRESHOLD)
  const [open, setOpen] = useState(false)
  const [menuPathname, setMenuPathname] = useState(pathname)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Route changed: close the menu (state adjusted during render, no effect needed).
  if (menuPathname !== pathname) {
    setMenuPathname(pathname)
    setOpen(false)
  }

  const observedSection = useActiveSection(pathname === '/')
  const activeSection = pathname.startsWith(CATALOG_ROUTE) ? SECTION_IDS.catalog : observedSection
  const elevated = scrolled || open

  const closeMenu = useCallback((restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) toggleRef.current?.focus({ preventScroll: true })
  }, [])

  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return

    // The panel is already in the DOM when this runs: move focus into it.
    panelRef.current?.querySelector<HTMLElement>('a[href], button')?.focus({ preventScroll: true })

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeMenu(true)
    }

    // The menu only exists below lg: growing the window past it closes the menu.
    const desktop = window.matchMedia(DESKTOP_QUERY)
    function onViewportChange(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    desktop.addEventListener('change', onViewportChange)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onViewportChange)
    }
  }, [open, closeMenu])

  // Tabbing out of the header (into the page) closes the menu without stealing focus back.
  function handleBlur(event: FocusEvent<HTMLElement>) {
    const next = event.relatedTarget
    if (open && next instanceof Node && !event.currentTarget.contains(next)) closeMenu(false)
  }

  return (
    <header onBlur={handleBlur} className="fixed inset-x-0 top-0 z-50">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="menu-backdrop"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={() => closeMenu(true)}
            className="fixed inset-0 -z-10 bg-ink/70 backdrop-blur-sm lg:hidden"
          />
        ) : null}
      </AnimatePresence>

      <div className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-6 sm:pt-4 lg:px-8">
        <div
          className={cn(
            'flex h-16 items-center gap-2 rounded-full border pl-2 pr-2 sm:pl-3',
            'transition-[background-color,border-color,box-shadow] duration-300 ease-out',
            elevated ? 'glass border-border/70 shadow-luxe' : 'border-transparent',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center">
            <Link
              href={HOME_HREF}
              aria-label={COPY.header.homeLabel}
              onClick={() => setOpen(false)}
              className="inline-flex shrink-0 items-center rounded-full py-1 pr-2"
            >
              <Logo withWordmark />
            </Link>
          </div>

          <nav aria-label={COPY.header.navLabel} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = item.sectionId !== null && item.sectionId === activeSection
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'location' : undefined}
                      className={cn(
                        'relative isolate inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200',
                        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="site-header-active"
                          aria-hidden="true"
                          transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                          className="absolute inset-0 -z-10 rounded-full bg-card/80"
                        />
                      ) : null}
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2">
            <WhatsAppButton
              message={COPY.header.ctaMessage}
              location="header"
              size="sm"
              className="hidden sm:inline-flex"
            >
              {COPY.header.cta}
            </WhatsAppButton>

            <ButtonLink
              href={whatsappLink(COPY.header.ctaMessage)}
              external
              size="sm"
              variant="secondary"
              trackEvent="whatsapp_click"
              trackProps={{ location: 'header' }}
              aria-label={COPY.whatsappFloat.ariaLabel}
              className="size-11 min-h-0 px-0 sm:hidden"
            >
              <WhatsAppIcon className="size-5" />
            </ButtonLink>

            <button
              ref={toggleRef}
              type="button"
              aria-expanded={open}
              aria-controls={open ? MENU_ID : undefined}
              aria-label={open ? COPY.header.menuClose : COPY.header.menuOpen}
              onClick={() => setOpen((value) => !value)}
              className={cn(
                'grid size-11 shrink-0 place-items-center rounded-full border text-foreground transition duration-200',
                'hover:border-gold/50 hover:text-gold-soft active:scale-95 lg:hidden',
                open ? 'border-gold/40 bg-card' : 'border-border/70 bg-card/70',
              )}
            >
              <Menu
                aria-hidden="true"
                className={cn(
                  'col-start-1 row-start-1 size-5 transition duration-200',
                  open ? 'rotate-90 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100',
                )}
              />
              <X
                aria-hidden="true"
                className={cn(
                  'col-start-1 row-start-1 size-5 transition duration-200',
                  open ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-75 opacity-0',
                )}
              />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              ref={panelRef}
              key="menu-panel"
              id={MENU_ID}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="glass mt-2 max-h-[calc(100dvh-6.5rem)] origin-top overflow-y-auto overscroll-contain rounded-3xl border border-border/70 shadow-luxe-lg lg:hidden"
            >
              <nav aria-label={COPY.header.navLabel} className="p-2">
                <ul className="flex flex-col">
                  {NAV_ITEMS.map((item, index) => {
                    const active = item.sectionId !== null && item.sectionId === activeSection
                    return (
                      <motion.li
                        key={item.href}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 + index * 0.04, ease: EASE }}
                      >
                        <Link
                          href={item.href}
                          aria-current={active ? 'location' : undefined}
                          onClick={() => closeMenu(false)}
                          className={cn(
                            'flex min-h-12 items-center rounded-2xl px-4 text-base font-medium transition-colors',
                            'hover:bg-card active:bg-card',
                            active ? 'bg-card/80 text-gold-soft' : 'text-bone',
                          )}
                        >
                          {item.label}
                        </Link>
                      </motion.li>
                    )
                  })}
                </ul>
              </nav>

              <div className="border-t border-border/60 p-3">
                <WhatsAppButton
                  message={COPY.header.ctaMessage}
                  location="header-menu"
                  className="w-full"
                >
                  {COPY.header.cta}
                </WhatsAppButton>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  )
}
