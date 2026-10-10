import { supabase } from '../lib/supabase'
import type { ServiceRecord, ServiceRecordInput } from '../types/services'

const columns = 'id,title,description,detailed_description,price_text,price_isk,price_on_request,duration_minutes,category,booking_button_text,booking_url,display_order,published,created_at,updated_at'

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export async function fetchAdminServices(): Promise<ServiceRecord[]> {
  const { data, error } = await getClient().from('services').select(columns).order('display_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as ServiceRecord[]
}

export async function fetchPublishedServices(): Promise<ServiceRecord[]> {
  const { data, error } = await getClient().from('services').select(columns).eq('published', true).order('display_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as ServiceRecord[]
}

export async function createService(id: string, input: ServiceRecordInput): Promise<ServiceRecord> {
  const { data, error } = await getClient().from('services').insert({ id, ...input }).select(columns).single()
  if (error) throw new Error(error.message)
  return data as ServiceRecord
}

export async function updateService(id: string, input: ServiceRecordInput): Promise<ServiceRecord> {
  const { data, error } = await getClient().from('services').update(input).eq('id', id).select(columns).single()
  if (error) throw new Error(error.message)
  return data as ServiceRecord
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await getClient().from('services').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateServiceOrder(services: ServiceRecord[]): Promise<void> {
  const results = await Promise.all(
    services.map((service, index) => getClient().from('services').update({ display_order: index }).eq('id', service.id)),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) throw new Error(failed.error.message)
}

export function formatServicePrice(service: Pick<ServiceRecord, 'price_isk' | 'price_on_request'>) {
  if (service.price_on_request || service.price_isk === null) return 'Price upon request'
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    maximumFractionDigits: 0,
  }).format(service.price_isk)
}

export function isValidBookingUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true
  try {
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(trimmed).protocol)
  } catch {
    return false
  }
}
