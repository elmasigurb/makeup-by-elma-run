import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { PortfolioGalleryItem } from '../../types/content'
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

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex bg-ink/98 text-ivory animate-lightbox-in"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} lightbox`}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-20 grid size-12 place-items-center rounded-full text-ivory transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:right-7 sm:top-6"
        aria-label="Close lightbox"
      >
        <X size={26} strokeWidth={1.25} />
      </button>

      <button
        type="button"
        onClick={() => onChange(previousIndex)}
        className="absolute bottom-5 left-4 z-20 grid size-12 place-items-center rounded-full border border-white/25 transition-colors hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-2 sm:bottom-auto sm:left-7 sm:top-1/2 sm:-translate-y-1/2"
        aria-label="Previous image"
      >
        <ChevronLeft size={26} strokeWidth={1.25} />
      </button>

      <div className="m-auto flex h-full w-full flex-col items-center justify-center px-5 py-24 sm:px-24 sm:py-16">
        <div
          className="max-h-[72vh] w-auto max-w-full overflow-hidden"
          style={{ aspectRatio: item.aspectRatio, height: 'min(72vh, 900px)' }}
        >
          <PortfolioPlaceholder item={item} priority />
        </div>
        <div className="mt-5 flex w-full max-w-2xl items-baseline justify-between gap-5">
          <div>
            <p className="font-serif text-2xl">{item.title}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-ivory/55">{item.category}</p>
          </div>
          <p className="text-xs tracking-[0.2em] text-ivory/45">
            {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(nextIndex)}
        className="absolute bottom-5 right-4 z-20 grid size-12 place-items-center rounded-full border border-white/25 transition-colors hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-2 sm:bottom-auto sm:right-7 sm:top-1/2 sm:-translate-y-1/2"
        aria-label="Next image"
      >
        <ChevronRight size={26} strokeWidth={1.25} />
      </button>
    </div>
  )
}
