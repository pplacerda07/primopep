import Link from 'next/link'
import { ArrowUp, Mail } from 'lucide-react'
import type { ReactNode } from 'react'
import { Logo } from '@/components/logo'
import { Container } from '@/components/ui/container'
import { InstagramIcon, WhatsAppIcon } from '@/components/ui/icons'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { COPY, fill } from '@/lib/content'
import { CONTACT, NAV_LINKS, SECTION_IDS } from '@/lib/site'

const CATALOG_ROUTE = '/catalogo'
const CATALOG_HREF = `/#${SECTION_IDS.catalog}`

// Same links as the header, but the products link opens the /catalogo page ('Mais buscados').
const FOOTER_LINKS = NAV_LINKS.map((link) =>
  link.href === CATALOG_HREF ? { label: COPY.catalog.pageTitle, href: CATALOG_ROUTE } : link,
)

const COLUMN_TITLE = 'text-sm font-semibold text-bone'
const LINK = 'inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors hover:text-gold-soft'

function ContactLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className="shrink-0 text-gold-soft">
        {icon}
      </span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </span>
  )
}

export function SiteFooter() {
  const { footer } = COPY
  // Server component: the year is fixed at render time, so there is no hydration mismatch.
  const year = new Date().getFullYear()

  return (
    <footer data-site-footer="" className="border-t border-border/60 bg-card/30">
      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-16">
          <div className="col-span-2 lg:col-span-1">
            <Link
              href={`/#${SECTION_IDS.hero}`}
              aria-label={COPY.header.homeLabel}
              className="inline-flex rounded-full py-1 pr-2"
            >
              <Logo withWordmark />
            </Link>
            <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              {footer.institutional}
            </p>
          </div>

          <nav aria-labelledby="rodape-navegacao">
            <h2 id="rodape-navegacao" className={COLUMN_TITLE}>
              {footer.navTitle}
            </h2>
            <ul className="mt-2 flex flex-col">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 id="rodape-contato" className={COLUMN_TITLE}>
              {footer.contactTitle}
            </h2>
            <ul aria-labelledby="rodape-contato" className="mt-2 flex flex-col">
              <li>
                <WhatsAppButton
                  location="footer"
                  message={COPY.whatsappFloat.message}
                  variant="ghost"
                  size="sm"
                  showIcon={false}
                  className={`${LINK} justify-start px-0 font-normal hover:no-underline`}
                >
                  <ContactLabel icon={<WhatsAppIcon className="size-4" />}>{footer.whatsappLabel}</ContactLabel>
                </WhatsAppButton>
              </li>

              {CONTACT.instagram ? (
                <li>
                  <a href={CONTACT.instagram.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                    <ContactLabel icon={<InstagramIcon className="size-4" />}>{CONTACT.instagram.handle}</ContactLabel>
                    <span className="sr-only"> {COPY.common.opensInNewTab}</span>
                  </a>
                </li>
              ) : null}

              {CONTACT.email ? (
                <li>
                  <a href={`mailto:${CONTACT.email}`} className={LINK}>
                    <ContactLabel icon={<Mail className="size-4" />}>{CONTACT.email}</ContactLabel>
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-4 border-t border-border/60 pt-6">
          <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
            <p>{footer.notes.join(' ')}</p>
            <p>{fill(footer.rights, { year })}</p>
          </div>
          {/* '#top' scrolls to the top of the document (HTML spec), on any route. */}
          <a
            href="#top"
            aria-label={footer.backToTop}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-gold/50 hover:text-gold-soft"
          >
            <ArrowUp aria-hidden="true" className="size-4" />
          </a>
        </div>
      </Container>
    </footer>
  )
}
