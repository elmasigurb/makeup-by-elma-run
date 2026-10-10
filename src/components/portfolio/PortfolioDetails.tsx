import type { PortfolioGalleryItem } from '../../types/content'

interface PortfolioDetailsProps {
  item: PortfolioGalleryItem
  headingId?: string
  counter?: string
}

export function PortfolioDetails({ item, headingId, counter }: PortfolioDetailsProps) {
  const credits = [
    ['Makeup artist', item.makeupArtist],
    ['Photographer', item.photographer],
    ['Model', item.model],
    ['Hair stylist', item.hairStylist],
    ['Stylist / creative director', item.stylistCreativeDirector],
    ['Location', item.location],
    ['Date', formatProjectDate(item.projectDate)],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))

  return (
    <div>
      <div className="flex items-center justify-between gap-5 text-[0.68rem] uppercase tracking-[0.2em] text-ivory/55">
        <p>{item.category}</p>
        {counter && <p>{counter}</p>}
      </div>

      {item.title && <h2 id={headingId} className="mt-5 font-serif text-4xl leading-[0.95] tracking-[-0.025em] sm:text-5xl">{item.title}</h2>}
      {item.subtitle && <p className="mt-3 font-serif text-xl italic text-ivory/70 sm:text-2xl">{item.subtitle}</p>}
      {item.description && <p className="mt-7 whitespace-pre-line text-sm leading-relaxed text-ivory/70">{item.description}</p>}

      {credits.length > 0 && (
        <dl className="mt-9 border-t border-ivory/20 pt-6">
          {credits.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[minmax(7.5rem,0.8fr)_1.2fr] gap-4 border-b border-ivory/10 py-3 text-sm">
              <dt className="text-ivory/45">{label}</dt>
              <dd className="text-ivory/85">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {item.additionalCredits && (
        <div className="mt-7">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ivory/45">Additional credits</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ivory/75">{item.additionalCredits}</p>
        </div>
      )}
    </div>
  )
}

function formatProjectDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}
