import { useEffect, useRef } from 'react'
import { Bold, Italic, List } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  label: string
}

export function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value
  }, [value])

  const runCommand = (command: string) => {
    editorRef.current?.focus()
    document.execCommand(command)
    onChange(editorRef.current?.innerHTML ?? '')
  }

  return (
    <div>
      <span className="admin-field-label">{label}</span>
      <div className="border border-ink/15 bg-white/40">
        <div className="flex gap-1 border-b border-ink/10 p-2" aria-label={`${label} formatting tools`}>
          <ToolbarButton label="Bold" onClick={() => runCommand('bold')}><Bold size={16} /></ToolbarButton>
          <ToolbarButton label="Italic" onClick={() => runCommand('italic')}><Italic size={16} /></ToolbarButton>
          <ToolbarButton label="Bulleted list" onClick={() => runCommand('insertUnorderedList')}><List size={16} /></ToolbarButton>
        </div>
        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-label={label}
          aria-multiline="true"
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          className="rich-editor min-h-44 px-4 py-3 text-base leading-relaxed outline-none"
        />
      </div>
    </div>
  )
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="grid size-9 place-items-center text-ink/55 hover:bg-ink/5 hover:text-ink">{children}</button>
}
