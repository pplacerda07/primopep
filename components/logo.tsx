import { SITE } from '@/lib/site'
import { cn } from '@/lib/utils'

const LOGO_SIZE = 44

/**
 * Brand mark (replaceable asset at SITE.logoSrc, never redrawn in CSS).
 * - Without wordmark: `className` sizes the image itself (default 44x44).
 * - With wordmark: `className` goes on the wrapper; the image keeps 40/44px.
 */
export function Logo({
  className,
  withWordmark = false,
}: {
  className?: string
  withWordmark?: boolean
}) {
  if (!withWordmark) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={SITE.logoSrc}
        alt={SITE.name}
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        decoding="async"
        draggable={false}
        className={cn('h-11 w-11 shrink-0 select-none object-contain', className)}
      />
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SITE.logoSrc}
        alt=""
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        decoding="async"
        draggable={false}
        className="size-10 shrink-0 select-none object-contain sm:size-11"
      />
      <span className="flex flex-col leading-none">
        {/* Caixa normal, sem espaçamento largo: nada de micro-rótulo em maiúsculas. */}
        <span className="font-serif text-xl font-semibold tracking-tight text-bone sm:text-[1.375rem]">Primo</span>
        <span className="mt-0.5 text-xs font-medium text-silver">Peptídeos</span>
      </span>
    </span>
  )
}
