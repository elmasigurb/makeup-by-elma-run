import type { PortfolioGalleryItem } from '../../types/content'

const tones: Record<PortfolioGalleryItem['placeholderTone'], string> = {
  mist: 'bg-[#deddd9]',
  stone: 'bg-[#d2d0cb]',
  pearl: 'bg-[#e7e5e0]',
  warm: 'bg-[#d9d4cc]',
}

interface PortfolioPlaceholderProps {
  item: PortfolioGalleryItem
  className?: string
  priority?: boolean
}

export function PortfolioPlaceholder({ item, className = '', priority = false }: PortfolioPlaceholderProps) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item.alt}
        width={item.width ?? undefined}
        height={item.height ?? undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={`h-full w-full object-cover ${className}`}
      />
    )
  }

  return <div aria-label={`${item.title || item.category} image placeholder`} role="img" className={`h-full w-full ${tones[item.placeholderTone]} ${className}`} />
}
