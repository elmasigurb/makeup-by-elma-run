export type InquiryStatus = 'new' | 'in_progress' | 'confirmed' | 'declined'

export const inquiryStatuses: { value: InquiryStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'declined', label: 'Declined' },
]

export interface BookingInquiry {
  id: string
  full_name: string
  email: string
  phone: string
  service_id: string | null
  service_name: string
  preferred_date: string | null
  preferred_time: string | null
  location: string
  message: string
  privacy_consent_at: string
  status: InquiryStatus
  admin_notes: string
  created_at: string
  updated_at: string
}

export interface PublicInquiryInput {
  fullName: string
  email: string
  phone: string
  serviceId: string
  preferredDate: string
  preferredTime: string
  location: string
  message: string
  privacyConsent: boolean
  website: string
  formStartedAt: number
}
