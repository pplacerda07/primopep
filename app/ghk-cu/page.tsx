import type { Metadata, ResolvingMetadata } from 'next'
import { GhkForm } from '@/components/ghk-form'
import { MetaPixel } from '@/components/meta-pixel'
import { COPY } from '@/lib/content'
import { GHK_FORM_PIXEL_ID, SITE } from '@/lib/site'

const PATH = '/ghk-cu'

// Página de captação das campanhas de lead: só o formulário, sem header nem rodapé do site.
export async function generateMetadata(_props: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  const { title, description } = COPY.meta.ghkForm
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

export default function GhkFormPage() {
  return (
    <>
      <GhkForm />
      {process.env.NODE_ENV === 'production' && GHK_FORM_PIXEL_ID ? <MetaPixel id={GHK_FORM_PIXEL_ID} /> : null}
    </>
  )
}
