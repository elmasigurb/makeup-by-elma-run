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

const legacyColumns = 'id,title,description,alt_text,category,image_path,display_order,featured,published,width,height,created_at,updated_at'
const columns = `${legacyColumns},subtitle,makeup_artist,photographer,model_name,hair_stylist,stylist_creative_director,location,project_date,additional_credits`

type PortfolioRow = Omit<PortfolioRecord, 'signedUrl'>

const emptyDetails = {
  subtitle: '',
  makeup_artist: '',
  photographer: '',
  model_name: '',
  hair_stylist: '',
  stylist_creative_director: '',
  location: '',
  project_date: null,
  additional_credits: '',
}

function normalizeRows(rows: unknown[]): PortfolioRow[] {
  return rows.map((row) => ({ ...emptyDetails, ...(row as PortfolioRow) }))
}

function isMissingPortfolioDetails(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return error.code === '42703' || error.code === 'PGRST204' || /subtitle|makeup_artist|model_name|project_date/.test(error.message ?? '')
}

async function selectPortfolioRows(publishedOnly: boolean, featuredOnly = false): Promise<PortfolioRow[]> {
  const client = getClient()
  const makeQuery = (selection: string) => {
    let query = client.from('portfolio_items').select(selection).order('display_order', { ascending: true })
    if (publishedOnly) query = query.eq('published', true)
    if (featuredOnly) query = query.eq('featured', true).limit(3)
    return query
  }

  const expanded = await makeQuery(columns)
  if (!expanded.error) return normalizeRows(expanded.data ?? [])
  if (!isMissingPortfolioDetails(expanded.error)) throw new Error(expanded.error.message)

  const legacy = await makeQuery(legacyColumns)
  if (legacy.error) throw new Error(legacy.error.message)
  return normalizeRows(legacy.data ?? [])
}

export async function fetchAdminPortfolio(): Promise<PortfolioRecord[]> {
  return addSignedUrls(await selectPortfolioRows(false))
}

export async function fetchPublishedPortfolio(featuredOnly = false): Promise<PortfolioRecord[]> {
  return addSignedUrls(await selectPortfolioRows(true, featuredOnly), PUBLIC_SIGNED_URL_LIFETIME_SECONDS)
}

export function toGalleryItems(records: PortfolioRecord[]): PortfolioGalleryItem[] {
  const tones: PortfolioPlaceholderTone[] = ['mist', 'stone', 'pearl', 'warm']
  return records.map((record, index) => ({
    id: record.id,
    title: record.title,
    subtitle: record.subtitle,
    description: record.description,
    makeupArtist: record.makeup_artist,
    photographer: record.photographer,
    model: record.model_name,
    hairStylist: record.hair_stylist,
    stylistCreativeDirector: record.stylist_creative_director,
    location: record.location,
    projectDate: record.project_date,
    additionalCredits: record.additional_credits,
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
  const includesDetails = hasPortfolioDetails(input)
  const insert = includesDetails ? input : toLegacyInput(input)
  const { data, error: insertError } = await client
    .from('portfolio_items')
    .insert({ ...insert, image_path: imagePath })
    .select(includesDetails ? columns : legacyColumns)
    .single()

  if (insertError) {
    await client.storage.from(BUCKET).remove([imagePath])
    throw new Error(insertError.message)
  }

  const [record] = await addSignedUrls(normalizeRows([data]))
  return record
}

export async function updatePortfolioItem(
  id: string,
  updates: Partial<PortfolioRecordInput>,
): Promise<PortfolioRecord> {
  const client = getClient()
  let { data, error } = await client
    .from('portfolio_items')
    .update(updates)
    .eq('id', id)
    .select(columns)
    .single()

  if (error && isMissingPortfolioDetails(error) && !hasPortfolioDetails(updates)) {
    const legacy = await client
      .from('portfolio_items')
      .update(toLegacyInput(updates))
      .eq('id', id)
      .select(legacyColumns)
      .single()
    data = legacy.data ? ({ ...emptyDetails, ...legacy.data } as typeof data) : null
    error = legacy.error
  }
  if (error) throw new Error(error.message)
  const [record] = await addSignedUrls([data as Omit<PortfolioRecord, 'signedUrl'>])
  return record
}

function hasPortfolioDetails(input: Partial<PortfolioRecordInput>) {
  return Boolean(
    input.subtitle?.trim()
    || input.makeup_artist?.trim()
    || input.photographer?.trim()
    || input.model_name?.trim()
    || input.hair_stylist?.trim()
    || input.stylist_creative_director?.trim()
    || input.location?.trim()
    || input.project_date
    || input.additional_credits?.trim(),
  )
}

function toLegacyInput(input: Partial<PortfolioRecordInput>) {
  const {
    subtitle: _subtitle,
    makeup_artist: _makeupArtist,
    photographer: _photographer,
    model_name: _model,
    hair_stylist: _hairStylist,
    stylist_creative_director: _stylist,
    location: _location,
    project_date: _projectDate,
    additional_credits: _additionalCredits,
    ...legacy
  } = input
  return legacy
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
    .select(legacyColumns)
    .single()

  if (updateError) {
    await client.storage.from(BUCKET).remove([newPath])
    throw new Error(updateError.message)
  }

  const { error: removeError } = await client.storage.from(BUCKET).remove([record.image_path])
  const [updatedRecord] = await addSignedUrls(normalizeRows([data]))
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
