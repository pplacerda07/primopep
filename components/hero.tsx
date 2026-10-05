import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button-link'
import { Container } from '@/components/ui/container'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { WorldRouteMap } from '@/components/world-route-map'
import { COPY } from '@/lib/content'
import { SECTION_IDS } from '@/lib/site'
import { cn } from '@/lib/utils'

const hero = COPY.hero

/*
 * Entrance: CSS-only (@starting-style via Tailwind `starting:`). It paints with the
 * first frame, needs no JavaScript and never hides the h1 waiting for hydration.
 * Browsers without @starting-style simply show everything at once.
 * Under prefers-reduced-motion there is no transition at all.
 */
const ENTER =
  'transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'starting:translate-y-3 starting:opacity-0 motion-reduce:transition-none'

const ENTER_MAP =
  'transition-[opacity,scale] duration-1000 delay-300 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'starting:scale-[0.97] starting:opacity-0 motion-reduce:transition-none'

/*
 * Both CTAs share one row on phones (2 equal columns, ~160px each at 375px).
 * Tighter padding/gap and text-sm keep "Falar com o Primo" + icon on one line down to 360px.
 */
const CTA = 'w-full gap-1.5 px-2 text-sm sm:w-auto sm:min-h-14 sm:gap-2 sm:px-8 sm:text-base'

/** Renders the title with the highlight in gold. A highlight that ends the title gets its own line. */
function renderTitle(title: string, highlight?: string) {
  const index = highlight ? title.indexOf(highlight) : -1
  if (!highlight || index === -1) return title

  const before = title.slice(0, index)
  const after = title.slice(index + highlight.length)
  const endsTitle = /^[\s.!?…]*$/.test(after)

  return (
    <>
      {before}
      <span className={cn(endsTitle && 'block')}>
        <span className="text-gradient-gold">{highlight}</span>
        {after}
      </span>
    </>
  )
}

export function Hero() {
  const titleId = `${SECTION_IDS.hero}-titulo`

  return (
    <section
      id={SECTION_IDS.hero}
      aria-labelledby={titleId}
      className="relative isolate overflow-x-clip pb-16 pt-24 sm:pb-20 sm:pt-32 lg:flex lg:min-h-[min(calc(100svh_-_3.5rem),52rem)] lg:flex-col lg:justify-center lg:pb-16"
    >
      <Container>
        {/* Celular: texto → mapa → botões (pedido do cliente). Desktop: texto e botões à esquerda, mapa à direita. */}
        <div className="grid items-center gap-y-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto] lg:gap-x-10 xl:gap-x-14">
          {/* Copy */}
          <div className="flex max-w-2xl flex-col items-start lg:col-start-1 lg:row-start-1 lg:self-end">
            <h1
              id={titleId}
              className={cn(
                'text-balance font-serif text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[3.5rem] lg:text-5xl xl:text-[3.75rem]',
                ENTER,
                'delay-75',
              )}
            >
              {renderTitle(hero.title, hero.highlight)}
            </h1>

            <p
              className={cn(
                'mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg',
                ENTER,
                'delay-150',
              )}
            >
              {hero.subtitle}
            </p>
          </div>

          {/* Dotted world map: the ampoule box (clear case + vials) travels Hong Kong -> Brasil. Full-bleed on phones. */}
          <div
            className={cn(
              'relative -mx-4 overflow-x-clip sm:-mx-6',
              'lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:-mr-8 lg:overflow-visible',
              'xl:-mr-[min(10rem,calc((100vw_-_80rem)/2_+_2rem))]',
            )}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[6%] -inset-y-[12%] -z-10 bg-[radial-gradient(closest-side,rgba(199,150,56,0.1),transparent)]"
            />

            {/* On phones the map is drawn 25% wider (edges cropped) so the route reads larger. */}
            <div className={cn('-ml-[12%] w-[125%] sm:ml-0 sm:w-full', ENTER_MAP)}>
              <WorldRouteMap
                originLabel={hero.map.originLabel}
                originCaption={hero.map.originCaption}
                destinationLabel={hero.map.destinationLabel}
                destinationCaption={hero.map.destinationCaption}
                ariaLabel={hero.map.ariaLabel}
              />
            </div>
          </div>

          {/* CTAs: abaixo do mapa no celular; abaixo do texto, na coluna da esquerda, no desktop. */}
          <div
            className={cn(
              'grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto lg:col-start-1 lg:row-start-2 lg:self-start',
              ENTER,
              'delay-200',
            )}
          >
            <ButtonLink
              href={`/#${SECTION_IDS.catalog}`}
              trackEvent="primary_cta_click"
              trackProps={{ cta: 'ver_catalogo', location: 'hero' }}
              className={CTA}
            >
              {hero.primaryCta}
              <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover/button:translate-x-0.5" />
            </ButtonLink>
            <WhatsAppButton message={hero.secondaryCtaMessage} location="hero" variant="secondary" className={CTA}>
              {hero.secondaryCta}
            </WhatsAppButton>
          </div>
        </div>
      </Container>
    </section>
  )
}
