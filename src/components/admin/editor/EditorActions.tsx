import { Eye, LoaderCircle, Send, Save } from 'lucide-react'

interface EditorActionsProps {
  busy: boolean
  dirty: boolean
  published: boolean
  onSave: () => void
  onPreview: () => void
  onPublish: () => void
}

export function EditorActions({ busy, dirty, published, onSave, onPreview, onPublish }: EditorActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`mr-2 text-[0.68rem] uppercase tracking-[0.15em] ${dirty ? 'text-[#8a5b31]' : 'text-ink/35'}`}>{dirty ? 'Unsaved changes' : published ? 'Published' : 'Draft'}</span>
      <button type="button" onClick={onPreview} disabled={busy} className="editor-action-secondary"><Eye size={15} /> Preview</button>
      <button type="button" onClick={onSave} disabled={busy || !dirty} className="editor-action-secondary">{busy ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />} Save draft</button>
      <button type="button" onClick={onPublish} disabled={busy} className="editor-action-primary">{busy ? <LoaderCircle className="animate-spin" size={15} /> : <Send size={15} />} Publish</button>
    </div>
  )
}
