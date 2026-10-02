import { Catalog } from '@/components/catalog'
import { ConditionsStrip } from '@/components/conditions-strip'
import { Faq } from '@/components/faq'
import { FeaturedProducts } from '@/components/featured-products'
import { FinalCta } from '@/components/final-cta'
import { Hero } from '@/components/hero'
import { ModelComparison } from '@/components/model-comparison'
import { ProcessSteps } from '@/components/process-steps'
import { ProtocolSection } from '@/components/protocol-section'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SourceGallery } from '@/components/source-gallery'
import { WhatsAppFloat } from '@/components/whatsapp-float'

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo">
        <Hero />
        <ConditionsStrip />
        <ProcessSteps />
        <ModelComparison />
        <SourceGallery />
        <FeaturedProducts />
        <ProtocolSection />
        <Catalog variant="section" />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  )
}
