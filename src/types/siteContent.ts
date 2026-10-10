export type SiteImageReference =
  | { source: 'upload'; path: string }
  | { source: 'portfolio'; portfolioItemId: string }

export interface SiteButtonContent {
  label: string
  href: string
}

export interface HomepageContent {
  heading: string
  subtitle: string
  introductionHeading: string
  introductionText: string
  heroImage: SiteImageReference | null
  featuredPortfolioIds: string[]
  primaryButton: SiteButtonContent
  bookingHeading: string
  bookingButton: SiteButtonContent
}

export interface AboutSectionContent {
  id: string
  heading: string
  bodyHtml: string
}

export interface AboutPageContent {
  eyebrow: string
  heading: string
  introduction: string
  portraitImage: SiteImageReference | null
  biographyHeading: string
  biographyHtml: string
  approachHeading: string
  approachText: string
  sections: AboutSectionContent[]
}

export interface AdminContentState<T> {
  draft: T
  published: T | null
  isPublished: boolean
}
