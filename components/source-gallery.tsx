'use client'

// "Conheça a fonte": fotos e vídeos reais da estrutura do fornecedor parceiro.
// Grade de 8 destaques (2 colunas no celular, 4 no desktop) + galeria completa em tela cheia.
// Vídeos da grade tocam mudos, em loop, só com pelo menos metade na tela.
// Com "reduzir movimento" ou economia de dados ativa, fica só o pôster.

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Images, Play } from 'lucide-react'
import { MediaLightbox } from '@/components/media-lightbox'
import { Container } from '@/components/ui/container'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { COPY } from '@/lib/content'
import { EVIDENCE, type Evidence } from '@/lib/evidence'
import { FEATURED_SOURCE_MEDIA, SOURCE_MEDIA, type SourceMedia } from '@/lib/media'
import { SECTION_IDS } from '@/lib/site'
import { cn } from '@/lib/utils'

const TITLE_ID = 'fonte-titulo'
const VISIBLE_RATIO = 0.49

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? date : dateFormatter.format(parsed)
}

function prefersSavingData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}

export function SourceGallery() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const copy = COPY.source

  if (FEATURED_SOURCE_MEDIA.length === 0) return null

  function openItem(item: SourceMedia) {
    const index = SOURCE_MEDIA.findIndex((media) => media.id === item.id)
    setOpenIndex(index === -1 ? 0 : index)
  }

  return (
    <section id={SECTION_IDS.source} aria-labelledby={TITLE_ID} className="relative py-16 sm:py-24">
      <Container>
        {/* Título em cima; grade em largura total (2 colunas no celular, 4 no desktop). */}
        <div className="flex flex-col gap-8 sm:gap-10">
          <Reveal>
            <SectionHeading
              id={TITLE_ID}
              title={copy.title}
              highlight={copy.highlight}
              description={copy.description}
            />
          </Reveal>

          <div>
            <Reveal delay={0.05}>
              <ul role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {FEATURED_SOURCE_MEDIA.map((item) => (
                  <li key={item.id}>
                    <MediaTile item={item} playback={openIndex === null} onOpen={() => openItem(item)} />
                  </li>
                ))}
              </ul>
            </Reveal>

            {EVIDENCE.length > 0 ? <EvidenceRow items={EVIDENCE} /> : null}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setOpenIndex(0)}
              className={cn(
                'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-6',
                'glass border border-border/70 text-[0.9375rem] font-semibold text-bone shadow-luxe',
                'transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-gold/50',
                'active:translate-y-0 active:scale-[0.98]',
              )}
            >
              <Images aria-hidden="true" className="size-[1.125rem] text-gold-soft" />
              {copy.viewAll} ({SOURCE_MEDIA.length})
            </button>
          </div>
        </div>
      </Container>

      <MediaLightbox
        items={SOURCE_MEDIA}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </section>
  )
}

function MediaTile({
  item,
  playback,
  onOpen,
}: {
  item: SourceMedia
  /** false enquanto a galeria em tela cheia está aberta (pausa os vídeos da grade). */
  playback: boolean
  onOpen: () => void
}) {
  const isVideo = item.type === 'video'
  const label = isVideo ? `${COPY.source.videoBadgeLabel}: ${item.alt}` : item.alt

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={cn(
        'group relative block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-2xl',
        'border border-border/60 bg-card transition-colors duration-300 hover:border-gold/40',
      )}
    >
      {isVideo ? (
        <TileVideo item={item} playback={playback} />
      ) : (
        <TileImage src={item.src} width={item.width} height={item.height} />
      )}

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/75 via-black/25 to-transparent"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 p-3 text-left text-sm font-medium leading-tight text-bone sm:p-4"
      >
        {item.caption}
      </span>

      {isVideo ? (
        <span
          aria-hidden="true"
          className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-black/45 text-bone backdrop-blur-sm sm:right-3 sm:top-3"
        >
          <Play className="size-3 translate-x-px fill-current" />
        </span>
      ) : null}
    </button>
  )
}

function TileImage({ src, width, height }: { src: string; width: number; height: number }) {
  return (
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      draggable={false}
      className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
    />
  )
}

// Pôster em <img> (carrega preguiçoso e sempre cobre o card) + vídeo por cima,
// que só aparece depois que começa a tocar.
function TileVideo({ item, playback }: { item: SourceMedia; playback: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduceMotion = useReducedMotion()
  const [inView, setInView] = useState(false)
  const [started, setStarted] = useState(false)
  const enabled = playback && !reduceMotion

  useEffect(() => {
    const video = videoRef.current
    if (!video || !enabled || prefersSavingData()) return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO),
      { threshold: [0, 0.5] },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [enabled])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (enabled && inView) {
      video.muted = true
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [enabled, inView])

  return (
    <>
      {item.poster ? <TileImage src={item.poster} width={item.width} height={item.height} /> : null}
      <video
        ref={videoRef}
        src={item.src}
        muted
        loop
        playsInline
        preload="none"
        tabIndex={-1}
        aria-hidden="true"
        onPlaying={() => setStarted(true)}
        className={cn(
          'absolute inset-0 size-full object-cover transition-[opacity,transform] duration-700 ease-out',
          'group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100',
          started ? 'opacity-100' : 'opacity-0',
        )}
      />
    </>
  )
}

function EvidenceRow({ items }: { items: Evidence[] }) {
  const odd = items.length % 2 === 1

  return (
    <ul role="list" className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-4 sm:gap-4">
      {items.map((item, index) => (
        <li
          key={item.id}
          className={cn(
            'flex flex-col gap-1 rounded-xl border border-border/60 bg-card/60 p-3',
            odd && index === items.length - 1 && 'col-span-2 sm:col-span-1',
          )}
        >
          <p className="text-sm font-medium leading-snug text-foreground">{item.title}</p>
          {item.date ? (
            <time dateTime={item.date} className="text-xs tabular-nums text-muted-foreground">
              {formatDate(item.date)}
            </time>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
