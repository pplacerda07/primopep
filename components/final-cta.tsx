import { Logo } from '@/components/logo'
import { Container } from '@/components/ui/container'
import { Reveal } from '@/components/ui/reveal'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { COPY } from '@/lib/content'
import { SECTION_IDS } from '@/lib/site'

const TITLE_ID = 'fale-com-o-primo-titulo'

// Painel final: pergunta, resposta em dourado e um botão de WhatsApp.
export function FinalCta() {
  const cta = COPY.finalCta

  return (
    <section id={SECTION_IDS.contact} aria-labelledby={TITLE_ID} className="relative py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-gold/25 glass px-5 py-10 text-center shadow-luxe-lg sm:px-10 sm:py-14 lg:py-16">
            <span
              aria-hidden="true"
              className="mx-auto flex size-16 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-background/70"
            >
              <Logo className="size-14" />
            </span>

            <h2
              id={TITLE_ID}
              className="mt-6 text-balance font-serif text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              <span className="block">{cta.question}</span>{' '}
              <span className="mt-1 block text-gradient-gold">{cta.answer}</span>
            </h2>

            <WhatsAppButton
              location="final_cta"
              message={cta.ctaMessage}
              size="lg"
              className="mt-8 w-full sm:mt-10 sm:w-auto"
            >
              {cta.cta}
            </WhatsAppButton>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
