import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ContainerTag = 'div' | 'section' | 'header' | 'footer' | 'nav'

export function Container({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string
  children: ReactNode
  as?: ContainerTag
}) {
  return <Tag className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</Tag>
}
