'use client'

import { ArrowLeft, ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { motion } from 'motion/react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { ProductSheet } from '@/components/product-sheet'
import { ButtonLink } from '@/components/ui/button-link'
import { Container } from '@/components/ui/container'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { track } from '@/lib/analytics'
import {
  FAMILIES,
  STATUS_LABEL,
  getProductsByFamily,
  searchProducts,
  startingPriceUSD,
  type FamilyId,
  type Product,
} from '@/lib/catalog'
import { COPY, fill } from '@/lib/content'
import { formatUSD } from '@/lib/format'
import { SECTION_IDS } from '@/lib/site'
import { cn } from '@/lib/utils'

type Variant = 'section' | 'page'
type FamilyFilter = FamilyId | 'all'
type OpenHandler = (product: Product, trigger: HTMLElement) => void

// Home: first products (even number for the 2-column grid); the rest opens inline.
const COLLAPSED_COUNT = 6
const QUERY_MAX = 80
const EASE = [0.22, 1, 0.36, 1] as const
const HEADING_ID = 'catalogo-titulo'
const LIST_ID = 'catalogo-lista'

const LABELS = COPY.featured.labels

const subscribeNoop = () => () => {}

// false on the server and during hydration, true afterwards. Tiles that mount after
// hydration (expand, filter, search) fade in; server-rendered tiles don't animate.
function useHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function countLabel(count: number) {
  const labels = COPY.catalog.resultsCount
  if (count === 0) return labels.zero
  if (count === 1) return labels.one
  return fill(labels.other, { count })
}

// 'Ver todos os mais buscados ({count})'. Falls back to appending the count if the
// copy ever loses the {count} placeholder.
function expandLabel(count: number) {
  const label: string = COPY.catalog.expand
  return label.includes('{count}') ? fill(label, { count }) : `${label} (${count})`
}

function isFamilyId(value: string): value is FamilyId {
  return FAMILIES.some((family) => family.id === value)
}

export function Catalog({ variant = 'section' }: { variant?: Variant }) {
  const copy = COPY.catalog
  const isPage = variant === 'page'
  const location = isPage ? 'catalog_page' : 'home'
  const productHeading = isPage ? 'h2' : 'h3'

  const hydrated = useHydrated()
  const searchId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const lastTrackedQuery = useRef('')

  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<FamilyFilter>('all')
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)

  const trimmed = query.trim()
  const searchResults = useMemo(() => searchProducts(trimmed), [trimmed])

  const familyCounts = useMemo(() => {
    const counts = Object.fromEntries(FAMILIES.map((item) => [item.id, 0])) as Record<FamilyId, number>
    for (const product of searchResults) counts[product.family] += 1
    return counts
  }, [searchResults])

  // Always in family order (FAMILIES), even if PRODUCTS is edited out of order.
  const filtered = useMemo(() => {
    const matches =
      family === 'all' ? searchResults : searchResults.filter((product) => product.family === family)
    return getProductsByFamily(matches).flatMap((group) => group.products)
  }, [searchResults, family])

  const collapsible = !isPage && filtered.length > COLLAPSED_COUNT
  const collapsed = collapsible && !expanded
  // Home, no search/filter: the collapsed preview skips the featured products, which are
  // already the cards right above ('Comece por aqui'). Expanded, the list is complete.
  const preview = !isPage && !trimmed && family === 'all' ? filtered.filter((p) => !p.featured) : filtered
  const visible = collapsed ? preview.slice(0, COLLAPSED_COUNT) : filtered
  // Prices are optional (null = sob consulta): the USD/BRL note only makes sense next to one.
  const showPriceNote = visible.some((p) => startingPriceUSD(p) !== null)

  // Screen readers hear the result count once typing settles, not on every key.
  const announcedCount = useDebouncedValue(filtered.length, 450)

  // Search analytics: only settled queries, never the same one twice in a row.
  const settledQuery = useDebouncedValue(trimmed, 900)
  useEffect(() => {
    if (settledQuery.length < 2 || settledQuery === lastTrackedQuery.current) return
    lastTrackedQuery.current = settledQuery
    track('catalog_search', {
      query: settledQuery,
      results: searchProducts(settledQuery).length,
      location,
    })
  }, [settledQuery, location])

  // /catalogo?q=bpc&familia=incretinas opens with the search/filter applied.
  useEffect(() => {
    if (!isPage) return
    try {
      const params = new URLSearchParams(window.location.search)
      const initialQuery = params.get('q')
      const initialFamily = params.get('familia')
      if (initialQuery) setQuery(initialQuery.slice(0, QUERY_MAX))
      if (initialFamily && isFamilyId(initialFamily)) setFamily(initialFamily)
    } catch {
      // URL inválida: segue sem filtro.
    }
  }, [isPage])

  function handleQueryChange(value: string) {
    setQuery(value)
    if (value.trim()) setExpanded(true)
  }

  function clearQuery() {
    setQuery('')
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && query) {
      event.preventDefault()
      setQuery('')
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    inputRef.current?.blur() // fecha o teclado no celular
    const list = listRef.current
    if (list && list.getBoundingClientRect().top > window.innerHeight * 0.6) {
      list.scrollIntoView({ block: 'start' })
    }
  }

  function selectFamily(next: FamilyFilter) {
    const value: FamilyFilter = next !== 'all' && next === family ? 'all' : next
    if (value === family) return
    setFamily(value)
    if (value !== 'all') setExpanded(true)
    track('catalog_filter', { family: value, location })
  }

  function toggleExpanded() {
    if (collapsed) {
      setExpanded(true)
      track('catalog_open', { location: 'home', target: 'inline', count: filtered.length })
      return
    }
    setExpanded(false)
    requestAnimationFrame(() => {
      const list = listRef.current
      if (list && list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: 'start' })
    })
  }

  const openProduct: OpenHandler = (product, trigger) => {
    triggerRef.current = trigger
    setSelected(product)
    track('product_click', { product: product.slug, family: product.family, location: 'catalog' })
  }

  function closeProduct() {
    setSelected(null)
    // Safety net: if the sheet didn't hand focus back, return it to the tile.
    const restore = () => {
      const trigger = triggerRef.current
      const active = document.activeElement
      if (trigger?.isConnected && (!active || active === document.body)) {
        trigger.focus({ preventScroll: true })
      }
    }
    requestAnimationFrame(restore)
    window.setTimeout(restore, 450)
  }

  const emptyMessage = trimmed
    ? fill(copy.emptyState.whatsappMessage, { query: trimmed.slice(0, QUERY_MAX) })
    : copy.emptyState.whatsappMessageNoQuery

  return (
    <section
      id={SECTION_IDS.catalog}
      aria-labelledby={HEADING_ID}
      className={cn('relative', isPage ? 'pb-16 pt-6 sm:pb-24 sm:pt-10' : 'py-16 sm:py-24')}
    >
      <Container>
        {isPage ? (
          <>
            <ButtonLink href="/" variant="ghost" size="sm" className="-ml-1 mb-5 sm:mb-8">
              <ArrowLeft aria-hidden="true" />
              {copy.backHome}
            </ButtonLink>
            <SectionHeading
              as="h1"
              id={HEADING_ID}
              title={copy.pageTitle}
              highlight={copy.pageHighlight}
              description={copy.fraction}
            />
          </>
        ) : (
          <Reveal>
            <SectionHeading
              id={HEADING_ID}
              title={copy.title}
              highlight={copy.highlight}
              description={copy.fraction}
            />
          </Reveal>
        )}

        {/* Busca + famílias */}
        <div className="mt-8 sm:mt-10">
          <form role="search" onSubmit={handleSubmit} noValidate className="sm:max-w-md">
            <label htmlFor={searchId} className="sr-only">
              {copy.searchLabel}
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                ref={inputRef}
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={copy.searchPlaceholder}
                maxLength={QUERY_MAX}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="search"
                aria-controls={LIST_ID}
                className={cn(
                  'h-12 w-full appearance-none rounded-full border border-border/80 bg-background/60 pl-11',
                  query ? 'pr-12' : 'pr-4',
                  'text-base text-foreground placeholder:text-muted-foreground/80',
                  'transition-colors duration-200 hover:border-silver/40 focus:border-gold/60',
                  '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
                )}
              />
              {query ? (
                <button
                  type="button"
                  onClick={clearQuery}
                  aria-label={copy.clearSearch}
                  className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              ) : null}
            </div>
          </form>

          <p role="status" className="sr-only">
            {countLabel(announcedCount)}
          </p>

          {/* Scrolls sideways on mobile; wraps from sm up. `relative` keeps the chips'
              sr-only counts inside the scroller (otherwise they widen the page). */}
          <div
            role="group"
            aria-label={copy.filterLabel}
            className={cn(
              'relative -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 py-1',
              '[mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              'sm:mx-0 sm:mt-4 sm:flex-wrap sm:overflow-visible sm:px-0 sm:[mask-image:none]',
            )}
          >
            <FilterChip
              label={copy.allFamilies}
              count={searchResults.length}
              active={family === 'all'}
              onClick={() => selectFamily('all')}
            />
            {FAMILIES.map((item) => (
              <FilterChip
                key={item.id}
                label={item.label}
                count={familyCounts[item.id]}
                active={family === item.id}
                onClick={() => selectFamily(item.id)}
              />
            ))}
            <span aria-hidden="true" className="w-2 shrink-0 sm:hidden" />
          </div>
        </div>

        {/* Produtos */}
        <div id={LIST_ID} ref={listRef} className="mt-5 sm:mt-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
              <p className="text-balance text-base font-semibold text-foreground">{copy.emptyState.title}</p>
              <WhatsAppButton
                location="catalog_empty"
                message={emptyMessage}
                product={trimmed ? trimmed.slice(0, QUERY_MAX) : undefined}
                size="sm"
              >
                {copy.emptyState.cta}
              </WhatsAppButton>
            </div>
          ) : (
            <ul
              role="list"
              aria-labelledby={HEADING_ID}
              className="grid grid-cols-2 gap-x-5 border-t border-border/50 sm:gap-x-8 lg:grid-cols-3"
            >
              {visible.map((product) => (
                <ProductRow
                  key={product.slug}
                  product={product}
                  headingLevel={productHeading}
                  animate={hydrated}
                  onOpen={openProduct}
                />
              ))}
            </ul>
          )}
        </div>

        {/* 'Mais buscados' is only part of the supplier's range: the full catalog is
            requested on WhatsApp. Home: expand toggle + full-catalog CTA side by side
            (2 columns on phones). Without the toggle the CTA is full width on phones. */}
        {filtered.length > 0 ? (
          <div
            className={cn(
              'mt-6 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap sm:justify-center',
              collapsible ? 'grid-cols-2' : 'grid-cols-1',
            )}
          >
            {collapsible ? (
              <button
                type="button"
                onClick={toggleExpanded}
                aria-expanded={!collapsed}
                aria-controls={LIST_ID}
                className={cn(
                  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-2 py-2 text-center text-sm font-semibold leading-tight text-balance',
                  'sm:px-6 sm:text-[0.9375rem]',
                  'glass border border-border/70 text-bone shadow-luxe hover:border-gold/50',
                  'transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
                )}
              >
                {collapsed ? expandLabel(filtered.length) : copy.collapse}
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'hidden size-[1.125rem] shrink-0 transition-transform duration-300 sm:block',
                    !collapsed && 'rotate-180',
                  )}
                />
              </button>
            ) : null}

            <WhatsAppButton
              location="catalog_full"
              message={copy.fullCatalogMessage}
              className="gap-1 px-2 py-2 text-sm text-balance max-sm:[&>svg]:hidden sm:gap-2 sm:px-6 sm:text-[0.9375rem]"
            >
              {copy.fullCatalogCta}
            </WhatsAppButton>
          </div>
        ) : null}

        {showPriceNote ? (
          <p className="mt-5 text-balance text-center text-xs leading-relaxed text-muted-foreground">
            {copy.priceNote}
          </p>
        ) : null}
      </Container>

      <ProductSheet product={selected} onClose={closeProduct} />
    </section>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'relative inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium',
        'transition-[background-color,border-color,color,opacity] duration-200',
        active
          ? 'border-gold/60 bg-gold/15 text-bone'
          : 'border-border/80 text-muted-foreground hover:border-gold/40 hover:text-foreground',
        !active && count === 0 && 'opacity-50',
      )}
    >
      {label}
      <span className="sr-only"> ({count})</span>
    </button>
  )
}

/** Linha da lista: nome + descrição de 7 palavras. A linha inteira abre a ficha do produto. */
function ProductRow({
  product,
  headingLevel: Heading,
  animate,
  onOpen,
}: {
  product: Product
  headingLevel: 'h2' | 'h3'
  animate: boolean
  onOpen: OpenHandler
}) {
  const copy = COPY.catalog
  const hasPrice = startingPriceUSD(product) !== null

  return (
    <motion.li
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="group relative border-b border-border/50"
    >
      <button
        type="button"
        onClick={(event) => onOpen(product, event.currentTarget)}
        aria-haspopup="dialog"
        aria-label={fill(copy.detailsAria, { product: product.name })}
        className="absolute inset-0 z-[1] cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft"
      />

      <div className="flex items-start gap-2 py-3.5 sm:gap-3 sm:py-4">
        <div className="min-w-0 flex-1">
          <Heading className="break-words text-sm font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-gold-soft sm:text-[0.9375rem]">
            {product.name}
          </Heading>
          <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{product.summary}</p>
          {product.status !== 'sob-consulta' ? (
            <p className="mt-1 text-xs leading-snug text-muted-foreground">{STATUS_LABEL[product.status]}</p>
          ) : null}
          {hasPrice ? (
            <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground">
              <PriceText product={product} />
            </p>
          ) : null}
        </div>
        <ChevronRight
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-muted-foreground/60 transition duration-200 group-hover:translate-x-0.5 group-hover:text-gold-soft"
        />
      </div>
    </motion.li>
  )
}

function PriceText({ product }: { product: Product }) {
  const price = startingPriceUSD(product)
  if (price === null) return <>{LABELS.priceOnRequest}</>

  const pricedCount = product.presentations.filter((item) => item.priceUSD !== null).length

  return (
    <>
      {pricedCount > 1 ? (
        <span className="text-xs font-normal text-muted-foreground">{LABELS.fromPrice} </span>
      ) : null}
      <span className="tabular-nums">{formatUSD(price)}</span>
    </>
  )
}
