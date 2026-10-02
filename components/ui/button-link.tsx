'use client'

import Link from 'next/link'
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { track, type AnalyticsEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'
type TrackProps = Record<string, string | number | boolean | null | undefined>

export type ButtonLinkProps = {
  href: string
  variant?: Variant
  size?: Size
  /** Opens in a new tab (target=_blank, rel=noopener noreferrer). */
  external?: boolean
  trackEvent?: AnalyticsEvent
  trackProps?: TrackProps
  className?: string
  children: ReactNode
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'>

const BASE =
  'group/button relative inline-flex select-none items-center justify-center gap-2 text-center font-semibold leading-tight ' +
  'transition-[transform,box-shadow,background-color,border-color,color,filter] duration-200 ease-out ' +
  'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-gold-soft ' +
  '[&_svg]:shrink-0'

// Icons without their own size class get a size that matches the button.
const SIZES: Record<Size, string> = {
  sm: 'min-h-10 px-4 text-sm [&_svg:not([class*="size-"]):not([class*="h-"])]:size-4',
  md: 'min-h-12 px-6 text-[0.9375rem] [&_svg:not([class*="size-"]):not([class*="h-"])]:size-[1.125rem]',
  lg: 'min-h-14 px-8 text-base [&_svg:not([class*="size-"]):not([class*="h-"])]:size-5',
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'rounded-full bg-gold-gradient text-ink shadow-luxe hover:-translate-y-0.5 hover:shadow-luxe-lg hover:brightness-[1.06] ' +
    'active:translate-y-0 active:scale-[0.98] active:brightness-95',
  secondary:
    'rounded-full glass border border-border/70 text-bone shadow-luxe hover:-translate-y-0.5 hover:border-gold/50 ' +
    'active:translate-y-0 active:scale-[0.98]',
  ghost:
    'rounded-md px-1 text-muted-foreground underline-offset-4 hover:text-gold hover:underline active:opacity-80',
}

function isInternalHref(href: string) {
  return (href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#')
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  external,
  trackEvent,
  trackProps,
  className,
  children,
  onClick,
  target,
  rel,
  ...rest
}: ButtonLinkProps) {
  const classes = cn(BASE, SIZES[size], VARIANTS[variant], className)

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (trackEvent) track(trackEvent, trackProps)
    onClick?.(event)
  }

  if (external) {
    return (
      <a
        {...rest}
        href={href}
        target={target ?? '_blank'}
        rel={rel ?? 'noopener noreferrer'}
        onClick={handleClick}
        className={classes}
      >
        {children}
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
    )
  }

  if (isInternalHref(href)) {
    return (
      <Link {...rest} href={href} target={target} rel={rel} onClick={handleClick} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <a {...rest} href={href} target={target} rel={rel} onClick={handleClick} className={classes}>
      {children}
    </a>
  )
}
