import { useEffect, useState } from 'react'
import { EditorialPageHeader } from '../components/layout/EditorialPageHeader'
import { SecondaryPage } from '../components/layout/SecondaryPage'
import { defaultAboutPageContent } from '../data/siteContentDefaults'
import { isSupabaseConfigured } from '../lib/supabase'
import { sanitizeRichText } from '../lib/sanitizeRichText'
import { fetchPublishedPortfolio } from '../services/portfolioService'
import { fetchPublishedSiteContent, getSiteAssetUrl } from '../services/siteContentService'
import type { AboutPageContent, SiteImageReference } from '../types/siteContent'

export function AboutPage() {
  const [content, setContent] = useState<AboutPageContent>(defaultAboutPageContent)
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    fetchPublishedSiteContent('about', defaultAboutPageContent)
      .then(async (published) => {
        if (!active || !published) return
        const imageUrl = await resolvePublicImage(published.portraitImage)
        if (!active) return
        setContent(published)
        setPortraitUrl(imageUrl)
      })
      .catch(() => {
        // Keep local copy and the neutral image placeholder if content cannot load.
      })
    return () => { active = false }
  }, [])

  return (
    <SecondaryPage>
      <EditorialPageHeader
        eyebrow={content.eyebrow}
        title={content.heading}
        introduction={content.introduction}
      />

      <section className="grid gap-14 pt-16 md:grid-cols-12 md:gap-8 md:pt-24">
        <div className="aspect-[4/5] overflow-hidden bg-[#d8d6d1] md:col-span-6 lg:col-span-5" role="img" aria-label={portraitUrl ? 'Portrait of Elma Rún' : 'Portrait image placeholder'}>
          {portraitUrl && <img src={portraitUrl} alt="Portrait of Elma Rún" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
        </div>

        <div className="flex flex-col justify-between gap-20 md:col-span-6 md:pl-8 lg:col-span-6 lg:col-start-7 lg:pl-16">
          <div>
            <p className="section-label mb-6">{content.biographyHeading}</p>
            <div className="rich-editor space-y-6 font-serif text-3xl leading-[1.18] tracking-[-0.015em] text-ink/85 sm:text-4xl" dangerouslySetInnerHTML={{ __html: sanitizeRichText(content.biographyHtml) }} />
          </div>

          <div className="grid gap-5 border-t border-ink/15 pt-8 sm:grid-cols-[1fr_2fr]">
            <h2 className="section-label">{content.approachHeading}</h2>
            <p className="text-base leading-relaxed text-ink/65">{content.approachText}</p>
          </div>
        </div>
      </section>

      {content.sections.map((section) => (
        <section key={section.id} className="grid gap-8 border-t border-ink/15 py-14 md:grid-cols-12 md:py-20">
          <h2 className="font-serif text-4xl tracking-[-0.025em] md:col-span-5 md:text-5xl">{section.heading}</h2>
          <div className="rich-editor leading-relaxed text-ink/65 md:col-span-6 md:col-start-7" dangerouslySetInnerHTML={{ __html: sanitizeRichText(section.bodyHtml) }} />
        </section>
      ))}
    </SecondaryPage>
  )
}

async function resolvePublicImage(reference: SiteImageReference | null) {
  if (!reference) return null
  if (reference.source === 'upload') return getSiteAssetUrl(reference, true)
  const portfolio = await fetchPublishedPortfolio()
  return portfolio.find((item) => item.id === reference.portfolioItemId)?.signedUrl ?? null
}
