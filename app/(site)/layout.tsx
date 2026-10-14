import type { ReactNode } from 'react'
import { MetaPixel } from '@/components/meta-pixel'
import { META_PIXEL_ID } from '@/lib/site'

// Páginas do site (/ e /catalogo). O pixel fica aqui, e não no layout raiz, para que o
// formulário do GHK-Cu (/ghk-cu) carregue só o pixel dele.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {process.env.NODE_ENV === 'production' && META_PIXEL_ID ? <MetaPixel id={META_PIXEL_ID} /> : null}
    </>
  )
}
