import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from 'react'
import { ArrowDown, ArrowUp, Eye, GripVertical, ImagePlus, LoaderCircle, Save, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { EditorPreviewModal } from '../../components/admin/editor/EditorPreviewModal'
import { PortfolioUploadPanel } from '../../components/admin/portfolio/PortfolioUploadPanel'
import { PortfolioDetails } from '../../components/portfolio/PortfolioDetails'
import { PortfolioPlaceholder } from '../../components/portfolio/PortfolioPlaceholder'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import {
  deletePortfolioItem,
  fetchAdminPortfolio,
  readImageDimensions,
  replacePortfolioImage,
  toGalleryItems,
  updatePortfolioItem,
  updatePortfolioOrder,
} from '../../services/portfolioService'
import { portfolioCategories, type PortfolioCategory, type PortfolioRecord } from '../../types/content'

type Feedback = { message: string; type: 'success' | 'error' } | null

export function PortfolioManagerPage() {
  const [items, setItems] = useState<PortfolioRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<PortfolioRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())
  const [previewId, setPreviewId] = useState<string | null>(null)

  useUnsavedChanges(dirtyIds.size > 0)

  const loadItems = useCallback(async () => {
    try {
      const records = await fetchAdminPortfolio()
      setItems(records)
      setDirtyIds(new Set())
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Portfolio items could not be loaded.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const nextOrder = useMemo(() => items.reduce((maximum, item) => Math.max(maximum, item.display_order), -1) + 1, [items])

  const showMessage = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type })
    window.setTimeout(() => setFeedback((current) => current?.message === message ? null : current), 5000)
  }

  const patchItem = (id: string, updates: Partial<PortfolioRecord>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item))
    setDirtyIds((current) => new Set(current).add(id))
  }

  const saveItem = async (item: PortfolioRecord) => {
    setBusyId(item.id)
    try {
      const saved = await updatePortfolioItem(item.id, {
        title: item.title.trim(),
        subtitle: item.subtitle.trim(),
        description: item.description.trim(),
        alt_text: item.alt_text.trim() || item.title.trim() || 'Portfolio image',
        category: item.category,
        display_order: item.display_order,
        featured: item.featured,
        published: item.published,
        width: item.width,
        height: item.height,
        makeup_artist: item.makeup_artist.trim(),
        photographer: item.photographer.trim(),
        model_name: item.model_name.trim(),
        hair_stylist: item.hair_stylist.trim(),
        stylist_creative_director: item.stylist_creative_director.trim(),
        location: item.location.trim(),
        project_date: item.project_date || null,
        additional_credits: item.additional_credits.trim(),
      })
      setItems((current) => current.map((candidate) => candidate.id === saved.id ? saved : candidate))
      setDirtyIds((current) => {
        const next = new Set(current)
        next.delete(saved.id)
        return next
      })
      showMessage(`“${saved.title || 'Untitled image'}” was saved.`, 'success')
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'The item could not be saved.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const persistReorder = async (nextItems: PortfolioRecord[]) => {
    setItems(nextItems.map((item, index) => ({ ...item, display_order: index })))
    setSavingOrder(true)
    try {
      await updatePortfolioOrder(nextItems)
      showMessage('Portfolio order saved.', 'success')
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'The new order could not be saved.', 'error')
      await loadItems()
    } finally {
      setSavingOrder(false)
    }
  }

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex || savingOrder) return
    const next = [...items]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    void persistReorder(next)
  }

  const dropItem = (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault()
    if (!draggedId || draggedId === targetId) return
    const fromIndex = items.findIndex((item) => item.id === draggedId)
    const toIndex = items.findIndex((item) => item.id === targetId)
    setDraggedId(null)
    moveItem(fromIndex, toIndex)
  }

  const replaceImage = async (item: PortfolioRecord, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      showMessage('Use a JPG, PNG, WebP, or AVIF image.', 'error')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      showMessage('The replacement image is larger than 15 MB.', 'error')
      return
    }

    setBusyId(item.id)
    try {
      const dimensions = await readImageDimensions(file)
      const result = await replacePortfolioImage(item, file, dimensions)
      setItems((current) => current.map((candidate) => candidate.id === item.id ? {
        ...candidate,
        image_path: result.record.image_path,
        signedUrl: result.record.signedUrl,
        width: result.record.width,
        height: result.record.height,
        updated_at: result.record.updated_at,
      } : candidate))
      showMessage(result.warning ?? `“${item.title || 'Untitled image'}” was replaced.`, result.warning ? 'error' : 'success')
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'The image could not be replaced.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    setDeleting(true)
    try {
      const warning = await deletePortfolioItem(deleteCandidate)
      const remaining = items.filter((item) => item.id !== deleteCandidate.id)
      setItems(remaining)
      setDirtyIds((current) => {
        const next = new Set(current)
        next.delete(deleteCandidate.id)
        return next
      })
      setDeleteCandidate(null)
      if (remaining.length) await updatePortfolioOrder(remaining)
      showMessage(warning ?? 'Portfolio image deleted.', warning ? 'error' : 'success')
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'The image could not be deleted.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const previewItem = previewId ? items.find((item) => item.id === previewId) ?? null : null

  return (
    <section>
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-4">Portfolio manager</p>
          <h1 className="font-serif text-6xl leading-none tracking-[-0.04em] sm:text-7xl">Your work</h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-ink/55">Upload, arrange and publish images. Drafts remain visible only here.</p>
        </div>
        <div className="text-sm text-ink/45">{items.length} {items.length === 1 ? 'image' : 'images'} · {items.filter((item) => item.published).length} published</div>
      </div>

      {feedback && (
        <div className={`mb-6 border-l-2 px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-ink bg-ivory text-ink/70' : 'border-[#7f3d34] bg-[#f3e8e4] text-[#7f3d34]'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
          {feedback.message}
        </div>
      )}

      <PortfolioUploadPanel nextOrder={nextOrder} onUploaded={loadItems} onMessage={showMessage} />

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="section-label">Current portfolio</p>
            <p className="mt-2 text-sm text-ink/45">Drag the handles or use the arrow buttons to change display order.</p>
          </div>
          {savingOrder && <span className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-ink/45"><LoaderCircle className="animate-spin" size={15} /> Saving order</span>}
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center bg-ivory"><LoaderCircle className="animate-spin text-ink/35" size={28} strokeWidth={1.4} /><span className="sr-only">Loading portfolio</span></div>
        ) : items.length === 0 ? (
          <div className="bg-ivory px-6 py-20 text-center">
            <ImagePlus className="mx-auto text-ink/25" size={34} strokeWidth={1.2} />
            <h2 className="mt-5 font-serif text-4xl">No uploaded work yet</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/50">Choose images above to create your first portfolio entries. They will remain drafts unless you publish them.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <article
                key={item.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => dropItem(event, item.id)}
                className={`grid gap-5 bg-ivory p-4 transition-opacity md:grid-cols-[2.5rem_9rem_1fr_auto] md:items-start md:p-5 ${draggedId === item.id ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center gap-1 md:flex-col">
                  <button
                    type="button"
                    draggable={!savingOrder}
                    onDragStart={() => setDraggedId(item.id)}
                    onDragEnd={() => setDraggedId(null)}
                    className="hidden size-9 cursor-grab place-items-center text-ink/35 active:cursor-grabbing md:grid"
                    aria-label={`Drag ${item.title} to reorder`}
                  >
                    <GripVertical size={20} strokeWidth={1.4} />
                  </button>
                  <button type="button" onClick={() => moveItem(index, index - 1)} disabled={index === 0 || savingOrder} className="grid size-9 place-items-center text-ink/40 disabled:opacity-20" aria-label={`Move ${item.title} up`}><ArrowUp size={17} /></button>
                  <button type="button" onClick={() => moveItem(index, index + 1)} disabled={index === items.length - 1 || savingOrder} className="grid size-9 place-items-center text-ink/40 disabled:opacity-20" aria-label={`Move ${item.title} down`}><ArrowDown size={17} /></button>
                </div>

                <div>
                  <div className="aspect-[4/5] overflow-hidden bg-[#deddd9]">
                    {item.signedUrl && <img src={item.signedUrl} alt={item.alt_text || item.title} className="h-full w-full object-cover" />}
                  </div>
                  <label className="mt-2 flex min-h-9 cursor-pointer items-center justify-center border border-ink/15 text-[0.68rem] uppercase tracking-[0.14em] hover:border-ink">
                    Replace image
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void replaceImage(item, event)} disabled={busyId === item.id} className="sr-only" />
                  </label>
                </div>

                <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="admin-field-label">Title / headline</span>
                    <input value={item.title} onChange={(event) => patchItem(item.id, { title: event.target.value })} className="admin-input font-serif text-2xl" placeholder="Optional public title" />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="admin-field-label">Subtitle</span>
                    <input value={item.subtitle} onChange={(event) => patchItem(item.id, { subtitle: event.target.value })} className="admin-input text-sm" placeholder="Optional project subtitle" />
                  </label>
                  <label>
                    <span className="admin-field-label">Category</span>
                    <select value={item.category} onChange={(event) => patchItem(item.id, { category: event.target.value as PortfolioCategory })} className="admin-input text-sm">
                      {portfolioCategories.map((category) => <option key={category}>{category}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="admin-field-label">Alternative text</span>
                    <input value={item.alt_text} onChange={(event) => patchItem(item.id, { alt_text: event.target.value })} className="admin-input text-sm" placeholder="Describe the image" />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="admin-field-label">Description</span>
                    <textarea value={item.description} onChange={(event) => patchItem(item.id, { description: event.target.value })} rows={3} className="admin-input resize-y text-sm" placeholder="Optional project description" />
                  </label>
                  <div className="border-t border-ink/10 pt-5 sm:col-span-2">
                    <p className="admin-field-label">Credits & project details</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/45">Leave any field empty to hide it from the public image viewer.</p>
                  </div>
                  <PortfolioTextField label="Makeup artist" value={item.makeup_artist} onChange={(value) => patchItem(item.id, { makeup_artist: value })} />
                  <PortfolioTextField label="Photographer" value={item.photographer} onChange={(value) => patchItem(item.id, { photographer: value })} />
                  <PortfolioTextField label="Model" value={item.model_name} onChange={(value) => patchItem(item.id, { model_name: value })} />
                  <PortfolioTextField label="Hair stylist" value={item.hair_stylist} onChange={(value) => patchItem(item.id, { hair_stylist: value })} />
                  <PortfolioTextField label="Stylist / creative director" value={item.stylist_creative_director} onChange={(value) => patchItem(item.id, { stylist_creative_director: value })} />
                  <PortfolioTextField label="Location" value={item.location} onChange={(value) => patchItem(item.id, { location: value })} />
                  <label>
                    <span className="admin-field-label">Date</span>
                    <input type="date" value={item.project_date ?? ''} onChange={(event) => patchItem(item.id, { project_date: event.target.value || null })} className="admin-input text-sm" />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="admin-field-label">Additional credits</span>
                    <textarea value={item.additional_credits} onChange={(event) => patchItem(item.id, { additional_credits: event.target.value })} rows={3} className="admin-input resize-y text-sm" placeholder="Optional additional names or production credits" />
                  </label>
                  <div className="flex flex-wrap gap-5 text-sm text-ink/65 sm:col-span-2">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={item.featured} onChange={(event) => patchItem(item.id, { featured: event.target.checked })} /> Featured on homepage</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={item.published} onChange={(event) => patchItem(item.id, { published: event.target.checked })} /> Published</label>
                  </div>
                </div>

                <div className="flex gap-2 md:flex-col">
                  <button type="button" onClick={() => setPreviewId(item.id)} className="inline-flex min-h-10 items-center justify-center gap-2 border border-ink/15 px-4 text-xs uppercase tracking-[0.14em] hover:border-ink">
                    <Eye size={15} /> Preview
                  </button>
                  <button type="button" onClick={() => void saveItem(item)} disabled={busyId === item.id} className="inline-flex min-h-10 items-center justify-center gap-2 bg-ink px-4 text-xs uppercase tracking-[0.14em] text-ivory disabled:opacity-50">
                    {busyId === item.id ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />} Save
                  </button>
                  <button type="button" onClick={() => setDeleteCandidate(item)} disabled={busyId === item.id} className="inline-flex min-h-10 items-center justify-center gap-2 border border-ink/15 px-4 text-xs uppercase tracking-[0.14em] text-ink/55 hover:border-[#7f3d34] hover:text-[#7f3d34]">
                    <Trash2 size={15} /> Delete
                  </button>
                  <span className={`mt-1 text-center text-[0.65rem] uppercase tracking-[0.14em] md:mt-2 ${dirtyIds.has(item.id) ? 'text-[#7f3d34]' : item.published ? 'text-ink/55' : 'text-ink/30'}`}>{dirtyIds.has(item.id) ? 'Unsaved' : item.published ? 'Live' : 'Draft'}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete this image?"
        description={`“${deleteCandidate?.title || 'Untitled'}” will be removed from the portfolio and Storage. This cannot be undone.`}
        confirming={deleting}
        onCancel={() => !deleting && setDeleteCandidate(null)}
        onConfirm={() => void confirmDelete()}
      />

      <EditorPreviewModal open={Boolean(previewItem)} title={previewItem?.title || 'Portfolio image'} onClose={() => setPreviewId(null)}>
        {previewItem && <PortfolioAdminPreview item={previewItem} />}
      </EditorPreviewModal>
    </section>
  )
}

function PortfolioTextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="admin-field-label">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="admin-input text-sm" placeholder="Optional" />
    </label>
  )
}

function PortfolioAdminPreview({ item }: { item: PortfolioRecord }) {
  const preview = toGalleryItems([item])[0]
  return (
    <div className="grid min-h-full bg-ink text-ivory lg:grid-cols-[minmax(0,1.65fr)_minmax(21rem,0.65fr)]">
      <div className="flex min-h-[62svh] items-center justify-center px-6 py-14 sm:px-14 lg:min-h-full">
        <div className="max-h-[72svh] max-w-full overflow-hidden" style={{ aspectRatio: preview.aspectRatio, height: 'min(68svh, 800px)' }}>
          <PortfolioPlaceholder item={preview} priority className="object-contain" />
        </div>
      </div>
      <aside className="border-t border-ivory/15 px-6 py-10 sm:px-10 lg:flex lg:items-center lg:border-l lg:border-t-0">
        <PortfolioDetails item={preview} />
      </aside>
    </div>
  )
}
