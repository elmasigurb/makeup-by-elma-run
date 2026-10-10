export interface Service {
  id: string
  title: string
  description: string
  price: string
  order: number
}

export interface ServiceRecord {
  id: string
  title: string
  description: string
  detailed_description: string
  price_text: string
  price_isk: number | null
  price_on_request: boolean
  duration_minutes: number | null
  category: string
  booking_button_text: string
  booking_url: string
  display_order: number
  published: boolean
  created_at: string
  updated_at: string
}

export type ServiceRecordInput = Omit<ServiceRecord, 'id' | 'created_at' | 'updated_at'>
