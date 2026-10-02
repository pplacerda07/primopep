'use client'

import { useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { COPY } from '@/lib/content'
import { cn } from '@/lib/utils'

const { items, ariaLabel, pauseLabel } = COPY.conditions

const TITLE_ID = 'condicoes-comerciais'
// Short list, normal case: one copy scrolls at ~25px/s, calm enough to read.
const MARQUEE_DURATION = '36s'

const TEXT = 'whitespace-nowrap text-sm text-silver'
const DOT = 'size-1 shrink-0 rounded-full bg-gold'

/** One copy of the list. Every item carries its own trailing dot so two copies loop seamlessly. */
function MarqueeList({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <ul aria-hidden={duplicate || undefined} className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item} className="flex shrink-0 items-center">
          <span className={TEXT}>{item}</span>
          <span aria-hidden="true" className={cn(DOT, 'mx-5 sm:mx-6')} />
        </li>
      ))}
    </ul>
  )
}

export function ConditionsStrip() {
  const [paused, setPaused] = useState(false)

  return (
    <section aria-labelledby={TITLE_ID} className="border-y border-border/60 bg-card/30">
      <h2 id={TITLE_ID} className="sr-only">
        {ariaLabel}
      </h2>

      {/* Single scrolling line (hidden when the visitor prefers reduced motion). */}
      <div className="flex items-center motion-reduce:hidden">
        <div className="min-w-0 flex-1 overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
          <div
            className="flex w-max animate-marquee"
            style={{ animationDuration: MARQUEE_DURATION, animationPlayState: paused ? 'paused' : undefined }}
          >
            <MarqueeList />
            <MarqueeList duplicate />
          </div>
        </div>

        {/* WCAG 2.2.2: moving content needs a way to pause it (hover alone does not cover keyboard/touch). */}
        <button
          type="button"
          aria-pressed={paused}
          aria-label={pauseLabel}
          onClick={() => setPaused((value) => !value)}
          className="mr-1.5 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground/70 transition-colors hover:text-gold sm:mr-4"
        >
          {paused ? (
            <Play aria-hidden="true" className="size-3" />
          ) : (
            <Pause aria-hidden="true" className="size-3" />
          )}
        </button>
      </div>

      {/* Static version for prefers-reduced-motion: the same line, wrapped. */}
      <ul className="mx-auto hidden max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1.5 px-4 py-3 motion-reduce:flex sm:px-6">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span aria-hidden="true" className={DOT} />
            <span className={TEXT}>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
