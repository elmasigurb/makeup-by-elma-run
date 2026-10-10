import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from 'react'
import { GripVertical, LoaderCircle, UploadCloud } from 'lucide-react'
import { EditorActions } from '../../components/admin/editor/EditorActions'
import { EditorPreviewModal } from '../../components/admin/editor/EditorPreviewModal'
import { defaultHomepageContent } from '../../data/siteContentDefaults'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import { fetchAdminPortfolio } from '../../services/portfolioService'
import { fetchAdminSiteContent, getSiteAssetUrl, publishSiteContent, saveSiteContentDraft, uploadSiteAsset } from '../../services/siteContentService'
import type { PortfolioRecord } from '../../types/content'
import type { HomepageContent, SiteImageReference } from '../../types/siteContent'

type Feedback = { type: 'success' | 'error'; message: string } | null

export function HomepageEditorPage() {
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent)
  const [baseline, setBaseline] = useState(JSON.stringify(defaultHomepageContent))
  const [portfolio, setPortfolio] = useState<PortfolioRecord[]>([])
  const [heroUrl, setHeroUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [published, setPublished] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [draggedFeatured, setDraggedFeatured] = useState<string | null>(null)

  const dirty = JSON.stringify(content) !== baseline
  useUnsavedChanges(dirty)

  useEffect(() => {
    let active = true
    Promise.all([
      fetchAdminSiteContent('homepage', defaultHomepageContent),
      fetchAdminPortfolio(),
    ]).then(async ([page, records]) => {
      if (!active) return
      setContent(page.draft)
      setBaseline(JSON.stringify(page.draft))
      setPublished(page.isPublished)
      setPortfolio(records)
      setHeroUrl(await resolveAdminImage(page.draft.heroImage, records))
    }).catch((error) => {
      if (active) setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Homepage content could not be loaded.' })
    }).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const featuredRecords = useMemo(
    () => content.featuredPortfolioIds.map((id) => portfolio.find((item) => item.id === id)).filter(Boolean) as PortfolioRecord[],
    [content.featuredPortfolioIds, portfolio],
  )

  const patch = (updates: Partial<HomepageContent>) => setContent((current) => ({ ...current, ...updates }))

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    window.setTimeout(() => setFeedback((current) => current?.message === message ? null : current), 5000)
  }

  const saveDraft = async () => {
    setBusy(true)
    try {
      await saveSiteContentDraft('homepage', content)
      setBaseline(JSON.stringify(content))
      showFeedback('success', 'Homepage draft saved. The public page was not changed.')
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'The draft could not be saved.')
    } finally { setBusy(false) }
  }

  const publish = async () => {
    setBusy(true)
    try {
      await publishSiteContent('homepage', content)
      setBaseline(JSON.stringify(content))
      setPublished(true)
      showFeedback('success', 'Homepage published successfully.')
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'The homepage could not be published.')
    } finally { setBusy(false) }
  }

  const uploadHero = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const uploaded = await uploadSiteAsset(file)
      patch({ heroImage: uploaded.reference })
      setHeroUrl(uploaded.signedUrl)
      showFeedback('success', 'Hero image uploaded. Save the draft or publish to keep this selection.')
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'The hero image could not be uploaded.')
    } finally { setBusy(false) }
  }

  const selectPortfolioHero = (record: PortfolioRecord) => {
    const reference: SiteImageReference = { source: 'portfolio', portfolioItemId: record.id }
    patch({ heroImage: reference })
    setHeroUrl(record.signedUrl)
  }

  const toggleFeatured = (id: string) => {
    patch({
      featuredPortfolioIds: content.featuredPortfolioIds.includes(id)
        ? content.featuredPortfolioIds.filter((candidate) => candidate !== id)
        : [...content.featuredPortfolioIds, id],
    })
  }

  const dropFeatured = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault()
    if (!draggedFeatured || draggedFeatured === targetId) return
    const next = [...content.featuredPortfolioIds]
    const from = next.indexOf(draggedFeatured)
    const to = next.indexOf(targetId)
    next.splice(to, 0, next.splice(from, 1)[0])
    setDraggedFeatured(null)
    patch({ featuredPortfolioIds: next })
  }

  if (loading) return <EditorLoading label="Loading homepage editor" />

  return (
    <section>
      <div className="mb-9 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="section-label mb-4">Homepage editor</p><h1 className="font-serif text-6xl leading-none tracking-[-0.04em] sm:text-7xl">Homepage</h1></div>
        <EditorActions busy={busy} dirty={dirty} published={published} onSave={() => void saveDraft()} onPreview={() => setPreviewOpen(true)} onPublish={() => void publish()} />
      </div>

      {feedback && <FeedbackBanner feedback={feedback} />}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <EditorSection title="Hero content" description="The first message visitors see.">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Main heading" value={content.heading} onChange={(value) => patch({ heading: value })} />
              <TextField label="Subtitle" value={content.subtitle} onChange={(value) => patch({ subtitle: value })} />
              <TextField label="Button label" value={content.primaryButton.label} onChange={(value) => patch({ primaryButton: { ...content.primaryButton, label: value } })} />
              <TextField label="Button link" value={content.primaryButton.href} onChange={(value) => patch({ primaryButton: { ...content.primaryButton, href: value } })} />
            </div>
          </EditorSection>

          <EditorSection title="Introduction" description="A short introduction beneath the hero.">
            <TextField label="Introduction heading" value={content.introductionHeading} onChange={(value) => patch({ introductionHeading: value })} />
            <label className="mt-5 block"><span className="admin-field-label">Introduction text</span><textarea value={content.introductionText} onChange={(event) => patch({ introductionText: event.target.value })} rows={5} className="admin-input resize-y text-base leading-relaxed" /></label>
          </EditorSection>

          <EditorSection title="Booking call to action" description="The closing message and button.">
            <TextField label="Heading" value={content.bookingHeading} onChange={(value) => patch({ bookingHeading: value })} />
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <TextField label="Button label" value={content.bookingButton.label} onChange={(value) => patch({ bookingButton: { ...content.bookingButton, label: value } })} />
              <TextField label="Button link" value={content.bookingButton.href} onChange={(value) => patch({ bookingButton: { ...content.bookingButton, href: value } })} />
            </div>
          </EditorSection>
        </div>

        <div className="space-y-6">
          <EditorSection title="Hero image" description="Upload a new image or choose published portfolio work.">
            <div className="aspect-[4/3] overflow-hidden bg-[#d8d6d1]">{heroUrl && <img src={heroUrl} alt="Hero preview" className="h-full w-full object-cover" />}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="editor-action-primary cursor-pointer"><UploadCloud size={15} /> Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadHero} className="sr-only" /></label>
              <button type="button" onClick={() => { patch({ heroImage: null }); setHeroUrl(null) }} className="editor-action-secondary">Use grey placeholder</button>
            </div>
            <p className="admin-field-label mb-3 mt-7">Choose from published portfolio</p>
            <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1">
              {portfolio.filter((item) => item.published).map((item) => (
                <button key={item.id} type="button" onClick={() => selectPortfolioHero(item)} className={`relative aspect-[4/5] overflow-hidden bg-[#deddd9] ${content.heroImage?.source === 'portfolio' && content.heroImage.portfolioItemId === item.id ? 'ring-2 ring-ink ring-offset-2' : ''}`} aria-label={`Use ${item.title} as hero image`}>
                  {item.signedUrl && <img src={item.signedUrl} alt={item.alt_text || item.title} className="h-full w-full object-cover" />}
                </button>
              ))}
            </div>
          </EditorSection>

          <EditorSection title="Featured portfolio" description="Select images, then drag the selected list into order.">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {portfolio.map((item) => {
                const selected = content.featuredPortfolioIds.includes(item.id)
                return <button key={item.id} type="button" onClick={() => toggleFeatured(item.id)} className={`relative aspect-[4/5] overflow-hidden bg-[#deddd9] ${selected ? 'ring-2 ring-ink ring-offset-2' : ''}`} aria-pressed={selected} aria-label={`${selected ? 'Remove' : 'Add'} ${item.title} ${selected ? 'from' : 'to'} featured images`}>
                  {item.signedUrl && <img src={item.signedUrl} alt={item.alt_text || item.title} className="h-full w-full object-cover" />}
                  {!item.published && <span className="absolute bottom-1 left-1 bg-ink/80 px-1.5 py-1 text-[0.58rem] uppercase tracking-wider text-white">Draft</span>}
                </button>
              })}
            </div>
            {featuredRecords.length > 0 && <div className="mt-5 space-y-2">
              {featuredRecords.map((item, index) => <div key={item.id} draggable onDragStart={() => setDraggedFeatured(item.id)} onDragEnd={() => setDraggedFeatured(null)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropFeatured(event, item.id)} className="flex cursor-grab items-center gap-3 bg-[#f3f0ea] px-3 py-2 text-sm"><GripVertical size={17} className="text-ink/35" /><span className="w-6 text-xs text-ink/35">{index + 1}</span><span>{item.title}</span></div>)}
            </div>}
          </EditorSection>
        </div>
      </div>

      <EditorPreviewModal open={previewOpen} title="Homepage" onClose={() => setPreviewOpen(false)}>
        <HomepagePreview content={content} heroUrl={heroUrl} featured={featuredRecords} />
      </EditorPreviewModal>
    </section>
  )
}

async function resolveAdminImage(reference: SiteImageReference | null, portfolio: PortfolioRecord[]) {
  if (!reference) return null
  if (reference.source === 'portfolio') return portfolio.find((item) => item.id === reference.portfolioItemId)?.signedUrl ?? null
  return getSiteAssetUrl(reference)
}

function HomepagePreview({ content, heroUrl, featured }: { content: HomepageContent; heroUrl: string | null; featured: PortfolioRecord[] }) {
  return <div className="bg-ivory"><section className="relative flex min-h-[70vh] items-end overflow-hidden bg-[#d8d6d1] p-7 text-white sm:p-12">{heroUrl && <img src={heroUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" /><div className="relative"><p className="mb-4 text-xs uppercase tracking-[0.3em]">{content.subtitle}</p><h2 className="font-serif text-[clamp(4rem,12vw,9rem)] leading-[0.75] tracking-[-0.05em]">{content.heading}</h2><p className="mt-8 text-xs uppercase tracking-[0.18em]">{content.primaryButton.label}</p></div></section><section className="px-6 py-20 sm:px-12"><h3 className="max-w-4xl font-serif text-5xl leading-none sm:text-7xl">{content.introductionHeading}</h3><p className="mt-8 max-w-2xl leading-relaxed text-ink/60">{content.introductionText}</p></section>{featured.length > 0 && <section className="grid gap-3 bg-linen px-6 py-16 sm:grid-cols-3 sm:px-12">{featured.map((item) => <div key={item.id} className="aspect-[3/4] bg-[#d8d6d1]">{item.signedUrl && <img src={item.signedUrl} alt="" className="h-full w-full object-cover" />}</div>)}</section>}</div>
}

export function EditorLoading({ label }: { label: string }) {
  return <div className="grid min-h-[55vh] place-items-center"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-ink/35" size={28} /><p className="mt-4 text-xs uppercase tracking-[0.16em] text-ink/40">{label}</p></div></div>
}

export function FeedbackBanner({ feedback }: { feedback: Exclude<Feedback, null> }) {
  return <div className={`mb-6 border-l-2 px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-ink bg-ivory text-ink/70' : 'border-[#7f3d34] bg-[#f3e8e4] text-[#7f3d34]'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div>
}

export function EditorSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="bg-ivory p-5 sm:p-7"><h2 className="font-serif text-3xl">{title}</h2><p className="mb-7 mt-2 text-sm leading-relaxed text-ink/45">{description}</p>{children}</section>
}

export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="admin-field-label">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="admin-input text-base" /></label>
}
