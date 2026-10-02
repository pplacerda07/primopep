'use client'

import { useEffect } from 'react'
import { captureUtm } from '@/lib/analytics'

// Guarda os parâmetros de origem (UTM, gclid, fbclid) da primeira página visitada.
export function AnalyticsBootstrap(): null {
  useEffect(() => {
    captureUtm()
  }, [])

  return null
}
