import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { isSupabaseConfigured } from '../../lib/supabase'
import { submitBookingInquiry } from '../../services/inquiryService'
import { fetchPublishedServices } from '../../services/servicesService'
import type { ServiceRecord } from '../../types/services'

interface FormValues {
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
}

type FormErrors = Partial<Record<keyof FormValues | 'form', string>>

const emptyValues: FormValues = {
  fullName: '', email: '', phone: '', serviceId: '', preferredDate: '', preferredTime: '', location: '', message: '', privacyConsent: false, website: '',
}

const fieldClass = 'w-full border-0 border-b border-ink/25 bg-transparent px-0 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-ink'

export function InquiryForm() {
  const [searchParams] = useSearchParams()
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [values, setValues] = useState<FormValues>(emptyValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const formStartedAt = useRef(Date.now())
  const lastSubmission = useRef<string | null>(null)
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    fetchPublishedServices()
      .then((records) => {
        if (!active) return
        setServices(records)
        const requested = searchParams.get('service')
        if (requested && records.some((service) => service.id === requested)) setValues((current) => ({ ...current, serviceId: requested }))
      })
      .catch(() => setErrors((current) => ({ ...current, form: 'Available services could not be loaded. You can still send a general inquiry.' })))
    return () => { active = false }
  }, [searchParams])

  const validate = () => {
    const next: FormErrors = {}
    if (values.fullName.trim().length < 2) next.fullName = 'Please enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Please enter a valid email address.'
    if (values.phone && !/^[+\d][\d\s().-]{6,39}$/.test(values.phone.trim())) next.phone = 'Please enter a valid phone number.'
    if (values.preferredDate && values.preferredDate < today) next.preferredDate = 'Please choose today or a future date.'
    if (!values.privacyConsent) next.privacyConsent = 'Please agree to the privacy notice before submitting.'
    return next
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = event.target
    const value = event.target instanceof HTMLInputElement && event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined, form: undefined }))
    setSubmitted(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    if (!isSupabaseConfigured) {
      setErrors({ form: 'Online inquiries are not configured yet. Please try again later.' })
      return
    }

    const signature = JSON.stringify(values)
    if (lastSubmission.current === signature) {
      setErrors({ form: 'This inquiry has already been submitted.' })
      return
    }

    setSubmitting(true)
    try {
      await submitBookingInquiry({ ...values, formStartedAt: formStartedAt.current })
      lastSubmission.current = signature
      setValues(emptyValues)
      setSubmitted(true)
      setErrors({})
      formStartedAt.current = Date.now()
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'The inquiry could not be submitted. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10" aria-label="Booking inquiry form">
      <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
        <FormField label="Full name *" htmlFor="fullName" error={errors.fullName}>
          <input className={fieldClass} id="fullName" name="fullName" value={values.fullName} onChange={handleChange} autoComplete="name" placeholder="Your full name" required aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'fullName-error' : undefined} />
        </FormField>
        <FormField label="Email address *" htmlFor="email" error={errors.email}>
          <input className={fieldClass} id="email" name="email" type="email" value={values.email} onChange={handleChange} autoComplete="email" placeholder="Your email" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
        </FormField>
        <FormField label="Phone number" htmlFor="phone" error={errors.phone}>
          <input className={fieldClass} id="phone" name="phone" type="tel" value={values.phone} onChange={handleChange} autoComplete="tel" placeholder="Optional" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} />
        </FormField>
        <FormField label="Service type" htmlFor="serviceId">
          <select className={fieldClass} id="serviceId" name="serviceId" value={values.serviceId} onChange={handleChange}><option value="">General inquiry</option>{services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}</select>
        </FormField>
        <FormField label="Preferred appointment date" htmlFor="preferredDate" error={errors.preferredDate}>
          <input className={fieldClass} id="preferredDate" name="preferredDate" type="date" min={today} value={values.preferredDate} onChange={handleChange} aria-invalid={Boolean(errors.preferredDate)} aria-describedby={errors.preferredDate ? 'preferredDate-error' : undefined} />
        </FormField>
        <FormField label="Preferred appointment time" htmlFor="preferredTime">
          <input className={fieldClass} id="preferredTime" name="preferredTime" type="time" value={values.preferredTime} onChange={handleChange} />
        </FormField>
        <FormField label="Location" htmlFor="location" className="sm:col-span-2">
          <input className={fieldClass} id="location" name="location" value={values.location} onChange={handleChange} autoComplete="street-address" placeholder="Optional venue or area" maxLength={240} />
        </FormField>
      </div>

      <FormField label="Message / additional details" htmlFor="message">
        <textarea className={`${fieldClass} min-h-32 resize-y`} id="message" name="message" value={values.message} onChange={handleChange} maxLength={5000} placeholder="Tell me about your plans, timing, and anything else you would like me to know" />
      </FormField>

      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label><input id="website" name="website" value={values.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-ink/60">
          <input type="checkbox" name="privacyConsent" checked={values.privacyConsent} onChange={handleChange} required className="mt-1" aria-invalid={Boolean(errors.privacyConsent)} aria-describedby={errors.privacyConsent ? 'privacyConsent-error' : undefined} />
          <span>I agree that my information may be used to respond to this booking inquiry. I have read the <Link to="/privacy" className="link-line text-ink">privacy notice</Link>. *</span>
        </label>
        {errors.privacyConsent && <p id="privacyConsent-error" className="mt-2 text-sm text-[#7f3d34]" role="alert">{errors.privacyConsent}</p>}
      </div>

      <div className="flex flex-col items-start gap-5 border-t border-ink/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-lg text-sm leading-relaxed text-ink/50">Submitting an inquiry does not confirm an appointment. Your booking is confirmed only after you receive a direct confirmation.</p>
        <button type="submit" disabled={submitting} className="inline-flex min-h-14 min-w-48 items-center justify-center gap-2 border border-ink px-7 text-xs uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-50">
          {submitting && <LoaderCircle className="animate-spin" size={16} />}{submitting ? 'Sending inquiry' : 'Send inquiry'}
        </button>
      </div>

      {errors.form && <p role="alert" className="border-l-2 border-[#7f3d34] bg-[#f3e8e4] px-4 py-3 text-sm leading-relaxed text-[#7f3d34]">{errors.form}</p>}
      {submitted && <div role="status" className="border-l-2 border-ink bg-linen px-5 py-4"><p className="font-serif text-2xl">Your inquiry has been received.</p><p className="mt-2 text-sm leading-relaxed text-ink/60">Thank you. This message confirms receipt only—it does not confirm an appointment.</p></div>}
    </form>
  )
}

function FormField({ label, htmlFor, error, children, className = '' }: { label: string; htmlFor: string; error?: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><label htmlFor={htmlFor} className="text-xs uppercase tracking-[0.18em] text-ink/55">{label}</label>{children}{error && <p id={`${htmlFor}-error`} className="mt-2 text-sm text-[#7f3d34]" role="alert">{error}</p>}</div>
}
