import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders as supabaseCorsHeaders } from 'npm:@supabase/supabase-js@^2/cors'

interface InquiryPayload {
  fullName?: unknown
  email?: unknown
  phone?: unknown
  serviceId?: unknown
  preferredDate?: unknown
  preferredTime?: unknown
  location?: unknown
  message?: unknown
  privacyConsent?: unknown
  website?: unknown
  formStartedAt?: unknown
}

const localOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
])

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') ?? ''
  const allowedOrigins = new Set([
    ...localOrigins,
    ...(Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((value) => value.trim()).filter(Boolean),
  ])
  const corsHeaders = {
    ...supabaseCorsHeaders,
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }

  if (request.method === 'OPTIONS') {
    return allowedOrigins.has(origin)
      ? new Response('ok', { headers: corsHeaders })
      : json({ error: 'Origin not allowed.' }, 403, corsHeaders)
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, corsHeaders)
  if (origin && !allowedOrigins.has(origin)) return json({ error: 'Origin not allowed.' }, 403, corsHeaders)

  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (contentLength > 20_000) return json({ error: 'The inquiry is too large.' }, 413, corsHeaders)

  let payload: InquiryPayload
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400, corsHeaders)
  }

  const validation = validatePayload(payload)
  if (!validation.ok) return json({ error: validation.error }, 400, corsHeaders)

  const hashSalt = Deno.env.get('INQUIRY_HASH_SALT')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serverKey = getServerKey()
  if (!hashSalt || !supabaseUrl || !serverKey) {
    console.error('Booking function is missing required server configuration.')
    return json({ error: 'Booking inquiries are temporarily unavailable.' }, 503, corsHeaders)
  }

  const admin = createClient(supabaseUrl, serverKey, { auth: { persistSession: false } })
  let serviceName = ''
  if (validation.value.serviceId) {
    const { data: service, error: serviceError } = await admin
      .from('services')
      .select('id,title')
      .eq('id', validation.value.serviceId)
      .eq('published', true)
      .maybeSingle()
    if (serviceError) {
      console.error('Published service lookup failed.', serviceError.code)
      return json({ error: 'The inquiry could not be submitted.' }, 500, corsHeaders)
    }
    if (!service) return json({ error: 'Please choose an available service.' }, 400, corsHeaders)
    serviceName = service.title
  }

  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const networkIdentifier = forwardedIp || request.headers.get('cf-connecting-ip') || request.headers.get('user-agent') || 'unknown'
  const rateKeyHash = await sha256(`${hashSalt}|rate|${networkIdentifier}`)
  const fingerprint = await sha256([
    hashSalt,
    'duplicate',
    networkIdentifier,
    validation.value.email.toLowerCase(),
    validation.value.serviceId,
    validation.value.preferredDate,
    validation.value.preferredTime,
    validation.value.message,
  ].join('|'))

  const { data: inquiryId, error: insertError } = await admin.rpc('accept_booking_inquiry', {
    p_full_name: validation.value.fullName,
    p_email: validation.value.email,
    p_phone: validation.value.phone,
    p_service_id: validation.value.serviceId || null,
    p_service_name: serviceName,
    p_preferred_date: validation.value.preferredDate || null,
    p_preferred_time: validation.value.preferredTime || null,
    p_location: validation.value.location,
    p_message: validation.value.message,
    p_privacy_consent_at: new Date().toISOString(),
    p_rate_key_hash: rateKeyHash,
    p_submission_fingerprint: fingerprint,
  })

  if (insertError) {
    if (insertError.message.includes('rate_limited')) return json({ error: 'Too many inquiries were submitted recently. Please try again later.' }, 429, corsHeaders)
    if (insertError.message.includes('duplicate_submission')) return json({ error: 'This inquiry was already received. Please wait before trying again.' }, 409, corsHeaders)
    console.error('Booking inquiry insert failed.', insertError.code)
    return json({ error: 'The inquiry could not be saved. Please try again.' }, 500, corsHeaders)
  }

  const notificationSent = await sendNotification({
    inquiryId: String(inquiryId),
    fullName: validation.value.fullName,
    email: validation.value.email,
    phone: validation.value.phone,
    serviceName,
    preferredDate: validation.value.preferredDate,
    preferredTime: validation.value.preferredTime,
    location: validation.value.location,
    message: validation.value.message,
  })

  return json({ success: true, notificationSent }, 201, corsHeaders)
})

function validatePayload(payload: InquiryPayload): { ok: true; value: ValidatedInquiry } | { ok: false; error: string } {
  const website = text(payload.website, 200)
  if (website) return { ok: false, error: 'The inquiry could not be submitted.' }

  const startedAt = typeof payload.formStartedAt === 'number' ? payload.formStartedAt : 0
  const elapsed = Date.now() - startedAt
  if (!startedAt || elapsed < 2_000 || elapsed > 2 * 60 * 60 * 1000) return { ok: false, error: 'Please refresh the page and try again.' }

  const value: ValidatedInquiry = {
    fullName: text(payload.fullName, 120),
    email: text(payload.email, 254).toLowerCase(),
    phone: text(payload.phone, 40),
    serviceId: text(payload.serviceId, 100),
    preferredDate: text(payload.preferredDate, 10),
    preferredTime: text(payload.preferredTime, 5),
    location: text(payload.location, 240),
    message: text(payload.message, 5000),
  }

  if (value.fullName.length < 2) return { ok: false, error: 'Please enter your full name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) return { ok: false, error: 'Please enter a valid email address.' }
  if (value.phone && !/^[+\d][\d\s().-]{6,39}$/.test(value.phone)) return { ok: false, error: 'Please enter a valid phone number.' }
  if (value.preferredDate && !isValidDate(value.preferredDate)) return { ok: false, error: 'Please enter a valid preferred date.' }
  if (value.preferredDate && value.preferredDate < new Date().toISOString().slice(0, 10)) return { ok: false, error: 'Please choose today or a future date.' }
  if (value.preferredTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.preferredTime)) return { ok: false, error: 'Please enter a valid preferred time.' }
  if (payload.privacyConsent !== true) return { ok: false, error: 'Privacy consent is required.' }
  return { ok: true, value }
}

interface ValidatedInquiry {
  fullName: string
  email: string
  phone: string
  serviceId: string
  preferredDate: string
  preferredTime: string
  location: string
  message: string
}

function text(value: unknown, maximum: number) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : ''
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value)
}

function getServerKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (secretKeys) {
    try {
      return JSON.parse(secretKeys).default as string
    } catch {
      return null
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? null
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sendNotification(inquiry: NotificationInquiry) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const recipient = Deno.env.get('BOOKING_NOTIFICATION_TO')
  const sender = Deno.env.get('BOOKING_NOTIFICATION_FROM')
  if (!apiKey || !recipient || !sender) return false

  const details = [
    `Name: ${inquiry.fullName}`,
    `Email: ${inquiry.email}`,
    inquiry.phone && `Phone: ${inquiry.phone}`,
    inquiry.serviceName && `Service: ${inquiry.serviceName}`,
    inquiry.preferredDate && `Preferred date: ${inquiry.preferredDate}`,
    inquiry.preferredTime && `Preferred time: ${inquiry.preferredTime}`,
    inquiry.location && `Location: ${inquiry.location}`,
    '',
    inquiry.message || 'No additional details supplied.',
    '',
    `Inquiry ID: ${inquiry.inquiryId}`,
  ].filter((line) => line !== false).join('\n')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: inquiry.email,
        subject: `New booking inquiry from ${inquiry.fullName}`,
        text: details,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;white-space:pre-wrap">${escapeHtml(details)}</div>`,
      }),
    })
    if (!response.ok) console.error('Booking notification provider returned', response.status)
    return response.ok
  } catch {
    console.error('Booking notification request failed.')
    return false
  }
}

interface NotificationInquiry extends ValidatedInquiry {
  inquiryId: string
  serviceName: string
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!)
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
