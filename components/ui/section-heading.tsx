import { cn } from '@/lib/utils'

function renderTitle(title: string, highlight?: string) {
  if (!highlight) return title
  const index = title.indexOf(highlight)
  if (index === -1) return title

  return (
    <>
      {title.slice(0, index)}
      <span className="text-gradient-gold">{highlight}</span>
      {title.slice(index + highlight.length)}
    </>
  )
}

export function SectionHeading({
  title,
  highlight,
  description,
  align = 'left',
  as: Heading = 'h2',
  id,
  className,
}: {
  title: string
  /** Substring of `title` rendered with the gold gradient. Ignored if not found. */
  highlight?: string
  description?: string
  align?: 'left' | 'center'
  as?: 'h1' | 'h2'
  /** Id for the heading element (use with aria-labelledby on the section). */
  id?: string
  className?: string
}) {
  const centered = align === 'center'

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:gap-5',
        centered ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      <Heading
        id={id}
        className={cn(
          'max-w-4xl text-balance font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl',
          centered && 'mx-auto',
        )}
      >
        {renderTitle(title, highlight)}
      </Heading>

      {description ? (
        <p
          className={cn(
            'max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg',
            centered && 'mx-auto',
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
