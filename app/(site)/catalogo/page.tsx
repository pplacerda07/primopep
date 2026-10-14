import type { Metadata, ResolvingMetadata } from 'next'
import { Catalog } from '@/components/catalog'
import { FinalCta } from '@/components/final-cta'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { WhatsAppFloat } from '@/components/whatsapp-float'
import { COPY } from '@/lib/content'
import { SITE } from '@/lib/site'

const PATH = '/catalogo'

// The page sets its own openGraph, which replaces the root one (shallow merge),
// so the inherited image (app/opengraph-image.tsx) is carried over explicitly.
export async function generateMetadata(_props: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  const { title, description } = COPY.meta.catalog
  const fullTitle = `${title} · ${SITE.name}`
  const previous = await parent

  return {
    title,
    description,
    alternates: { canonical: PATH },
    openGraph: {
      type: 'website',
      locale: SITE.locale,
      siteName: SITE.name,
      title: fullTitle,
      description,
      url: PATH,
      images: previous.openGraph?.images ?? [],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
  }
}

export default function CatalogPage() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="pt-20 sm:pt-24">
        <Catalog variant="page" />
        <FinalCta />
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  )
}
