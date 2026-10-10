import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { PortfolioGalleryItem } from '../../types/content'
import { PortfolioDetails } from './PortfolioDetails'
import { PortfolioPlaceholder } from './PortfolioPlaceholder'

interface PortfolioLightboxProps {
  items: PortfolioGalleryItem[]
  activeIndex: number
  onClose: () => void
  onChange: (index: number) => void
}

export function PortfolioLightbox({ items, activeIndex, onClose, onChange }: PortfolioLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const item = items[activeIndex]

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      previousFocusRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') onChange((activeIndex - 1 + items.length) % items.length)
      if (event.key === 'ArrowRight') onChange((activeIndex + 1) % items.length)
      if (event.key === 'Tab') {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
        if (!controls?.length) return
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, items.length, onChange, onClose])

  if (!item) return null

  const previousIndex = (activeIndex - 1 + items.length) % items.length
  const nextIndex = (activeIndex + 1) % items.length
  const counter = `${String(activeIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`
  const accessibleTitle = item.title || `${item.category} portfolio image`

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] overflow-y-auto bg-ink text-ivory animate-lightbox-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-lightbox-title"
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className="fixed right-4 top-4 z-30 grid size-12 place-items-center rounded-full bg-ink/45 text-ivory backdrop-blur-sm transition-colors hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:right-7 sm:top-6"
        aria-label="Close lightbox"
      >
        <X size={26} strokeWidth={1.25} />
      </button>

      <div className="grid min-h-full lg:grid-cols-[minmax(0,1.65fr)_minmax(21rem,0.65fr)]">
        <div className="flex min-h-[68svh] items-center justify-center px-5 pb-8 pt-20 sm:px-20 sm:pb-12 lg:min-h-screen lg:px-16 lg:py-20">
          <div
            className="max-h-[72svh] max-w-full overflow-hidden lg:max-h-[82svh]"
            style={{ aspectRatio: item.aspectRatio, height: 'min(72svh, 900px)' }}
          >
            <PortfolioPlaceholder item={item} priority className="object-contain" />
          </div>
        </div>

        <aside className="border-t border-ivory/15 px-5 pb-28 pt-9 sm:px-10 lg:flex lg:min-h-screen lg:items-center lg:border-l lg:border-t-0 lg:px-10 lg:py-24">
          <div className="w-full">
            <span id="portfolio-lightbox-title" className="sr-only">{accessibleTitle}</span>
            <PortfolioDetails item={item} counter={counter} />
          </div>
        </aside>
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => onChange(previousIndex)}
            className="fixed bottom-5 left-4 z-20 grid size-12 place-items-center rounded-full border border-white/25 bg-ink/45 backdrop-blur-sm transition-colors hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-2 sm:left-7 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2"
            aria-label="Previous image"
          >
            <ChevronLeft size={26} strokeWidth={1.25} />
          </button>
          <button
            type="button"
            onClick={() => onChange(nextIndex)}
            className="fixed bottom-5 right-4 z-20 grid size-12 place-items-center rounded-full border border-white/25 bg-ink/45 backdrop-blur-sm transition-colors hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-2 sm:right-7 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2"
            aria-label="Next image"
          >
            <ChevronRight size={26} strokeWidth={1.25} />
          </button>
        </>
      )}
    </div>
  )
}
