import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, LoaderCircle, Mail, Save, Trash2, X } from 'lucide-react'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import { deleteInquiry, fetchAdminInquiries, updateInquiry } from '../../services/inquiryService'
import { inquiryStatuses, type BookingInquiry, type InquiryStatus } from '../../types/inquiries'

type Feedback = { type: 'success' | 'error'; message: string } | null
type SortMode = 'submitted_desc' | 'submitted_asc' | 'appointment_asc' | 'appointment_desc'

export function InquiriesPage() {
  const [items, setItems] = useState<BookingInquiry[]>([])
  const [baseline, setBaseline] = useState<BookingInquiry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all')
  const [sortMode, setSortMode] = useState<SortMode>('submitted_desc')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<BookingInquiry | null>(null)

  const dirty = JSON.stringify(items) !== JSON.stringify(baseline)
  useUnsavedChanges(dirty)

  const load = useCallback(async () => {
    try {
      const records = await fetchAdminInquiries()
      setItems(records)
      setBaseline(records)
      setSelectedId((current) => current && records.some((item) => item.id === current) ? current : records[0]?.id ?? null)
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Inquiries could not be loaded.' })
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const visible = useMemo(() => {
    const filtered = statusFilter === 'all' ? items : items.filter((item) => item.status === statusFilter)
    return [...filtered].sort((a, b) => compareInquiries(a, b, sortMode))
  }, [items, sortMode, statusFilter])

  const selected = items.find((item) => item.id === selectedId) ?? null
  const selectedBaseline = baseline.find((item) => item.id === selectedId) ?? null
  const selectedDirty = selected ? JSON.stringify(selected) !== JSON.stringify(selectedBaseline) : false
  const newCount = items.filter((item) => item.status === 'new').length

  useEffect(() => {
    if (selectedId && !visible.some((item) => item.id === selectedId)) setSelectedId(visible[0]?.id ?? null)
  }, [selectedId, visible])

  const patchSelected = (updates: Partial<BookingInquiry>) => {
    if (!selectedId) return
    setItems((current) => current.map((item) => item.id === selectedId ? { ...item, ...updates } : item))
  }

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    window.setTimeout(() => setFeedback((current) => current?.message === message ? null : current), 5000)
  }

  const saveSelected = async () => {
    if (!selected) return
    setBusy(true)
    try {
      const saved = await updateInquiry(selected.id, { status: selected.status, admin_notes: selected.admin_notes.trim() })
      setItems((current) => current.map((item) => item.id === saved.id ? saved : item))
      setBaseline((current) => current.map((item) => item.id === saved.id ? saved : item))
      showFeedback('success', 'Inquiry updated.')
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'The inquiry could not be updated.')
    } finally { setBusy(false) }
  }

  const cancelSelected = () => {
    if (!selectedBaseline) return
    setItems((current) => current.map((item) => item.id === selectedBaseline.id ? selectedBaseline : item))
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    setBusy(true)
    try {
      await deleteInquiry(deleteCandidate.id)
      const remaining = items.filter((item) => item.id !== deleteCandidate.id)
      setItems(remaining)
      setBaseline((current) => current.filter((item) => item.id !== deleteCandidate.id))
      if (selectedId === deleteCandidate.id) setSelectedId(remaining[0]?.id ?? null)
      setDeleteCandidate(null)
      showFeedback('success', 'Inquiry deleted permanently.')
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'The inquiry could not be deleted.')
    } finally { setBusy(false) }
  }

  if (loading) return <div className="grid min-h-[55vh] place-items-center"><LoaderCircle className="animate-spin text-ink/35" size={28} /><span className="sr-only">Loading inquiries</span></div>

  return (
    <section>
      <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="section-label mb-4">Client messages</p><h1 className="font-serif text-6xl leading-none tracking-[-0.04em] sm:text-7xl">Inquiries</h1><p className="mt-5 text-ink/50">{newCount} new · {items.length} total</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className="admin-field-label">Filter status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | InquiryStatus)} className="admin-input min-w-44 text-sm"><option value="all">All statuses</option>{inquiryStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
          <label><span className="admin-field-label">Sort by</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="admin-input min-w-48 text-sm"><option value="submitted_desc">Newest submitted</option><option value="submitted_asc">Oldest submitted</option><option value="appointment_asc">Appointment date · earliest</option><option value="appointment_desc">Appointment date · latest</option></select></label>
        </div>
      </div>

      {feedback && <div className={`mb-6 border-l-2 px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-ink bg-ivory text-ink/70' : 'border-[#7f3d34] bg-[#f3e8e4] text-[#7f3d34]'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <section className="max-h-[72vh] overflow-y-auto bg-ivory p-3 sm:p-4" aria-label="Booking inquiries">
          {visible.length === 0 ? <div className="grid min-h-72 place-items-center px-6 text-center"><div><Mail className="mx-auto text-ink/20" size={32} /><p className="mt-4 font-serif text-3xl">No matching inquiries</p></div></div> : (
            <div className="space-y-2">{visible.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full border-l-2 px-4 py-4 text-left ${selectedId === item.id ? 'border-ink bg-[#f3f0ea]' : 'border-transparent hover:bg-ink/[0.03]'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-serif text-2xl">{item.full_name}</h2><p className="mt-1 truncate text-sm text-ink/45">{item.service_name || 'General inquiry'}</p></div><StatusBadge status={item.status} /></div><div className="mt-4 flex items-center gap-2 text-xs text-ink/35"><CalendarDays size={14} />{item.preferred_date ? formatDate(item.preferred_date) : `Received ${formatDateTime(item.created_at)}`}</div></button>)}</div>
          )}
        </section>

        {selected ? <InquiryDetails inquiry={selected} dirty={selectedDirty} busy={busy} onChange={patchSelected} onSave={() => void saveSelected()} onCancel={cancelSelected} onDelete={() => setDeleteCandidate(selected)} /> : <section className="grid min-h-96 place-items-center bg-ivory p-8 text-center"><p className="font-serif text-4xl text-ink/55">Select an inquiry to view it.</p></section>}
      </div>

      <ConfirmDialog open={Boolean(deleteCandidate)} title="Delete this inquiry?" description={`The inquiry from “${deleteCandidate?.full_name}” and its private notes will be permanently deleted. This cannot be undone.`} confirming={busy} onCancel={() => !busy && setDeleteCandidate(null)} onConfirm={() => void confirmDelete()} />
    </section>
  )
}

function InquiryDetails({ inquiry, dirty, busy, onChange, onSave, onCancel, onDelete }: { inquiry: BookingInquiry; dirty: boolean; busy: boolean; onChange: (updates: Partial<BookingInquiry>) => void; onSave: () => void; onCancel: () => void; onDelete: () => void }) {
  return <article className="bg-ivory p-5 sm:p-8"><header className="flex flex-col gap-5 border-b border-ink/10 pb-7 sm:flex-row sm:items-start sm:justify-between"><div><p className="section-label mb-3">Received {formatDateTime(inquiry.created_at)}</p><h2 className="font-serif text-5xl leading-none">{inquiry.full_name}</h2><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm"><a href={`mailto:${inquiry.email}`} className="link-line">{inquiry.email}</a>{inquiry.phone && <a href={`tel:${inquiry.phone}`} className="link-line text-ink/55">{inquiry.phone}</a>}</div></div><label className="min-w-44"><span className="admin-field-label">Status</span><select value={inquiry.status} onChange={(event) => onChange({ status: event.target.value as InquiryStatus })} className="admin-input text-sm">{inquiryStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label></header>

    <dl className="grid gap-6 border-b border-ink/10 py-7 sm:grid-cols-3"><Detail label="Service" value={inquiry.service_name || 'General inquiry'} /><Detail label="Preferred date" value={inquiry.preferred_date ? formatDate(inquiry.preferred_date) : 'Not specified'} /><Detail label="Preferred time" value={inquiry.preferred_time ? inquiry.preferred_time.slice(0, 5) : 'Not specified'} />{inquiry.location && <Detail label="Location" value={inquiry.location} />}</dl>

    <section className="border-b border-ink/10 py-7"><p className="admin-field-label">Message</p><p className="whitespace-pre-wrap leading-relaxed text-ink/70">{inquiry.message || 'No additional details supplied.'}</p></section>

    <label className="block py-7"><span className="admin-field-label">Private admin notes</span><textarea value={inquiry.admin_notes} onChange={(event) => onChange({ admin_notes: event.target.value })} rows={6} maxLength={10000} className="admin-input resize-y leading-relaxed" placeholder="Only authorized administrators can see these notes." /></label>

    <footer className="flex flex-col gap-4 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={onDelete} disabled={busy} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#7f3d34]"><Trash2 size={15} /> Delete inquiry</button><div className="flex gap-2"><button type="button" onClick={onCancel} disabled={!dirty || busy} className="editor-action-secondary"><X size={15} /> Cancel</button><button type="button" onClick={onSave} disabled={!dirty || busy} className="editor-action-primary">{busy ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />} Save changes</button></div></footer>
  </article>
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="admin-field-label">{label}</dt><dd className="text-sm text-ink/70">{value}</dd></div>
}

function StatusBadge({ status }: { status: InquiryStatus }) {
  const label = inquiryStatuses.find((candidate) => candidate.value === status)?.label ?? status
  return <span className={`shrink-0 px-2 py-1 text-[0.58rem] uppercase tracking-[0.13em] ${status === 'new' ? 'bg-ink text-ivory' : 'bg-[#e4e0d9] text-ink/55'}`}>{label}</span>
}

function compareInquiries(a: BookingInquiry, b: BookingInquiry, mode: SortMode) {
  if (mode === 'submitted_asc') return a.created_at.localeCompare(b.created_at)
  if (mode === 'submitted_desc') return b.created_at.localeCompare(a.created_at)
  const aDate = a.preferred_date ?? (mode === 'appointment_asc' ? '9999-12-31' : '0000-01-01')
  const bDate = b.preferred_date ?? (mode === 'appointment_asc' ? '9999-12-31' : '0000-01-01')
  return mode === 'appointment_asc' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}
