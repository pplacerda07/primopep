'use client'

import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Logo } from '@/components/logo'
import { WhatsAppIcon } from '@/components/ui/icons'
import { track } from '@/lib/analytics'
import { COPY, fill } from '@/lib/content'
import { whatsappLink } from '@/lib/site'
import { cn } from '@/lib/utils'

// Formulário de captação do GHK-Cu: apresentação, 3 perguntas e o WhatsApp do Primo com a
// mensagem pronta. Nada vai para servidor: o fim é só um link wa.me. O Lead do pixel sai no
// clique do botão do WhatsApp (track('whatsapp_click') em lib/analytics.ts).

const copy = COPY.ghkForm
const LOCATION = 'ghk_form'
const PRODUCT = 'ghk-cu'
// Foto vertical (1086x1448): o recorte foca na caixa e nos frascos, que ficam no terço de baixo.
const IMAGE = '/ghk-form.webp'

const QUESTIONS = ['experience', 'goals', 'name'] as const
type Question = (typeof QUESTIONS)[number]
type Step = 'intro' | Question | 'done'

const BUTTON =
  'inline-flex min-h-12 select-none items-center justify-center gap-2 rounded-full px-6 text-[0.9375rem] font-semibold ' +
  'transition-[transform,box-shadow,filter,opacity] duration-200 ease-out [&_svg]:size-[1.125rem] [&_svg]:shrink-0'
const PRIMARY =
  BUTTON +
  ' bg-gold-gradient text-ink shadow-luxe hover:-translate-y-0.5 hover:shadow-luxe-lg hover:brightness-[1.06] ' +
  'active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none'

/** 'a, b e c'. Se algum item já tem ' e ' no meio, une só por vírgula para não ficar ambíguo. */
function joinNice(items: string[]) {
  if (items.length <= 1) return items.join('')
  if (items.some((item) => item.includes(' e '))) return items.join(', ')
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}

function buildMessage(name: string, experience: string | null, goals: string[]) {
  const lines: string[] = [fill(copy.message.opening, { name }), '']
  const experienceMsg = copy.experience.options.find((option) => option.id === experience)?.msg
  if (experienceMsg) lines.push(fill(copy.message.experience, { experience: experienceMsg }))
  const goalMsgs = copy.goals.options.filter((option) => goals.includes(option.id)).map((option) => option.msg)
  if (goalMsgs.length) lines.push(fill(copy.message.goals, { goals: joinNice(goalMsgs) }))
  lines.push('', copy.message.closing)
  return lines.join('\n')
}

export function GhkForm() {
  const [step, setStep] = useState<Step>('intro')
  const [experience, setExperience] = useState<string | null>(null)
  const [goals, setGoals] = useState<string[]>([])
  const [name, setName] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const advanceTimer = useRef<number | undefined>(undefined)

  const cleanName = name.trim().replace(/\s+/g, ' ')
  const questionIndex = QUESTIONS.indexOf(step as Question)
  const inQuestions = questionIndex > -1
  const canContinue =
    step === 'experience' ? experience !== null : step === 'goals' ? goals.length > 0 : cleanName.length >= 2

  // Cada tela começa do topo (no celular a anterior pode ter deixado a página rolada).
  useEffect(() => {
    window.scrollTo(0, 0)
    if (step === 'name') {
      const timer = window.setTimeout(() => nameRef.current?.focus(), 320)
      return () => window.clearTimeout(timer)
    }
  }, [step])

  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  function start() {
    track('primary_cta_click', { location: LOCATION })
    setStep('experience')
  }

  function next() {
    window.clearTimeout(advanceTimer.current)
    if (!canContinue) return
    if (questionIndex < QUESTIONS.length - 1) setStep(QUESTIONS[questionIndex + 1])
    else setStep('done')
  }

  function back() {
    window.clearTimeout(advanceTimer.current)
    setStep(questionIndex > 0 ? QUESTIONS[questionIndex - 1] : 'intro')
  }

  function pickExperience(id: string) {
    setExperience(id)
    // Escolha única: avança sozinho, com um respiro para ver a marcação.
    window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(() => setStep('goals'), 280)
  }

  function toggleGoal(id: string) {
    setGoals((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    next()
  }

  const message = buildMessage(cleanName, experience, goals)

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="relative z-20">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:h-20 sm:px-6">
          <Logo withWordmark />
          {inQuestions ? (
            <span className="text-sm font-medium tabular-nums text-muted-foreground">
              {fill(copy.progress, { current: questionIndex + 1, total: QUESTIONS.length })}
            </span>
          ) : null}
        </div>
        <div
          aria-hidden="true"
          className={cn('h-0.5 bg-border/60 transition-opacity duration-300', inQuestions ? 'opacity-100' : 'opacity-0')}
        >
          <div
            className="h-full bg-gold-gradient transition-[width] duration-500 ease-out"
            style={{ width: `${step === 'done' ? 100 : ((Math.max(questionIndex, 0) + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </header>

      <main
        id="conteudo"
        className={cn(
          'mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-12',
          step !== 'intro' && 'pb-32 sm:pb-12',
        )}
      >
        {/* Cada tela entra com fade só em CSS (@starting-style, como a hero), sem depender de JS.
            Só opacidade: um transform aqui viraria containing block e soltaria as barras fixas
            do rodapé (position: fixed) no celular. */}
        <div
          key={step}
          className="transition-opacity duration-300 ease-out starting:opacity-0 motion-reduce:transition-none"
        >
          {step === 'intro' ? <Intro onStart={start} /> : null}

          {inQuestions ? (
            <form onSubmit={handleSubmit} noValidate className="mx-auto w-full max-w-2xl">
              {step === 'experience' ? (
                <QuestionTitle id="ghk-q-experience">{copy.experience.question}</QuestionTitle>
              ) : null}
              {step === 'goals' ? (
                <QuestionTitle id="ghk-q-goals" hint={copy.goals.hint}>
                  {copy.goals.question}
                </QuestionTitle>
              ) : null}
              {step === 'name' ? <QuestionTitle id="ghk-q-name">{copy.name.question}</QuestionTitle> : null}

              {step === 'experience' ? (
                <div role="radiogroup" aria-labelledby="ghk-q-experience" className="mt-7 grid grid-cols-3 gap-2.5 sm:gap-4">
                  {copy.experience.options.map((option) => (
                    <OptionCard
                      key={option.id}
                      kind="single"
                      selected={experience === option.id}
                      onClick={() => pickExperience(option.id)}
                    >
                      {option.label}
                    </OptionCard>
                  ))}
                </div>
              ) : null}

              {step === 'goals' ? (
                <div role="group" aria-labelledby="ghk-q-goals" className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-4">
                  {copy.goals.options.map((option) => (
                    <OptionCard
                      key={option.id}
                      kind="multi"
                      selected={goals.includes(option.id)}
                      onClick={() => toggleGoal(option.id)}
                    >
                      {option.label}
                    </OptionCard>
                  ))}
                </div>
              ) : null}

              {step === 'name' ? (
                <>
                  <label htmlFor="ghk-name" className="sr-only">
                    {copy.name.label}
                  </label>
                  <input
                    ref={nameRef}
                    id="ghk-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={copy.name.placeholder}
                    autoComplete="given-name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    maxLength={40}
                    className="mt-7 min-h-14 w-full rounded-full border border-border/70 glass px-6 text-lg text-bone shadow-luxe transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-gold/70 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-gold/25"
                  />
                </>
              ) : null}

              {/* Celular: barra fixa no rodapé. A partir de sm: logo abaixo das opções. */}
              <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={back}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full px-2 text-[0.9375rem] font-medium text-muted-foreground transition-colors hover:text-bone"
                  >
                    <ArrowLeft className="size-4" />
                    {copy.back}
                  </button>
                  <button type="submit" disabled={!canContinue} className={cn(PRIMARY, 'flex-1 sm:flex-none sm:px-8')}>
                    {step === 'name' ? copy.finish : copy.next}
                    <ArrowRight />
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          {step === 'done' ? (
            <Done
              name={cleanName}
              message={message}
              onEdit={() => setStep('experience')}
            />
          ) : null}
        </div>
      </main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Telas                                                                       */
/* -------------------------------------------------------------------------- */

function Intro({ onStart }: { onStart: () => void }) {
  const intro = copy.intro

  return (
    <div className="grid items-center gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
      <div className="overflow-hidden rounded-[1.75rem] border border-border/70 shadow-luxe-lg lg:order-last lg:rounded-[2rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGE}
          alt={intro.imageAlt}
          width={1086}
          height={1448}
          decoding="async"
          fetchPriority="high"
          className="aspect-[16/10] w-full object-cover object-[50%_80%] lg:aspect-[4/3]"
        />
      </div>

      <div>
        <h1 className="text-balance font-serif text-[2.5rem] font-semibold leading-[1.04] tracking-tight sm:text-6xl">
          <span className="block">{intro.title}</span>
          <span className="block text-gradient-gold">{intro.highlight}</span>
        </h1>
        <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
          {intro.lead}
        </p>
        <button type="button" onClick={onStart} className={cn(PRIMARY, 'mt-7 w-full min-h-14 text-base sm:w-auto sm:px-10')}>
          {intro.start}
          <ArrowRight />
        </button>
        <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-silver">
          {intro.facts.map((fact) => (
            <li key={fact} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Done({ name, message, onEdit }: { name: string; message: string; onEdit: () => void }) {
  const done = copy.done

  return (
    <div className="mx-auto w-full max-w-2xl">
      <span className="grid size-12 place-items-center rounded-full bg-gold-gradient text-ink shadow-luxe">
        <Check className="size-6" strokeWidth={2.75} />
      </span>
      <h1 className="mt-5 text-balance font-serif text-[2rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl">
        <span className="block">{fill(done.title, { name })}</span>
        <span className="block text-gradient-gold">{done.highlight}</span>
      </h1>
      <p className="mt-3 max-w-lg text-pretty text-muted-foreground sm:text-lg">{done.lead}</p>

      <div className="mt-7 overflow-hidden rounded-3xl border border-border/70 glass shadow-luxe">
        <p className="flex items-center gap-2 border-b border-border/70 px-5 py-3 text-sm font-medium text-muted-foreground">
          <WhatsAppIcon className="size-4 text-gold" />
          {done.bubbleLabel}
        </p>
        <div className="p-4 sm:p-5">
          <p className="whitespace-pre-wrap break-words rounded-2xl rounded-tl-md bg-[#144d37] px-4 py-3.5 text-[0.9375rem] leading-relaxed text-bone">
            {message}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="mt-4 rounded-md px-1 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-gold hover:underline"
      >
        {done.edit}
      </button>

      {/* Celular: o botão do WhatsApp fica sempre na tela. A partir de sm: no fluxo. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('whatsapp_click', { location: LOCATION, product: PRODUCT })}
          className={cn(PRIMARY, 'min-h-14 w-full text-base sm:w-auto sm:px-10 [&_svg]:size-5')}
        >
          <WhatsAppIcon />
          {done.cta}
          <span className="sr-only"> {COPY.common.opensInNewTab}</span>
        </a>
        <p className="mt-2 text-center text-xs text-muted-foreground sm:mt-3 sm:text-left">{done.note}</p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Peças                                                                       */
/* -------------------------------------------------------------------------- */

function QuestionTitle({ id, hint, children }: { id: string; hint?: string; children: ReactNode }) {
  return (
    <>
      <h1 id={id} className="text-balance font-serif text-[2rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl">
        {children}
      </h1>
      {hint ? <p className="mt-2 text-muted-foreground sm:text-lg">{hint}</p> : null}
    </>
  )
}

function OptionCard({
  kind,
  selected,
  onClick,
  children,
}: {
  kind: 'single' | 'multi'
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role={kind === 'single' ? 'radio' : 'checkbox'}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'relative flex min-h-[4.5rem] items-end rounded-2xl border px-4 pb-3.5 pt-9 text-left text-[0.9375rem] font-semibold leading-snug shadow-luxe',
        'transition-[border-color,background-color,transform] duration-200 ease-out active:scale-[0.98] sm:min-h-24 sm:px-5 sm:pb-4 sm:text-base',
        selected
          ? 'border-gold/70 bg-gold/12 text-bone'
          : 'glass border-border/70 text-bone/90 hover:-translate-y-0.5 hover:border-gold/40',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute right-3.5 top-3.5 grid size-5 place-items-center border transition-colors duration-200',
          kind === 'single' ? 'rounded-full' : 'rounded-md',
          selected ? 'border-transparent bg-gold-gradient text-ink' : 'border-border bg-background/40',
        )}
      >
        {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
      {children}
    </button>
  )
}
