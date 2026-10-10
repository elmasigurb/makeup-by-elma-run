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
  subtitle?: string
  category: PortfolioCategory
  order: number
  imageUrl: string | null
  alt: string
  /** CSS aspect-ratio value, for example "4 / 5". */
  aspectRatio: string
  placeholderTone: PortfolioPlaceholderTone
  description?: string
  makeupArtist?: string
  photographer?: string
  model?: string
  hairStylist?: string
  stylistCreativeDirector?: string
  location?: string
  projectDate?: string | null
  additionalCredits?: string
  width?: number | null
  height?: number | null
}

export interface PortfolioRecord {
  id: string
  title: string
  subtitle: string
  description: string
  alt_text: string
  category: PortfolioCategory
  image_path: string
  display_order: number
  featured: boolean
  published: boolean
  width: number | null
  height: number | null
  makeup_artist: string
  photographer: string
  model_name: string
  hair_stylist: string
  stylist_creative_director: string
  location: string
  project_date: string | null
  additional_credits: string
  created_at: string
  updated_at: string
  signedUrl: string | null
}

export interface PortfolioRecordInput {
  title: string
  subtitle: string
  description: string
  alt_text: string
  category: PortfolioCategory
  display_order: number
  featured: boolean
  published: boolean
  width: number | null
  height: number | null
  makeup_artist: string
  photographer: string
  model_name: string
  hair_stylist: string
  stylist_creative_director: string
  location: string
  project_date: string | null
  additional_credits: string
}
