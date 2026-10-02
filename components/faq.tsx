'use client'

import { useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { Plus } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { track } from '@/lib/analytics'
import { COPY } from '@/lib/content'
import { SECTION_IDS } from '@/lib/site'
import { cn } from '@/lib/utils'

const TITLE_ID = 'duvidas-titulo'
const EASE = [0.22, 1, 0.36, 1] as const

const panelVariants: Variants = {
  open: { height: 'auto', opacity: 1 },
  closed: { height: 0, opacity: 0 },
}

// Dados estruturados (FAQPage) gerados a partir do mesmo COPY exibido na tela.
const FAQ_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: COPY.faq.items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
}).replace(/</g, '\\u003c')

export function Faq() {
  const faq = COPY.faq
  const reduceMotion = useReducedMotion()
  const [openId, setOpenId] = useState<string | null>(faq.items[0]?.id ?? null)

  function toggle(id: string, index: number) {
    const willOpen = openId !== id
    setOpenId(willOpen ? id : null)
    if (willOpen) track('faq_open', { index: index + 1, question: id })
  }

  return (
    <section id={SECTION_IDS.faq} aria-labelledby={TITLE_ID} className="relative py-16 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }} />

      <Container>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <SectionHeading id={TITLE_ID} title={faq.title} highlight={faq.highlight} align="center" />
          </Reveal>

          <Reveal className="mt-8 sm:mt-12">
            <div className="divide-y divide-border/70 border-y border-border/70">
              {faq.items.map((item, index) => {
                const isOpen = openId === item.id
                const triggerId = `duvida-${item.id}-pergunta`
                const panelId = `duvida-${item.id}-resposta`

                return (
                  <div key={item.id}>
                    <h3>
                      <button
                        type="button"
                        id={triggerId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => toggle(item.id, index)}
                        className="group flex min-h-14 w-full items-center justify-between gap-4 rounded-md py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft sm:py-5"
                      >
                        <span
                          className={cn(
                            'font-serif text-base font-medium leading-snug transition-colors duration-300 sm:text-lg',
                            isOpen ? 'text-foreground' : 'text-foreground/90 group-hover:text-foreground',
                          )}
                        >
                          {item.question}
                        </span>
                        <Plus
                          aria-hidden="true"
                          strokeWidth={1.8}
                          className={cn(
                            'size-5 shrink-0 transition-[transform,color] duration-300',
                            isOpen ? 'rotate-45 text-gold' : 'text-silver group-hover:text-gold-soft',
                          )}
                        />
                      </button>
                    </h3>

                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      inert={!isOpen}
                      initial={false}
                      animate={isOpen ? 'open' : 'closed'}
                      variants={panelVariants}
                      transition={{ duration: reduceMotion ? 0 : 0.32, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 pr-9 text-sm leading-relaxed text-muted-foreground sm:pb-6 sm:text-[0.9375rem]">
                        {item.answer}
                      </p>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
