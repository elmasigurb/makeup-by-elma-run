import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function EditorPreviewModal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] bg-ink/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`${title} preview`}>
      <div className="mx-auto flex h-full max-w-[1500px] flex-col overflow-hidden bg-ivory shadow-2xl">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink/10 px-5 sm:px-7">
          <div><span className="text-xs uppercase tracking-[0.18em] text-ink/40">Preview</span><span className="ml-4 font-serif text-xl">{title}</span></div>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center" aria-label="Close preview"><X size={22} strokeWidth={1.4} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
