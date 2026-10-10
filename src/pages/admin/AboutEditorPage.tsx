import { useEffect, useState, type ChangeEvent } from 'react'
import { Plus, Trash2, UploadCloud } from 'lucide-react'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { EditorActions } from '../../components/admin/editor/EditorActions'
import { EditorPreviewModal } from '../../components/admin/editor/EditorPreviewModal'
import { RichTextEditor } from '../../components/admin/editor/RichTextEditor'
import { defaultAboutPageContent } from '../../data/siteContentDefaults'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import { sanitizeRichText } from '../../lib/sanitizeRichText'
import { fetchAdminSiteContent, getSiteAssetUrl, publishSiteContent, saveSiteContentDraft, uploadSiteAsset } from '../../services/siteContentService'
import type { AboutPageContent, AboutSectionContent } from '../../types/siteContent'
import { EditorLoading, EditorSection, FeedbackBanner, TextField } from './HomepageEditorPage'

type Feedback = { type: 'success' | 'error'; message: string } | null

export function AboutEditorPage() {
  const [content, setContent] = useState<AboutPageContent>(defaultAboutPageContent)
  const [baseline, setBaseline] = useState(JSON.stringify(defaultAboutPageContent))
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [published, setPublished] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [removeCandidate, setRemoveCandidate] = useState<AboutSectionContent | null>(null)

  const dirty = JSON.stringify(content) !== baseline
  useUnsavedChanges(dirty)

  useEffect(() => {
    let active = true
    fetchAdminSiteContent('about', defaultAboutPageContent)
      .then(async (page) => {
        if (!active) return
        setContent(page.draft)
        setBaseline(JSON.stringify(page.draft))
        setPublished(page.isPublished)
        setPortraitUrl(await getSiteAssetUrl(page.draft.portraitImage))
      })
      .catch((error) => active && setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'About content could not be loaded.' }))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const patch = (updates: Partial<AboutPageContent>) => setContent((current) => ({ ...current, ...updates }))

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    window.setTimeout(() => setFeedback((current) => current?.message === message ? null : current), 5000)
  }

  const cleanContent = () => ({
    ...content,
    biographyHtml: sanitizeRichText(content.biographyHtml),
    sections: content.sections.map((section) => ({ ...section, bodyHtml: sanitizeRichText(section.bodyHtml) })),
  })

  const saveDraft = async () => {
    setBusy(true)
    try {
      const clean = cleanContent()
      await saveSiteContentDraft('about', clean)
      setContent(clean)
      setBaseline(JSON.stringify(clean))
      showFeedback('success', 'About draft saved. The public page was not changed.')
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'The draft could not be saved.')
    } finally { setBusy(false) }
  }

  const publish = async () => {
    setBusy(true)
    try {
      const clean = cleanContent()
      await publishSiteContent('about', clean)
      setContent(clean)
      setBaseline(JSON.stringify(clean))
      setPublished(true)
      showFeedback('success', 'About page published successfully.')
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'The About page could not be published.')
    } finally { setBusy(false) }
  }

  const uploadPortrait = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const uploaded = await uploadSiteAsset(file)
      patch({ portraitImage: uploaded.reference })
      setPortraitUrl(uploaded.signedUrl)
      showFeedback('success', 'Portrait uploaded. Save the draft or publish to keep this selection.')
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'The portrait could not be uploaded.')
    } finally { setBusy(false) }
  }

  const addSection = () => patch({ sections: [...content.sections, { id: crypto.randomUUID(), heading: 'New section', bodyHtml: '<p>Add your text here.</p>' }] })
  const patchSection = (id: string, updates: Partial<AboutSectionContent>) => patch({ sections: content.sections.map((section) => section.id === id ? { ...section, ...updates } : section) })
  const removeSection = () => {
    if (!removeCandidate) return
    patch({ sections: content.sections.filter((section) => section.id !== removeCandidate.id) })
    setRemoveCandidate(null)
  }

  if (loading) return <EditorLoading label="Loading About editor" />

  return (
    <section>
      <div className="mb-9 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="section-label mb-4">About editor</p><h1 className="font-serif text-6xl leading-none tracking-[-0.04em] sm:text-7xl">About Me</h1></div>
        <EditorActions busy={busy} dirty={dirty} published={published} onSave={() => void saveDraft()} onPreview={() => setPreviewOpen(true)} onPublish={() => void publish()} />
      </div>

      {feedback && <FeedbackBanner feedback={feedback} />}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <EditorSection title="Page introduction" description="The opening message on your About page.">
            <div className="space-y-5">
              <TextField label="Eyebrow" value={content.eyebrow} onChange={(value) => patch({ eyebrow: value })} />
              <TextField label="Main heading" value={content.heading} onChange={(value) => patch({ heading: value })} />
              <label className="block"><span className="admin-field-label">Introduction</span><textarea value={content.introduction} onChange={(event) => patch({ introduction: event.target.value })} rows={5} className="admin-input resize-y text-base leading-relaxed" /></label>
            </div>
          </EditorSection>

          <EditorSection title="Portrait image" description="Shown in the main editorial image area.">
            <div className="aspect-[4/5] overflow-hidden bg-[#d8d6d1]">{portraitUrl && <img src={portraitUrl} alt="Portrait preview" className="h-full w-full object-cover" />}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="editor-action-primary cursor-pointer"><UploadCloud size={15} /> Upload portrait<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadPortrait} className="sr-only" /></label>
              <button type="button" onClick={() => { patch({ portraitImage: null }); setPortraitUrl(null) }} className="editor-action-secondary">Use grey placeholder</button>
            </div>
          </EditorSection>

          <EditorSection title="Approach" description="A concise statement about how you work.">
            <TextField label="Section heading" value={content.approachHeading} onChange={(value) => patch({ approachHeading: value })} />
            <label className="mt-5 block"><span className="admin-field-label">Approach text</span><textarea value={content.approachText} onChange={(event) => patch({ approachText: event.target.value })} rows={6} className="admin-input resize-y text-base leading-relaxed" /></label>
          </EditorSection>
        </div>

        <div className="space-y-6">
          <EditorSection title="Biography" description="Use the toolbar for simple emphasis and lists.">
            <TextField label="Section heading" value={content.biographyHeading} onChange={(value) => patch({ biographyHeading: value })} />
            <div className="mt-6"><RichTextEditor label="Biography text" value={content.biographyHtml} onChange={(value) => patch({ biographyHtml: value })} /></div>
          </EditorSection>

          {content.sections.map((section, index) => (
            <EditorSection key={section.id} title={`Additional section ${index + 1}`} description="Optional content beneath your main biography.">
              <div className="flex items-start gap-4"><div className="flex-1"><TextField label="Section heading" value={section.heading} onChange={(value) => patchSection(section.id, { heading: value })} /></div><button type="button" onClick={() => setRemoveCandidate(section)} className="mt-4 grid size-10 place-items-center text-ink/40 hover:text-[#7f3d34]" aria-label={`Remove ${section.heading}`}><Trash2 size={18} /></button></div>
              <div className="mt-6"><RichTextEditor label="Section text" value={section.bodyHtml} onChange={(value) => patchSection(section.id, { bodyHtml: value })} /></div>
            </EditorSection>
          ))}

          <button type="button" onClick={addSection} className="flex min-h-14 w-full items-center justify-center gap-2 border border-dashed border-ink/25 text-xs uppercase tracking-[0.16em] text-ink/55 hover:border-ink hover:text-ink"><Plus size={17} /> Add content section</button>
        </div>
      </div>

      <EditorPreviewModal open={previewOpen} title="About Me" onClose={() => setPreviewOpen(false)}>
        <AboutPreview content={content} portraitUrl={portraitUrl} />
      </EditorPreviewModal>

      <ConfirmDialog open={Boolean(removeCandidate)} title="Remove this section?" description={`“${removeCandidate?.heading}” and its text will be removed from this draft.`} onCancel={() => setRemoveCandidate(null)} onConfirm={removeSection} />
    </section>
  )
}

function AboutPreview({ content, portraitUrl }: { content: AboutPageContent; portraitUrl: string | null }) {
  return <div className="bg-ivory px-6 py-16 sm:px-12"><header className="grid gap-7 border-b border-ink/15 pb-14 md:grid-cols-[1.5fr_1fr] md:items-end"><div><p className="section-label mb-5">{content.eyebrow}</p><h2 className="font-serif text-6xl leading-none tracking-[-0.04em] sm:text-8xl">{content.heading}</h2></div><p className="leading-relaxed text-ink/60">{content.introduction}</p></header><section className="grid gap-12 pt-16 md:grid-cols-2"><div className="aspect-[4/5] bg-[#d8d6d1]">{portraitUrl && <img src={portraitUrl} alt="" className="h-full w-full object-cover" />}</div><div><p className="section-label mb-5">{content.biographyHeading}</p><div className="rich-editor font-serif text-2xl leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeRichText(content.biographyHtml) }} /><div className="mt-14 border-t border-ink/15 pt-7"><p className="section-label mb-4">{content.approachHeading}</p><p className="leading-relaxed text-ink/60">{content.approachText}</p></div></div></section>{content.sections.map((section) => <section key={section.id} className="mt-16 grid gap-5 border-t border-ink/15 pt-10 md:grid-cols-[1fr_2fr]"><h3 className="font-serif text-4xl">{section.heading}</h3><div className="rich-editor leading-relaxed text-ink/65" dangerouslySetInnerHTML={{ __html: sanitizeRichText(section.bodyHtml) }} /></section>)}</div>
}

