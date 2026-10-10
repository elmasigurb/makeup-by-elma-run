import { useEffect, useState } from 'react'
import { BookingCta } from '../components/home/BookingCta'
import { FeaturedWork } from '../components/home/FeaturedWork'
import { Hero } from '../components/home/Hero'
import { Introduction } from '../components/home/Introduction'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { defaultHomepageContent } from '../data/siteContentDefaults'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchPublishedPortfolio } from '../services/portfolioService'
import { fetchPublishedSiteContent, getSiteAssetUrl } from '../services/siteContentService'
import type { HomepageContent, SiteImageReference } from '../types/siteContent'

export function HomePage() {
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true

    fetchPublishedSiteContent('homepage', defaultHomepageContent)
      .then(async (published) => {
        if (!active || !published) return
        const imageUrl = await resolvePublicImage(published.heroImage)
        if (!active) return
        setContent(published)
        setHeroImageUrl(imageUrl)
      })
      .catch(() => {
        // Keep the local content and grey image area if Supabase is unavailable.
      })

    return () => { active = false }
  }, [])

  return (
    <>
      <Header />
      <main id="main-content">
        <Hero heading={content.heading} subtitle={content.subtitle} imageUrl={heroImageUrl} button={content.primaryButton} />
        <Introduction heading={content.introductionHeading} text={content.introductionText} />
        <FeaturedWork featuredIds={content.featuredPortfolioIds} />
        <BookingCta heading={content.bookingHeading} button={content.bookingButton} />
      </main>
      <Footer />
    </>
  )
}

async function resolvePublicImage(reference: SiteImageReference | null) {
  if (!reference) return null
  if (reference.source === 'upload') return getSiteAssetUrl(reference, true)
  const portfolio = await fetchPublishedPortfolio()
  return portfolio.find((item) => item.id === reference.portfolioItemId)?.signedUrl ?? null
}
