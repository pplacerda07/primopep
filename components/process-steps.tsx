import { Container } from '@/components/ui/container'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { COPY } from '@/lib/content'
import { SECTION_IDS } from '@/lib/site'

const TITLE_ID = 'como-funciona-titulo'

function stepNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}

/** Como funciona: 4 etapas em grade 2 × 2 no celular, 4 colunas a partir de md. */
export function ProcessSteps() {
  const how = COPY.how

  return (
    <section id={SECTION_IDS.how} aria-labelledby={TITLE_ID} className="relative py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading id={TITLE_ID} title={how.title} highlight={how.highlight} />
        </Reveal>

        <ol role="list" className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 md:grid-cols-4">
          {how.steps.map((step, index) => (
            <Reveal
              as="li"
              key={step.id}
              delay={index * 0.06}
              className="flex flex-col rounded-xl border border-border/70 bg-card/45 p-4 sm:rounded-2xl sm:p-5 lg:p-6"
            >
              <span aria-hidden="true" className="font-serif text-sm font-semibold tabular-nums text-gold-soft">
                {stepNumber(index)}
              </span>
              <h3 className="mt-3 font-serif text-base font-semibold leading-snug text-foreground sm:text-lg">
                {step.title}
              </h3>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{step.description}</p>
            </Reveal>
          ))}
        </ol>

        {/* sm and up only: on phones the floating WhatsApp bar is already on screen here. */}
        <Reveal className="mt-8 hidden sm:mt-10 sm:block">
          <WhatsAppButton location="how" message={how.ctaMessage} className="w-full sm:w-auto">
            {how.cta}
          </WhatsAppButton>
        </Reveal>
      </Container>
    </section>
  )
}
