import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { BookingInquiry, InquiryStatus, PublicInquiryInput } from '../types/inquiries'

const columns = 'id,full_name,email,phone,service_id,service_name,preferred_date,preferred_time,location,message,privacy_consent_at,status,admin_notes,created_at,updated_at'

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export async function submitBookingInquiry(input: PublicInquiryInput): Promise<void> {
  const { data, error } = await getClient().functions.invoke('submit-booking-inquiry', { body: input })
  if (error instanceof FunctionsHttpError) {
    try {
      const response = await error.context.json() as { error?: string }
      throw new Error(response.error || 'The inquiry could not be submitted.')
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== 'The inquiry could not be submitted.') throw parseError
      throw new Error('The inquiry could not be submitted.')
    }
  }
  if (error) throw new Error(error.message)
  if (!data?.success) throw new Error('The inquiry could not be submitted.')
}

export async function fetchAdminInquiries(): Promise<BookingInquiry[]> {
  const { data, error } = await getClient().from('booking_inquiries').select(columns).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as BookingInquiry[]
}

export async function updateInquiry(id: string, updates: { status: InquiryStatus; admin_notes: string }): Promise<BookingInquiry> {
  const { data, error } = await getClient().from('booking_inquiries').update(updates).eq('id', id).select(columns).single()
  if (error) throw new Error(error.message)
  return data as BookingInquiry
}

export async function deleteInquiry(id: string): Promise<void> {
  const { error } = await getClient().from('booking_inquiries').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchNewInquiryCount(): Promise<number> {
  const { count, error } = await getClient().from('booking_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new')
  if (error) throw new Error(error.message)
  return count ?? 0
}
