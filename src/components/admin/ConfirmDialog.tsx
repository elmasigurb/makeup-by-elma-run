import { X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirming?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ open, title, description, confirming = false, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/50 px-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="w-full max-w-lg bg-ivory p-7 shadow-2xl sm:p-9" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="section-label mb-4">Please confirm</p>
            <h2 id="confirm-title" className="font-serif text-4xl leading-none">{title}</h2>
          </div>
          <button type="button" onClick={onCancel} disabled={confirming} className="grid size-10 place-items-center" aria-label="Close confirmation">
            <X size={21} strokeWidth={1.4} />
          </button>
        </div>
        <p id="confirm-description" className="mt-6 leading-relaxed text-ink/60">{description}</p>
        <div className="mt-9 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={confirming} className="min-h-11 px-5 text-xs uppercase tracking-[0.16em] text-ink/55 hover:text-ink">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={confirming} className="min-h-11 bg-ink px-5 text-xs uppercase tracking-[0.16em] text-ivory disabled:opacity-50">
            {confirming ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </section>
    </div>
  )
}
