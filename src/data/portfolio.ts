import type { PortfolioGalleryItem, PortfolioImage } from '../types/content'

// This temporary local data source can later be replaced by a Supabase query
// without changing the components that consume PortfolioImage objects.
export const portfolioImages: PortfolioImage[] = [
  {
    id: 'soft-focus-bridal',
    src: '/images/bridal-editorial.jpg',
    alt: 'Soft, luminous bridal makeup in warm natural light',
    category: 'Bridal',
    featured: true,
    order: 1,
  },
  {
    id: 'studio-sculpture',
    src: '/images/studio-editorial.jpg',
    alt: 'Sculptural studio beauty look with a clean complexion',
    category: 'Studio',
    featured: true,
    order: 2,
  },
  {
    id: 'modern-editorial',
    src: '/images/editorial-beauty.jpg',
    alt: 'Modern editorial makeup with rich neutral tones',
    category: 'Editorial',
    featured: true,
    order: 3,
  },
]

// Public gallery records. `imageUrl` maps cleanly to a future Supabase Storage
// URL, while `order` can be used directly for database ordering.
export const portfolioGalleryItems: PortfolioGalleryItem[] = [
  { id: 'bridal-01', title: 'Soft Light', category: 'Bridal', order: 1, imageUrl: null, alt: 'Bridal makeup portrait', aspectRatio: '4 / 5', placeholderTone: 'mist' },
  { id: 'studio-01', title: 'Quiet Form', category: 'Studio', order: 2, imageUrl: null, alt: 'Studio beauty portrait', aspectRatio: '3 / 4', placeholderTone: 'stone' },
  { id: 'editorial-01', title: 'New Neutral', category: 'Editorial', order: 3, imageUrl: null, alt: 'Editorial makeup portrait', aspectRatio: '2 / 3', placeholderTone: 'pearl' },
  { id: 'events-01', title: 'After Dark', category: 'Special Events', order: 4, imageUrl: null, alt: 'Special event makeup look', aspectRatio: '5 / 6', placeholderTone: 'warm' },
  { id: 'shoots-01', title: 'In Motion', category: 'Shoots', order: 5, imageUrl: null, alt: 'Campaign makeup portrait', aspectRatio: '4 / 3', placeholderTone: 'mist' },
  { id: 'hair-01', title: 'Sculpted', category: 'Hair Styles', order: 6, imageUrl: null, alt: 'Editorial hair styling', aspectRatio: '3 / 4', placeholderTone: 'stone' },
  { id: 'bridal-02', title: 'The Ceremony', category: 'Bridal', order: 7, imageUrl: null, alt: 'Natural bridal makeup look', aspectRatio: '2 / 3', placeholderTone: 'pearl' },
  { id: 'editorial-02', title: 'Contour Study', category: 'Editorial', order: 8, imageUrl: null, alt: 'Contemporary editorial beauty look', aspectRatio: '4 / 5', placeholderTone: 'warm' },
  { id: 'studio-02', title: 'Clean Canvas', category: 'Studio', order: 9, imageUrl: null, alt: 'Clean studio makeup portrait', aspectRatio: '1 / 1', placeholderTone: 'mist' },
  { id: 'events-02', title: 'Evening Glow', category: 'Special Events', order: 10, imageUrl: null, alt: 'Evening event makeup look', aspectRatio: '3 / 4', placeholderTone: 'stone' },
  { id: 'hair-02', title: 'Soft Structure', category: 'Hair Styles', order: 11, imageUrl: null, alt: 'Soft structured hair styling', aspectRatio: '4 / 5', placeholderTone: 'pearl' },
  { id: 'shoots-02', title: 'Campaign No. 02', category: 'Shoots', order: 12, imageUrl: null, alt: 'Beauty campaign makeup look', aspectRatio: '2 / 3', placeholderTone: 'warm' },
  { id: 'bridal-03', title: 'Modern Veil', category: 'Bridal', order: 13, imageUrl: null, alt: 'Modern bridal beauty portrait', aspectRatio: '5 / 6', placeholderTone: 'stone' },
  { id: 'studio-03', title: 'Profile', category: 'Studio', order: 14, imageUrl: null, alt: 'Studio profile makeup portrait', aspectRatio: '4 / 3', placeholderTone: 'pearl' },
  { id: 'editorial-03', title: 'Texture Study', category: 'Editorial', order: 15, imageUrl: null, alt: 'Textural editorial makeup look', aspectRatio: '3 / 4', placeholderTone: 'mist' },
  { id: 'events-03', title: 'Occasion', category: 'Special Events', order: 16, imageUrl: null, alt: 'Polished special occasion makeup', aspectRatio: '4 / 5', placeholderTone: 'warm' },
  { id: 'shoots-03', title: 'Still Life', category: 'Shoots', order: 17, imageUrl: null, alt: 'Creative shoot makeup portrait', aspectRatio: '5 / 6', placeholderTone: 'stone' },
  { id: 'hair-03', title: 'The Finish', category: 'Hair Styles', order: 18, imageUrl: null, alt: 'Finished editorial hairstyle', aspectRatio: '2 / 3', placeholderTone: 'pearl' },
]
