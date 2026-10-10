import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { UploadCloud, X } from 'lucide-react'
import { portfolioCategories, type PortfolioCategory } from '../../../types/content'
import { readImageDimensions, uploadPortfolioImage } from '../../../services/portfolioService'

type UploadStatus = 'ready' | 'uploading' | 'saving' | 'done' | 'error'

interface PendingImage {
  id: string
  file: File
  previewUrl: string
  title: string
  description: string
  category: PortfolioCategory
  featured: boolean
  published: boolean
  width: number | null
  height: number | null
  status: UploadStatus
  error: string | null
}

interface PortfolioUploadPanelProps {
  nextOrder: number
  onUploaded: () => Promise<void>
  onMessage: (message: string, type: 'success' | 'error') => void
}

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const maximumFileSize = 15 * 1024 * 1024

export function PortfolioUploadPanel({ nextOrder, onUploaded, onMessage }: PortfolioUploadPanelProps) {
  const [pending, setPending] = useState<PendingImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [batchTotal, setBatchTotal] = useState(0)
  const previewUrls = useRef(new Set<string>())

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url))
    previewUrls.current.clear()
  }, [])

  const selectFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return

    const validFiles = files.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        onMessage(`${file.name} is not a supported image format.`, 'error')
        return false
      }
      if (file.size > maximumFileSize) {
        onMessage(`${file.name} is larger than the 15 MB Storage limit.`, 'error')
        return false
      }
      return true
    })

    const additions = await Promise.all(validFiles.map(async (file) => {
      const previewUrl = URL.createObjectURL(file)
      previewUrls.current.add(previewUrl)
      const dimensions = await readImageDimensions(file)
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl,
        title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        description: '',
        category: 'Bridal' as PortfolioCategory,
        featured: false,
        published: false,
        ...dimensions,
        status: 'ready' as UploadStatus,
        error: null,
      }
    }))

    setPending((current) => [...current, ...additions])
  }

  const patchPending = (id: string, updates: Partial<PendingImage>) => {
    setPending((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item))
  }

  const removePending = (item: PendingImage) => {
    URL.revokeObjectURL(item.previewUrl)
    previewUrls.current.delete(item.previewUrl)
    setPending((current) => current.filter((candidate) => candidate.id !== item.id))
  }

  const uploadAll = async () => {
    const ready = pending.filter((item) => item.status === 'ready' || item.status === 'error')
    if (!ready.length) return

    setUploading(true)
    setCompleted(0)
    setBatchTotal(ready.length)
    let successes = 0

    for (const [index, item] of ready.entries()) {
      patchPending(item.id, { status: 'uploading', error: null })
      try {
        await uploadPortfolioImage(item.file, {
          title: item.title.trim() || 'Untitled',
          description: item.description.trim(),
          alt_text: item.title.trim() || 'Portfolio image',
          category: item.category,
          display_order: nextOrder + index,
          featured: item.featured,
          published: item.published,
          width: item.width,
          height: item.height,
        }, (stage) => patchPending(item.id, { status: stage }))
        patchPending(item.id, { status: 'done' })
        successes += 1
      } catch (error) {
        patchPending(item.id, { status: 'error', error: error instanceof Error ? error.message : 'Upload failed.' })
      }
      setCompleted(index + 1)
    }

    setUploading(false)
    if (successes) {
      await onUploaded()
      onMessage(`${successes} ${successes === 1 ? 'image was' : 'images were'} uploaded successfully.`, 'success')
    }
    if (successes !== ready.length) onMessage('Some images could not be uploaded. Review the messages below and retry.', 'error')
  }

  const clearCompleted = () => {
    pending.filter((item) => item.status === 'done').forEach((item) => {
      URL.revokeObjectURL(item.previewUrl)
      previewUrls.current.delete(item.previewUrl)
    })
    setPending((current) => current.filter((item) => item.status !== 'done'))
    setCompleted(0)
    setBatchTotal(0)
  }

  const progress = batchTotal ? Math.round((completed / batchTotal) * 100) : 0

  return (
    <section className="bg-ivory p-5 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-3">New work</p>
          <h2 className="font-serif text-4xl">Upload images</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/50">JPG, PNG, WebP or AVIF · up to 15 MB each</p>
        </div>
        <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 border border-ink px-5 text-xs uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-ivory">
          <UploadCloud size={17} strokeWidth={1.5} /> Choose images
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={selectFiles} className="sr-only" />
        </label>
      </div>

      {pending.length > 0 && (
        <div className="mt-8">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pending.map((item) => (
              <article key={item.id} className="border border-ink/10 bg-[#f7f4ef]">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#deddd9]">
                  <img src={item.previewUrl} alt="Selected upload preview" className="h-full w-full object-cover" />
                  {!uploading && item.status !== 'done' && (
                    <button type="button" onClick={() => removePending(item)} className="absolute right-2 top-2 grid size-9 place-items-center bg-ivory/90" aria-label={`Remove ${item.file.name}`}>
                      <X size={18} strokeWidth={1.5} />
                    </button>
                  )}
                  <span className="absolute bottom-2 left-2 bg-ink/80 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-white">
                    {item.status === 'ready' ? 'Ready' : item.status === 'uploading' ? 'Uploading' : item.status === 'saving' ? 'Saving' : item.status === 'done' ? 'Uploaded' : 'Try again'}
                  </span>
                </div>
                <div className="space-y-4 p-4">
                  <input value={item.title} onChange={(event) => patchPending(item.id, { title: event.target.value })} disabled={uploading || item.status === 'done'} aria-label="Image title" placeholder="Image title" className="w-full border-0 border-b border-ink/20 bg-transparent px-0 py-2 font-serif text-2xl outline-none focus:border-ink" />
                  <textarea value={item.description} onChange={(event) => patchPending(item.id, { description: event.target.value })} disabled={uploading || item.status === 'done'} aria-label="Image description" placeholder="Short description (optional)" rows={2} className="w-full resize-none border-0 border-b border-ink/20 bg-transparent px-0 py-2 text-sm outline-none focus:border-ink" />
                  <select value={item.category} onChange={(event) => patchPending(item.id, { category: event.target.value as PortfolioCategory })} disabled={uploading || item.status === 'done'} aria-label="Portfolio category" className="w-full border border-ink/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-ink">
                    {portfolioCategories.map((category) => <option key={category}>{category}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-5 text-sm text-ink/65">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={item.featured} onChange={(event) => patchPending(item.id, { featured: event.target.checked })} disabled={uploading || item.status === 'done'} /> Featured</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={item.published} onChange={(event) => patchPending(item.id, { published: event.target.checked })} disabled={uploading || item.status === 'done'} /> Publish now</label>
                  </div>
                  {item.error && <p className="text-sm leading-relaxed text-[#7f3d34]" role="alert">{item.error}</p>}
                </div>
              </article>
            ))}
          </div>

          {uploading && (
            <div className="mt-7" aria-live="polite">
              <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.15em] text-ink/45"><span>Uploading batch</span><span>{progress}%</span></div>
              <div className="h-1.5 overflow-hidden bg-ink/10"><div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap justify-end gap-3">
            {pending.some((item) => item.status === 'done') && !uploading && <button type="button" onClick={clearCompleted} className="min-h-11 px-5 text-xs uppercase tracking-[0.16em] text-ink/55">Clear completed</button>}
            <button type="button" onClick={uploadAll} disabled={uploading || !pending.some((item) => item.status === 'ready' || item.status === 'error')} className="min-h-11 bg-ink px-6 text-xs uppercase tracking-[0.16em] text-ivory disabled:cursor-not-allowed disabled:opacity-40">
              {uploading ? 'Uploading…' : `Upload ${pending.filter((item) => item.status === 'ready' || item.status === 'error').length || ''} images`}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
