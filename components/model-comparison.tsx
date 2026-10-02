import { Circle, Globe, Ship, Store, UserRound, Warehouse, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Container } from '@/components/ui/container'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { COPY } from '@/lib/content'
import { SECTION_IDS } from '@/lib/site'
import { cn } from '@/lib/utils'

const TITLE_ID = 'modelo-titulo'
const TRADITIONAL_ID = 'modelo-tradicional'
const PRIMO_ID = 'modelo-primo'

type Tone = 'muted' | 'gold'

// Ícone por etapa da cadeia (textos de COPY.model.*.steps). Etapa sem ícone usa um círculo.
const NODE_ICONS: Partial<Record<string, LucideIcon>> = {
  Fornecedor: Globe,
  Importador: Ship,
  Distribuidor: Warehouse,
  Revendedor: Store,
  Você: UserRound,
}

/**
 * Cadeia tradicional x com o Primo, lado a lado em 2 colunas (também no celular).
 * As duas colunas têm a mesma altura: as pontas (Fornecedor/Você) ficam alinhadas.
 */
export function ModelComparison() {
  const model = COPY.model

  return (
    <section id={SECTION_IDS.model} aria-labelledby={TITLE_ID} className="relative isolate py-16 sm:py-24">
      {/* Faixa tonal sutil para separar do ritmo das seções vizinhas. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-transparent via-card/30 to-transparent"
      />

      <Container>
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-16">
          <Reveal>
            <SectionHeading
              id={TITLE_ID}
              title={model.title}
              highlight={model.highlight}
              description={model.description}
            />
          </Reveal>

          <Reveal delay={0.08}>
            {/* Subgrid: títulos e cadeias das duas colunas dividem as mesmas linhas. */}
            <div className="grid grid-cols-2 grid-rows-[auto_1fr] gap-x-3 sm:gap-x-4">
              <div className="row-span-2 grid grid-rows-subgrid gap-y-4 rounded-xl border border-border/60 bg-card/30 p-4 sm:gap-y-5 sm:rounded-2xl sm:p-6">
                <PanelTitle id={TRADITIONAL_ID} tone="muted">
                  {model.traditional.label}
                </PanelTitle>
                <Chain labelledBy={TRADITIONAL_ID} steps={model.traditional.steps} tone="muted" />
              </div>

              <div className="row-span-2 grid grid-rows-subgrid gap-y-4 rounded-xl border border-gold/35 bg-card/60 p-4 shadow-luxe sm:gap-y-5 sm:rounded-2xl sm:p-6">
                <PanelTitle id={PRIMO_ID} tone="gold">
                  {model.primo.label}
                </PanelTitle>
                <Chain
                  labelledBy={PRIMO_ID}
                  steps={model.primo.steps}
                  tone="gold"
                  bridgeStep={model.primo.bridgeStep}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

function PanelTitle({ id, tone, children }: { id: string; tone: Tone; children: string }) {
  return (
    <h3
      id={id}
      className={cn(
        'text-balance font-serif text-sm font-semibold leading-snug sm:text-lg',
        tone === 'gold' ? 'text-gradient-gold' : 'text-muted-foreground',
      )}
    >
      {children}
    </h3>
  )
}

/**
 * Cadeia vertical. A tradicional usa espaçamento fixo; a do Primo estica as ligações
 * para ocupar a mesma altura da coluna vizinha.
 */
function Chain({
  labelledBy,
  steps,
  tone,
  bridgeStep,
}: {
  labelledBy: string
  steps: readonly string[]
  tone: Tone
  bridgeStep?: string
}) {
  const stretch = tone === 'gold'

  return (
    <ol role="list" aria-labelledby={labelledBy} className="flex flex-col">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1

        return (
          <li key={step} className={cn('flex flex-col', stretch && !isLast && 'flex-1')}>
            <ChainNode name={step} tone={tone} isBridge={step === bridgeStep} />
            {!isLast ? (
              // Cifrão = taxa/margem: em toda passagem da cadeia tradicional; no Primo, só na dele.
              <Connector tone={tone} stretch={stretch} fee={tone === 'muted' || step === bridgeStep} />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function ChainNode({ name, tone, isBridge }: { name: string; tone: Tone; isBridge: boolean }) {
  const Icon = NODE_ICONS[name] ?? Circle

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {isBridge ? (
        // A ponte: o Primo em destaque dourado (logo decorativo; o nome vem ao lado).
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-gradient shadow-[0_0_0_4px_rgba(199,150,56,0.16)] sm:size-10"
        >
          <Logo className="size-[90%] translate-y-[6%]" />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full border bg-background sm:size-10',
            tone === 'gold' ? 'border-gold/45 text-gold-soft' : 'border-border text-silver/60',
          )}
        >
          <Icon className="size-3.5 sm:size-4" strokeWidth={1.6} />
        </span>
      )}

      <span
        className={cn(
          'min-w-0 font-semibold leading-tight',
          isBridge
            ? 'font-serif text-sm text-gold-soft sm:text-base'
            : cn('text-xs sm:text-sm', tone === 'gold' ? 'text-foreground' : 'text-muted-foreground'),
        )}
      >
        {name}
      </span>
    </div>
  )
}

/** Linha vertical centrada sob o círculo (largura do círculo), com cifrão opcional no meio. */
function Connector({ tone, stretch, fee }: { tone: Tone; stretch: boolean; fee: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex w-8 justify-center py-1 sm:w-10',
        stretch ? 'min-h-10 flex-1' : fee ? 'h-10 sm:h-12' : 'h-6 sm:h-7',
      )}
    >
      <span
        className={cn(
          'block',
          tone === 'gold' ? 'w-px bg-linear-to-b from-gold/80 to-gold/35' : 'w-0 border-l border-dashed border-silver/35',
        )}
      />
      {fee ? (
        <span className="absolute left-1/2 top-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/50 bg-background text-[0.6875rem] font-bold leading-none text-gold-soft sm:size-6 sm:text-xs">
          $
        </span>
      ) : null}
    </span>
  )
}
