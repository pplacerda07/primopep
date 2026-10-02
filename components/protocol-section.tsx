import { Activity, Droplet, Ruler, ShieldCheck, type LucideIcon } from 'lucide-react'
import { NervousSystemFigure } from '@/components/nervous-system-figure'
import { Container } from '@/components/ui/container'
import { Reveal } from '@/components/ui/reveal'
import { COPY } from '@/lib/content'
import { SECTION_IDS } from '@/lib/site'

const TITLE_ID = 'protocolo-titulo'

type ProtocolItemId = (typeof COPY.protocol.items)[number]['id']

// Ícone por tópico do PDF (ids de COPY.protocol.items).
const ITEM_ICONS: Record<ProtocolItemId, LucideIcon> = {
  'como-funciona': Activity,
  preparo: Droplet,
  dosagem: Ruler,
  cuidados: ShieldCheck,
}

function renderTitle(title: string, highlight: string) {
  const index = title.indexOf(highlight)
  if (!highlight || index === -1) return title

  return (
    <>
      {title.slice(0, index)}
      <span className="text-gradient-gold">{highlight}</span>
      {title.slice(index + highlight.length)}
    </>
  )
}

// Painel compacto: o protocolo de uso em PDF que acompanha cada peptídeo comprado.
export function ProtocolSection() {
  const protocol = COPY.protocol

  return (
    <section id={SECTION_IDS.protocol} aria-labelledby={TITLE_ID} className="relative py-12 sm:py-20">
      <Container>
        <Reveal>
          {/* Celular: texto | figura em 2 colunas; itens e aviso embaixo. Desktop: figura à direita de tudo. */}
          <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-x-4 rounded-3xl border border-border/70 glass p-5 shadow-luxe sm:grid-cols-[minmax(0,1fr)_8rem] sm:gap-x-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-x-12 lg:p-10">
            <div className="col-start-1 row-start-1 self-center">
              <h2
                id={TITLE_ID}
                className="text-balance font-serif text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl"
              >
                {renderTitle(protocol.title, protocol.highlight)}
              </h2>

              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
                {protocol.description}
              </p>
            </div>

            <div className="col-start-2 row-start-1 self-center lg:row-span-3">
              <NervousSystemFigure className="mx-auto max-h-56 sm:max-h-64 lg:max-h-80" label={protocol.figureLabel} />
            </div>

            <ul
              role="list"
              className="col-span-2 row-start-2 mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-3 lg:col-span-1 lg:grid-cols-4"
            >
              {protocol.items.map((item) => {
                const Icon = ITEM_ICONS[item.id]

                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2.5 rounded-2xl bg-background/45 p-3 sm:p-4"
                  >
                    <Icon aria-hidden="true" className="size-4 text-gold-soft sm:size-5" strokeWidth={1.8} />
                    <span className="text-sm font-medium leading-snug text-foreground sm:text-[0.9375rem]">
                      {item.title}
                    </span>
                  </li>
                )
              })}
            </ul>

            <p className="col-span-2 row-start-3 mt-4 text-xs leading-relaxed text-muted-foreground sm:mt-5 lg:col-span-1">
              {protocol.note}
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
