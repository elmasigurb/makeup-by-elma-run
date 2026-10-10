import type { PortfolioGalleryItem, PortfolioPlaceholderTone, PortfolioRecord, PortfolioRecordInput } from '../types/content'
import { supabase } from '../lib/supabase'

const BUCKET = 'portfolio'
const ADMIN_SIGNED_URL_LIFETIME_SECONDS = 60 * 60
const PUBLIC_SIGNED_URL_LIFETIME_SECONDS = 60

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

async function addSignedUrls(
  rows: Omit<PortfolioRecord, 'signedUrl'>[],
  expiresIn = ADMIN_SIGNED_URL_LIFETIME_SECONDS,
): Promise<PortfolioRecord[]> {
  const client = getClient()

  return Promise.all(
    rows.map(async (row) => {
      const { data, error } = await client.storage
        .from(BUCKET)
        .createSignedUrl(row.image_path, expiresIn)

      return { ...row, signedUrl: error ? null : data.signedUrl }
    }),
  )
}

const columns = 'id,title,description,alt_text,category,image_path,display_order,featured,published,width,height,created_at,updated_at'

export async function fetchAdminPortfolio(): Promise<PortfolioRecord[]> {
  const client = getClient()
  const { data, error } = await client.from('portfolio_items').select(columns).order('display_order', { ascending: true })
  if (error) throw new Error(error.message)
  return addSignedUrls((data ?? []) as Omit<PortfolioRecord, 'signedUrl'>[])
}

export async function fetchPublishedPortfolio(featuredOnly = false): Promise<PortfolioRecord[]> {
  const client = getClient()
  let query = client
    .from('portfolio_items')
    .select(columns)
    .eq('published', true)
    .order('display_order', { ascending: true })

  if (featuredOnly) query = query.eq('featured', true).limit(3)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return addSignedUrls((data ?? []) as Omit<PortfolioRecord, 'signedUrl'>[], PUBLIC_SIGNED_URL_LIFETIME_SECONDS)
}

export function toGalleryItems(records: PortfolioRecord[]): PortfolioGalleryItem[] {
  const tones: PortfolioPlaceholderTone[] = ['mist', 'stone', 'pearl', 'warm']
  return records.map((record, index) => ({
    id: record.id,
    title: record.title || 'Untitled',
    description: record.description,
    category: record.category,
    order: record.display_order,
    imageUrl: record.signedUrl,
    alt: record.alt_text || record.title || 'Portfolio image',
    aspectRatio: record.width && record.height ? `${record.width} / ${record.height}` : '4 / 5',
    placeholderTone: tones[index % tones.length],
    width: record.width,
    height: record.height,
  }))
}

export async function uploadPortfolioImage(
  file: File,
  input: PortfolioRecordInput,
  onStage?: (stage: 'uploading' | 'saving') => void,
): Promise<PortfolioRecord> {
  const client = getClient()
  const imagePath = createImagePath(file)

  onStage?.('uploading')
  const { error: uploadError } = await client.storage.from(BUCKET).upload(imagePath, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw new Error(uploadError.message)

  onStage?.('saving')
  const { data, error: insertError } = await client
    .from('portfolio_items')
    .insert({ ...input, image_path: imagePath })
    .select(columns)
    .single()

  if (insertError) {
    await client.storage.from(BUCKET).remove([imagePath])
    throw new Error(insertError.message)
  }

  const [record] = await addSignedUrls([data as Omit<PortfolioRecord, 'signedUrl'>])
  return record
}

export async function updatePortfolioItem(
  id: string,
  updates: Partial<PortfolioRecordInput>,
): Promise<PortfolioRecord> {
  const client = getClient()
  const { data, error } = await client
    .from('portfolio_items')
    .update(updates)
    .eq('id', id)
    .select(columns)
    .single()

  if (error) throw new Error(error.message)
  const [record] = await addSignedUrls([data as Omit<PortfolioRecord, 'signedUrl'>])
  return record
}

export async function updatePortfolioOrder(items: PortfolioRecord[]): Promise<void> {
  const client = getClient()
  const results = await Promise.all(
    items.map((item, index) =>
      client.from('portfolio_items').update({ display_order: index }).eq('id', item.id),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw new Error(failed.error.message)
}

export async function replacePortfolioImage(
  record: PortfolioRecord,
  file: File,
  dimensions: { width: number | null; height: number | null },
): Promise<{ record: PortfolioRecord; warning: string | null }> {
  const client = getClient()
  const newPath = createImagePath(file)

  const { error: uploadError } = await client.storage.from(BUCKET).upload(newPath, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw new Error(uploadError.message)

  const { data, error: updateError } = await client
    .from('portfolio_items')
    .update({ image_path: newPath, width: dimensions.width, height: dimensions.height })
    .eq('id', record.id)
    .select(columns)
    .single()

  if (updateError) {
    await client.storage.from(BUCKET).remove([newPath])
    throw new Error(updateError.message)
  }

  const { error: removeError } = await client.storage.from(BUCKET).remove([record.image_path])
  const [updatedRecord] = await addSignedUrls([data as Omit<PortfolioRecord, 'signedUrl'>])
  return {
    record: updatedRecord,
    warning: removeError ? 'The image was replaced, but the old Storage object could not be removed.' : null,
  }
}

export async function deletePortfolioItem(record: PortfolioRecord): Promise<string | null> {
  const client = getClient()
  const { error: deleteError } = await client.from('portfolio_items').delete().eq('id', record.id)
  if (deleteError) throw new Error(deleteError.message)

  const { error: removeError } = await client.storage.from(BUCKET).remove([record.image_path])
  return removeError ? 'The database record was deleted, but the Storage object could not be removed.' : null
}

export async function readImageDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  try {
    const bitmap = await createImageBitmap(file)
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dimensions
  } catch {
    return { width: null, height: null }
  }
}

function createImagePath(file: File) {
  const extensionByType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  }
  const extension = extensionByType[file.type]
  if (!extension) throw new Error('Use a JPG, PNG, WebP, or AVIF image.')
  return `${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${extension}`
}
