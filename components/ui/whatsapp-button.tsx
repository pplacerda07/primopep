'use client'

import type { ReactNode } from 'react'
import { ButtonLink } from '@/components/ui/button-link'
import { WhatsAppIcon } from '@/components/ui/icons'
import { whatsappLink } from '@/lib/site'

export function WhatsAppButton({
  message,
  location,
  product,
  variant = 'primary',
  size = 'md',
  className,
  children,
  showIcon = true,
}: {
  /** Pre-filled WhatsApp message. Defaults to WHATSAPP_DEFAULT_MESSAGE. */
  message?: string
  /** Analytics location, e.g. 'hero', 'header', 'product-card'. */
  location: string
  product?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
  showIcon?: boolean
}) {
  return (
    <ButtonLink
      href={whatsappLink(message)}
      external
      variant={variant}
      size={size}
      trackEvent="whatsapp_click"
      trackProps={{ location, product }}
      className={className}
    >
      {showIcon ? <WhatsAppIcon /> : null}
      <span>{children}</span>
    </ButtonLink>
  )
}
