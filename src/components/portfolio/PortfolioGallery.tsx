import { useCallback, useEffect, useMemo, useState } from 'react'
import { portfolioGalleryItems } from '../../data/portfolio'
import { isSupabaseConfigured } from '../../lib/supabase'
import { fetchPublishedPortfolio, toGalleryItems } from '../../services/portfolioService'
import type { PortfolioCategory } from '../../types/content'
import { PortfolioLightbox } from './PortfolioLightbox'
import { PortfolioPlaceholder } from './PortfolioPlaceholder'

type FilterCategory = 'All' | PortfolioCategory

const categories: FilterCategory[] = ['All', 'Bridal', 'Special Events', 'Studio', 'Shoots', 'Hair Styles', 'Editorial']

export function PortfolioGallery() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [galleryItems, setGalleryItems] = useState(portfolioGalleryItems)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true

    fetchPublishedPortfolio()
      .then((records) => {
        if (active && records.length > 0) setGalleryItems(toGalleryItems(records))
      })
      .catch(() => {
        // The public gallery deliberately keeps its local grey placeholders if
        // Supabase is unavailable or no published records can be read.
      })

    return () => {
      active = false
    }
  }, [])

  const filteredItems = useMemo(
    () =>
      galleryItems
        .filter((item) => activeCategory === 'All' || item.category === activeCategory)
        .sort((a, b) => a.order - b.order),
    [activeCategory, galleryItems],
  )

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const changeLightbox = useCallback((index: number) => setLightboxIndex(index), [])

  const selectCategory = (category: FilterCategory) => {
    setActiveCategory(category)
    setLightboxIndex(null)
  }

  return (
    <>
      <div className="mb-12 overflow-x-auto pb-2 md:mb-16">
        <div className="flex min-w-max gap-7 sm:gap-9">
          {categories.map((category) => {
            const active = category === activeCategory
            return (
              <button
                key={category}
                type="button"
                onClick={() => selectCategory(category)}
                className={`relative pb-2 text-sm tracking-[0.08em] transition-colors ${
                  active ? 'text-ink' : 'text-ink/45 hover:text-ink'
                }`}
                aria-pressed={active}
              >
                {category}
                <span
                  className={`absolute inset-x-0 bottom-0 h-px origin-left bg-ink transition-transform duration-300 ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div key={activeCategory} className="columns-1 gap-3 sm:columns-2 lg:columns-3 animate-gallery-in">
        {filteredItems.map((item, index) => (
          <figure key={item.id} className="mb-3 break-inside-avoid">
            <button
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              aria-label={`Open ${item.title || `${item.category} portfolio image`} in lightbox`}
            >
              <div className="relative overflow-hidden bg-ink" style={{ aspectRatio: item.aspectRatio }}>
                <PortfolioPlaceholder
                  item={item}
                  className="transition duration-700 ease-out group-hover:scale-[1.015] group-hover:opacity-90"
                />
                <span className="absolute bottom-3 right-3 translate-y-1 text-[0.62rem] uppercase tracking-[0.2em] text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">View</span>
              </div>
            </button>
            {item.title && <figcaption className="px-0.5 pb-4 pt-3 font-serif text-xl leading-none">{item.title}</figcaption>}
          </figure>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PortfolioLightbox
          items={filteredItems}
          activeIndex={lightboxIndex}
          onClose={closeLightbox}
          onChange={changeLightbox}
        />
      )}
    </>
  )
}
