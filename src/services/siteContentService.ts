import { supabase } from '../lib/supabase'
import type { AdminContentState, SiteImageReference } from '../types/siteContent'

const SITE_ASSETS_BUCKET = 'site-assets'
const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export async function fetchAdminSiteContent<T>(sectionKey: string, defaults: T): Promise<AdminContentState<T>> {
  const client = getClient()
  const [{ data: page, error: pageError }, { data: draft, error: draftError }] = await Promise.all([
    client.from('site_content').select('content,published').eq('section_key', sectionKey).single(),
    client.from('site_content_drafts').select('content').eq('section_key', sectionKey).maybeSingle(),
  ])

  if (pageError) throw new Error(pageError.message)
  if (draftError) throw new Error(draftError.message)

  const publishedContent = page.published ? mergeDefaults(defaults, page.content as Partial<T>) : null
  const draftSource = draft?.content && Object.keys(draft.content as object).length > 0
    ? draft.content as Partial<T>
    : page.content as Partial<T>

  return {
    draft: mergeDefaults(defaults, draftSource),
    published: publishedContent,
    isPublished: Boolean(page.published),
  }
}

export async function fetchPublishedSiteContent<T>(sectionKey: string, defaults: T): Promise<T | null> {
  const client = getClient()
  const { data, error } = await client
    .from('site_content')
    .select('content')
    .eq('section_key', sectionKey)
    .eq('published', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mergeDefaults(defaults, data.content as Partial<T>) : null
}

export async function saveSiteContentDraft<T>(sectionKey: string, content: T): Promise<void> {
  const client = getClient()
  const { error } = await client.from('site_content_drafts').upsert({ section_key: sectionKey, content }, { onConflict: 'section_key' })
  if (error) throw new Error(error.message)
}

export async function publishSiteContent<T>(sectionKey: string, content: T): Promise<void> {
  const client = getClient()
  await saveSiteContentDraft(sectionKey, content)
  const { error } = await client.rpc('publish_site_content', { p_section_key: sectionKey })
  if (error) throw new Error(error.message)
}

export async function uploadSiteAsset(file: File): Promise<{ reference: SiteImageReference; signedUrl: string }> {
  if (!supportedTypes.includes(file.type)) throw new Error('Use a JPG, PNG, WebP, or AVIF image.')
  if (file.size > 15 * 1024 * 1024) throw new Error('Images must be 15 MB or smaller.')

  const client = getClient()
  const extension: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }
  const path = `${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${extension[file.type]}`

  const { error: uploadError } = await client.storage.from(SITE_ASSETS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw new Error(uploadError.message)

  const { data, error: signError } = await client.storage.from(SITE_ASSETS_BUCKET).createSignedUrl(path, 60 * 60)
  if (signError) throw new Error(signError.message)
  return { reference: { source: 'upload', path }, signedUrl: data.signedUrl }
}

export async function getSiteAssetUrl(reference: SiteImageReference | null, publicAccess = false): Promise<string | null> {
  if (!reference || reference.source !== 'upload') return null
  const client = getClient()
  const { data, error } = await client.storage.from(SITE_ASSETS_BUCKET).createSignedUrl(reference.path, publicAccess ? 60 : 60 * 60)
  if (error) return null
  return data.signedUrl
}

function mergeDefaults<T>(defaults: T, value?: Partial<T>): T {
  if (!value) return structuredClone(defaults)
  const merged = { ...structuredClone(defaults), ...value } as Record<string, unknown>
  const defaultRecord = defaults as Record<string, unknown>
  const valueRecord = value as Record<string, unknown>
  if ('primaryButton' in defaultRecord) merged.primaryButton = { ...defaultRecord.primaryButton as object, ...valueRecord.primaryButton as object | undefined }
  if ('bookingButton' in defaultRecord) merged.bookingButton = { ...defaultRecord.bookingButton as object, ...valueRecord.bookingButton as object | undefined }
  return merged as T
}
