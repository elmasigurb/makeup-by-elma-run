import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react'
import { ArrowDown, ArrowUp, Eye, GripVertical, LoaderCircle, Plus, Save, Trash2, X } from 'lucide-react'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { EditorPreviewModal } from '../../components/admin/editor/EditorPreviewModal'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import {
  createService,
  deleteService,
  fetchAdminServices,
  formatServicePrice,
  isValidBookingUrl,
  updateService,
  updateServiceOrder,
} from '../../services/servicesService'
import type { ServiceRecord, ServiceRecordInput } from '../../types/services'

type Feedback = { type: 'success' | 'error'; message: string } | null

export function ServicesEditorPage() {
  const [items, setItems] = useState<ServiceRecord[]>([])
  const [baseline, setBaseline] = useState<ServiceRecord[]>([])
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<ServiceRecord | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const dirty = JSON.stringify(items) !== JSON.stringify(baseline)
  useUnsavedChanges(dirty)

  const loadItems = useCallback(async () => {
    try {
      const records = await fetchAdminServices()
      setItems(records)
      setBaseline(records)
      setSelectedId((current) => current && records.some((item) => item.id === current) ? current : records[0]?.id ?? null)
      setNewIds(new Set())
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Services could not be loaded.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadItems() }, [loadItems])

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId])
  const selectedBaseline = useMemo(() => baseline.find((item) => item.id === selectedId) ?? null, [baseline, selectedId])
  const selectedDirty = selected ? JSON.stringify(selected) !== JSON.stringify(selectedBaseline) : false

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    window.setTimeout(() => setFeedback((current) => current?.message === message ? null : current), 5000)
  }

  const patchSelected = (updates: Partial<ServiceRecord>) => {
    if (!selectedId) return
    setItems((current) => current.map((item) => item.id === selectedId ? { ...item, ...updates } : item))
  }

  const addService = () => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const service: ServiceRecord = {
      id,
      title: '',
      description: '',
      detailed_description: '',
      price_text: 'Price upon request',
      price_isk: null,
      price_on_request: true,
      duration_minutes: null,
      category: '',
      booking_button_text: '',
      booking_url: '',
      display_order: items.length,
      published: false,
      created_at: now,
      updated_at: now,
    }
    setItems((current) => [...current, service])
    setNewIds((current) => new Set(current).add(id))
    setSelectedId(id)
  }

  const cancelChanges = () => {
    if (!selected) return
    if (newIds.has(selected.id)) {
      setItems((current) => current.filter((item) => item.id !== selected.id).map((item, index) => ({ ...item, display_order: index })))
      setNewIds((current) => { const next = new Set(current); next.delete(selected.id); return next })
      setSelectedId(items.find((item) => item.id !== selected.id)?.id ?? null)
      return
    }
    if (selectedBaseline) setItems((current) => current.map((item) => item.id === selected.id ? selectedBaseline : item))
  }

  const saveSelected = async () => {
    if (!selected) return
    const validation = validateService(selected)
    if (validation) {
      showFeedback('error', validation)
      return
    }

    setBusy(true)
    try {
      const input = toInput(selected)
      const saved = newIds.has(selected.id)
        ? await createService(selected.id, input)
        : await updateService(selected.id, input)
      setItems((current) => current.map((item) => item.id === saved.id ? saved : item))
      setBaseline((current) => current.some((item) => item.id === saved.id)
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved].sort((a, b) => a.display_order - b.display_order))
      setNewIds((current) => { const next = new Set(current); next.delete(saved.id); return next })
      showFeedback('success', `“${saved.title}” was saved${saved.published ? ' and is live' : ' as a draft'}.`)
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'The service could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const persistOrder = async (next: ServiceRecord[]) => {
    if (newIds.size > 0) {
      showFeedback('error', 'Save or cancel the new service before reordering.')
      return
    }
    const previous = items
    const ordered = next.map((item, index) => ({ ...item, display_order: index }))
    setItems(ordered)
    setSavingOrder(true)
    try {
      await updateServiceOrder(ordered)
      setBaseline((current) => ordered.map((item) => ({
        ...(current.find((candidate) => candidate.id === item.id) ?? item),
        display_order: item.display_order,
      })))
      showFeedback('success', 'Service order saved.')
    } catch (error) {
      setItems(previous)
      showFeedback('error', error instanceof Error ? error.message : 'The service order could not be saved.')
    } finally {
      setSavingOrder(false)
    }
  }

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to || savingOrder) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    void persistOrder(next)
  }

  const dropItem = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault()
    if (!draggedId || draggedId === targetId) return
    const from = items.findIndex((item) => item.id === draggedId)
    const to = items.findIndex((item) => item.id === targetId)
    setDraggedId(null)
    moveItem(from, to)
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    setBusy(true)
    try {
      if (!newIds.has(deleteCandidate.id)) await deleteService(deleteCandidate.id)
      const remaining = items.filter((item) => item.id !== deleteCandidate.id).map((item, index) => ({ ...item, display_order: index }))
      setItems(remaining)
      setBaseline((current) => current.filter((item) => item.id !== deleteCandidate.id).map((item, index) => ({ ...item, display_order: index })))
      setNewIds((current) => { const next = new Set(current); next.delete(deleteCandidate.id); return next })
      if (!newIds.has(deleteCandidate.id) && remaining.length) await updateServiceOrder(remaining)
      if (selectedId === deleteCandidate.id) setSelectedId(remaining[0]?.id ?? null)
      setDeleteCandidate(null)
      showFeedback('success', 'Service deleted.')
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'The service could not be deleted.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="grid min-h-[55vh] place-items-center"><LoaderCircle className="animate-spin text-ink/35" size={28} /><span className="sr-only">Loading services</span></div>

  return (
    <section>
      <div className="mb-9 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-4">Services manager</p>
          <h1 className="font-serif text-6xl leading-none tracking-[-0.04em] sm:text-7xl">Services & pricing</h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-ink/55">Create, arrange and publish your booking options. Unpublished services remain private.</p>
        </div>
        <button type="button" onClick={addService} className="editor-action-primary shrink-0"><Plus size={16} /> Add service</button>
      </div>

      {feedback && <div className={`mb-6 border-l-2 px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-ink bg-ivory text-ink/70' : 'border-[#7f3d34] bg-[#f3e8e4] text-[#7f3d34]'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="bg-ivory p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="font-serif text-3xl">Display order</h2><p className="mt-1 text-sm text-ink/40">Drag services into position.</p></div>
            {savingOrder && <LoaderCircle className="animate-spin text-ink/35" size={18} />}
          </div>

          {items.length === 0 ? (
            <div className="border-t border-ink/10 py-16 text-center text-sm text-ink/45">No services have been added.</div>
          ) : <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable={!newIds.has(item.id) && !savingOrder}
                onDragStart={() => setDraggedId(item.id)}
                onDragEnd={() => setDraggedId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => dropItem(event, item.id)}
                className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-3 text-left transition-colors ${selectedId === item.id ? 'bg-ink text-ivory' : 'bg-[#f3f0ea] hover:bg-ink/5'} ${draggedId === item.id ? 'opacity-40' : ''}`}
              >
                <GripVertical size={18} className={selectedId === item.id ? 'text-ivory/45' : 'text-ink/30'} />
                <button type="button" onClick={() => setSelectedId(item.id)} className="min-w-0 text-left"><span className="block truncate font-serif text-xl">{item.title || 'Untitled service'}</span><span className={`mt-0.5 block text-[0.62rem] uppercase tracking-[0.15em] ${selectedId === item.id ? 'text-ivory/50' : 'text-ink/35'}`}>{newIds.has(item.id) ? 'Unsaved' : item.published ? 'Published' : 'Draft'}</span></button>
                <span className="flex items-center">
                  <button type="button" onClick={() => moveItem(index, index - 1)} disabled={index === 0 || savingOrder} className="grid size-8 place-items-center disabled:opacity-20" aria-label={`Move ${item.title || 'service'} up`}><ArrowUp size={15} /></button>
                  <button type="button" onClick={() => moveItem(index, index + 1)} disabled={index === items.length - 1 || savingOrder} className="grid size-8 place-items-center disabled:opacity-20" aria-label={`Move ${item.title || 'service'} down`}><ArrowDown size={15} /></button>
                </span>
              </div>
            ))}
          </div>}
        </section>

        {selected ? (
          <ServiceForm
            service={selected}
            busy={busy}
            dirty={selectedDirty}
            onChange={patchSelected}
            onSave={() => void saveSelected()}
            onCancel={cancelChanges}
            onPreview={() => setPreviewOpen(true)}
            onDelete={() => setDeleteCandidate(selected)}
          />
        ) : (
          <section className="grid min-h-96 place-items-center bg-ivory p-8 text-center"><div><h2 className="font-serif text-4xl">Add your first service</h2><p className="mt-3 text-sm text-ink/45">No prices or descriptions will be added automatically.</p></div></section>
        )}
      </div>

      <EditorPreviewModal open={previewOpen} title="Service preview" onClose={() => setPreviewOpen(false)}>
        {selected && <ServicePreview service={selected} />}
      </EditorPreviewModal>

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        title="Delete this service?"
        description={`“${deleteCandidate?.title || 'Untitled service'}” will be permanently removed. This cannot be undone.`}
        confirming={busy}
        onCancel={() => !busy && setDeleteCandidate(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  )
}

function ServiceForm({ service, busy, dirty, onChange, onSave, onCancel, onPreview, onDelete }: {
  service: ServiceRecord
  busy: boolean
  dirty: boolean
  onChange: (updates: Partial<ServiceRecord>) => void
  onSave: () => void
  onCancel: () => void
  onPreview: () => void
  onDelete: () => void
}) {
  return (
    <section className="bg-ivory p-5 sm:p-7">
      <div className="mb-8 flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="section-label mb-2">Service details</p><h2 className="font-serif text-4xl">{service.title || 'Untitled service'}</h2></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onPreview} className="editor-action-secondary"><Eye size={15} /> Preview</button>
          <button type="button" onClick={onCancel} disabled={!dirty || busy} className="editor-action-secondary"><X size={15} /> Cancel</button>
          <button type="button" onClick={onSave} disabled={!dirty || busy} className="editor-action-primary">{busy ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />} Save</button>
        </div>
      </div>

      <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
        <Field label="Service name" value={service.title} onChange={(value) => onChange({ title: value })} className="sm:col-span-2" required />
        <Field label="Category" value={service.category} onChange={(value) => onChange({ category: value })} placeholder="Optional category" />
        <label><span className="admin-field-label">Duration in minutes</span><input type="number" min="1" step="1" value={service.duration_minutes ?? ''} onChange={(event) => onChange({ duration_minutes: nullableNumber(event.target.value) })} className="admin-input" placeholder="Optional" /></label>
        <label className="sm:col-span-2"><span className="admin-field-label">Short description</span><textarea value={service.description} onChange={(event) => onChange({ description: event.target.value })} rows={3} className="admin-input resize-y leading-relaxed" /></label>
        <label className="sm:col-span-2"><span className="admin-field-label">Detailed description</span><textarea value={service.detailed_description} onChange={(event) => onChange({ detailed_description: event.target.value })} rows={5} className="admin-input resize-y leading-relaxed" placeholder="Optional additional details" /></label>

        <fieldset className="border-t border-ink/10 pt-6 sm:col-span-2">
          <legend className="admin-field-label">Pricing</legend>
          <div className="flex flex-wrap gap-6 text-sm text-ink/65">
            <label className="flex items-center gap-2"><input type="radio" name={`price-${service.id}`} checked={!service.price_on_request} onChange={() => onChange({ price_on_request: false })} /> Fixed price</label>
            <label className="flex items-center gap-2"><input type="radio" name={`price-${service.id}`} checked={service.price_on_request} onChange={() => onChange({ price_on_request: true })} /> Price upon request</label>
          </div>
          {!service.price_on_request && <label className="mt-5 block max-w-xs"><span className="admin-field-label">Price in ISK</span><input type="number" min="0" step="1" value={service.price_isk ?? ''} onChange={(event) => onChange({ price_isk: nullableNumber(event.target.value) })} className="admin-input" inputMode="numeric" placeholder="Enter amount" /></label>}
        </fieldset>

        <Field label="Booking button text" value={service.booking_button_text} onChange={(value) => onChange({ booking_button_text: value })} placeholder="Shown only with a valid URL" />
        <Field label="Booking URL" value={service.booking_url} onChange={(value) => onChange({ booking_url: value })} placeholder="/contact or https://…" />

        <div className="flex flex-wrap gap-6 border-t border-ink/10 pt-6 text-sm text-ink/65 sm:col-span-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={service.published} onChange={(event) => onChange({ published: event.target.checked })} /> Published on the website</label>
          <span className={`text-xs uppercase tracking-[0.15em] ${service.published ? 'text-ink/60' : 'text-ink/35'}`}>{service.published ? 'Will be public after saving' : 'Draft · admin only'}</span>
        </div>
      </div>

      <div className="mt-9 flex justify-end border-t border-ink/10 pt-6">
        <button type="button" onClick={onDelete} disabled={busy} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#7f3d34]"><Trash2 size={15} /> Delete service</button>
      </div>
    </section>
  )
}

function Field({ label, value, onChange, placeholder, className = '', required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; className?: string; required?: boolean }) {
  return <label className={className}><span className="admin-field-label">{label}{required ? ' *' : ''}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="admin-input" /></label>
}

function ServicePreview({ service }: { service: ServiceRecord }) {
  const bookingVisible = isValidBookingUrl(service.booking_url) && service.booking_button_text.trim()
  return <div className="min-h-full bg-ivory px-6 py-16 sm:px-12"><p className="section-label mb-5">Services & pricing</p><article className="grid gap-8 border-y border-ink/15 py-12 md:grid-cols-[0.9fr_1.5fr_0.65fr]"><div>{service.category && <p className="mb-3 text-xs uppercase tracking-[0.18em] text-ink/40">{service.category}</p>}<h2 className="font-serif text-5xl leading-none">{service.title || 'Untitled service'}</h2>{service.duration_minutes && <p className="mt-4 text-sm text-ink/45">{service.duration_minutes} min</p>}</div><div className="space-y-4 text-ink/60"><p className="leading-relaxed">{service.description || 'No short description added.'}</p>{service.detailed_description && <p className="whitespace-pre-line text-sm leading-relaxed">{service.detailed_description}</p>}</div><div><p className="text-sm text-ink/70">{formatServicePrice(service)}</p>{bookingVisible && <span className="link-line mt-6 inline-block text-xs uppercase tracking-[0.18em]">{service.booking_button_text}</span>}</div></article></div>
}

function nullableNumber(value: string) {
  if (value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? Math.round(number) : null
}

function validateService(service: ServiceRecord) {
  if (!service.title.trim()) return 'Add a service name before saving.'
  if (!service.price_on_request && service.price_isk === null) return 'Enter a fixed ISK price or choose “Price upon request”.'
  if (service.price_isk !== null && service.price_isk < 0) return 'The service price cannot be negative.'
  if (service.duration_minutes !== null && service.duration_minutes <= 0) return 'Duration must be greater than zero.'
  if (service.booking_url.trim() && !isValidBookingUrl(service.booking_url)) return 'Enter a valid booking URL, such as /contact or https://example.com.'
  if (service.booking_url.trim() && !service.booking_button_text.trim()) return 'Add booking button text for the booking URL.'
  return null
}

function toInput(service: ServiceRecord): ServiceRecordInput {
  return {
    title: service.title.trim(),
    description: service.description.trim(),
    detailed_description: service.detailed_description.trim(),
    price_text: formatServicePrice(service),
    price_isk: service.price_on_request ? null : service.price_isk,
    price_on_request: service.price_on_request,
    duration_minutes: service.duration_minutes,
    category: service.category.trim(),
    booking_button_text: service.booking_button_text.trim(),
    booking_url: service.booking_url.trim(),
    display_order: service.display_order,
    published: service.published,
  }
}
