'use client'

import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

const EASE = [0.22, 1, 0.36, 1] as const

const variants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const TAGS = {
  div: motion.div,
  li: motion.li,
  section: motion.section,
  span: motion.span,
}

/**
 * Fades content up on first view. Under prefers-reduced-motion the global
 * <MotionConfig reducedMotion="user"> drops the translate and keeps a short fade.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'li' | 'section' | 'span'
}) {
  const MotionTag = TAGS[as]

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -64px 0px' }}
      variants={variants}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  )
}
