'use client'

import { useCallback, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { ProductSheet } from '@/components/product-sheet'
import { ButtonLink } from '@/components/ui/button-link'
import { Container } from '@/components/ui/container'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { getFeaturedProducts, type Product } from '@/lib/catalog'
import { COPY } from '@/lib/content'
import { SECTION_IDS } from '@/lib/site'

// Destaques = produtos com featured: true em lib/catalog.ts (hoje 4).
// A grade tem 2 colunas no celular: com número ímpar, o último fica de fora.
const ALL_FEATURED = getFeaturedProducts()
const FEATURED =
  ALL_FEATURED.length > 1 ? ALL_FEATURED.slice(0, ALL_FEATURED.length - (ALL_FEATURED.length % 2)) : ALL_FEATURED
const TITLE_ID = `${SECTION_IDS.featured}-titulo`

export function FeaturedProducts() {
  const [selected, setSelected] = useState<Product | null>(null)
  const closeSheet = useCallback(() => setSelected(null), [])
  const copy = COPY.featured

  if (FEATURED.length === 0) return null

  return (
    <section id={SECTION_IDS.featured} aria-labelledby={TITLE_ID} className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading id={TITLE_ID} title={copy.title} highlight={copy.highlight} />
        </Reveal>

        <ul role="list" className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {FEATURED.map((product, index) => (
            <Reveal key={product.slug} as="li" delay={index * 0.05} className="h-full">
              <ProductCard product={product} onOpen={setSelected} />
            </Reveal>
          ))}
        </ul>

        <div className="mt-8 flex justify-center sm:mt-10">
          <ButtonLink
            href={`/#${SECTION_IDS.catalog}`}
            variant="secondary"
            trackEvent="catalog_open"
            trackProps={{ location: 'featured' }}
          >
            <span>{copy.labels.seeCatalog}</span>
            <ArrowRight
              aria-hidden="true"
              className="transition-transform duration-300 motion-safe:group-hover/button:translate-x-0.5"
            />
          </ButtonLink>
        </div>
      </Container>

      <ProductSheet product={selected} onClose={closeSheet} />
    </section>
  )
}
