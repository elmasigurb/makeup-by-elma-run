import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'
import { fetchPublishedPortfolio } from '../../services/portfolioService'

interface FeaturedDisplayItem {
  id: string
  src: string
  alt: string
  category: string
}

interface FeaturedWorkProps {
  featuredIds?: string[]
}

const greyPlaceholders: FeaturedDisplayItem[] = [
  { id: 'placeholder-1', src: '', alt: '', category: 'Bridal' },
  { id: 'placeholder-2', src: '', alt: '', category: 'Editorial' },
  { id: 'placeholder-3', src: '', alt: '', category: 'Studio' },
]

export function FeaturedWork({ featuredIds = [] }: FeaturedWorkProps) {
  const [featured, setFeatured] = useState(greyPlaceholders)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true

    fetchPublishedPortfolio()
      .then((records) => {
        const selected = featuredIds.length > 0
          ? featuredIds.map((id) => records.find((record) => record.id === id)).filter((record) => record !== undefined)
          : records.filter((record) => record.featured).slice(0, 3)
        const remoteFeatured = selected
          .filter((record) => record.signedUrl)
          .map((record) => ({
            id: record.id,
            src: record.signedUrl!,
            alt: record.alt_text || record.title || 'Featured makeup portfolio image',
            category: record.category,
          }))
        if (active) setFeatured(remoteFeatured.length > 0 ? remoteFeatured : greyPlaceholders)
      })
      .catch(() => {
        // Keep the current homepage content when Supabase cannot be reached.
      })

    return () => {
      active = false
    }
  }, [featuredIds])

  return (
    <section id="featured" className="bg-linen px-5 py-24 sm:px-8 md:py-32 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-14 flex items-end justify-between gap-8 md:mb-20">
          <div>
            <p className="section-label mb-5">Selected work · 2024—26</p>
            <h2 className="font-serif text-5xl tracking-[-0.035em] sm:text-7xl">Recent beauty</h2>
          </div>
          <Link to="/contact" className="link-line hidden text-sm uppercase tracking-[0.16em] sm:block">
            Book an appointment
          </Link>
        </div>

        <div className="grid gap-x-5 gap-y-12 md:grid-cols-12 md:items-start lg:gap-x-8">
          {featured.map((image, index) => (
            <figure
              key={image.id}
              className={`group ${
                index === 0 ? 'md:col-span-5' : index === 1 ? 'md:col-span-4 md:mt-28' : 'md:col-span-3 md:mt-10'
              }`}
            >
              <div className={`overflow-hidden bg-sand ${index === 1 ? 'aspect-[4/5]' : 'aspect-[3/4]'}`}>
                {image.src && <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]" />}
              </div>
              <figcaption className="mt-4 flex items-center justify-between border-t border-ink/20 pt-3 text-sm">
                <span className="font-serif text-xl">{image.category}</span>
                <span className="text-xs tracking-widest text-taupe">0{index + 1}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
