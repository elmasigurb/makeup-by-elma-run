export type PortfolioCategory =
  | 'Bridal'
  | 'Special Events'
  | 'Studio'
  | 'Shoots'
  | 'Hair Styles'
  | 'Editorial'

export const portfolioCategories: PortfolioCategory[] = [
  'Bridal',
  'Special Events',
  'Studio',
  'Shoots',
  'Hair Styles',
  'Editorial',
]

export interface PortfolioImage {
  id: string
  src: string
  alt: string
  category: PortfolioCategory
  featured: boolean
  order: number
}

export type PortfolioPlaceholderTone = 'mist' | 'stone' | 'pearl' | 'warm'

export interface PortfolioGalleryItem {
  id: string
  title: string
  category: PortfolioCategory
  order: number
  imageUrl: string | null
  alt: string
  /** CSS aspect-ratio value, for example "4 / 5". */
  aspectRatio: string
  placeholderTone: PortfolioPlaceholderTone
  description?: string
  width?: number | null
  height?: number | null
}

export interface PortfolioRecord {
  id: string
  title: string
  description: string
  alt_text: string
  category: PortfolioCategory
  image_path: string
  display_order: number
  featured: boolean
  published: boolean
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
  signedUrl: string | null
}

export interface PortfolioRecordInput {
  title: string
  description: string
  alt_text: string
  category: PortfolioCategory
  display_order: number
  featured: boolean
  published: boolean
  width: number | null
  height: number | null
}
