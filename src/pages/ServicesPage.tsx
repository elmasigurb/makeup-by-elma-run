import { useEffect, useState } from 'react'
import { EditorialPageHeader } from '../components/layout/EditorialPageHeader'
import { SecondaryPage } from '../components/layout/SecondaryPage'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchPublishedServices, formatServicePrice, isValidBookingUrl } from '../services/servicesService'
import type { ServiceRecord } from '../types/services'

export function ServicesPage() {
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    fetchPublishedServices()
      .then((records) => active && setServices(records))
      .catch(() => {
        // Published services remain hidden if the public query cannot complete.
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return (
    <SecondaryPage>
      <EditorialPageHeader
        eyebrow="Services & pricing"
        title="Made for the moment"
        introduction="Thoughtful, tailored makeup for private clients, weddings and creative productions. Every booking begins with a conversation."
      />

      <section className="pt-16 md:pt-24" aria-label="Available services">
        {services.map((service, index) => (
          <article
            key={service.id}
            className="grid gap-7 border-b border-ink/15 py-10 first:border-t md:grid-cols-[0.35fr_1.15fr_1.7fr_0.75fr] md:items-start md:gap-10 md:py-14"
          >
            <p className="text-xs tracking-[0.2em] text-ink/40">{String(index + 1).padStart(2, '0')}</p>
            <div>
              {service.category && <p className="mb-3 text-[0.65rem] uppercase tracking-[0.18em] text-ink/40">{service.category}</p>}
              <h2 className="font-serif text-4xl leading-none tracking-[-0.025em] sm:text-5xl">{service.title}</h2>
              {service.duration_minutes && <p className="mt-4 text-sm text-ink/40">{service.duration_minutes} min</p>}
            </div>
            <div className="max-w-xl text-base leading-relaxed text-ink/60">
              <p>{service.description}</p>
              {service.detailed_description && <p className="mt-5 whitespace-pre-line text-sm text-ink/50">{service.detailed_description}</p>}
            </div>
            <div className="flex items-center justify-between gap-5 md:flex-col md:items-start">
              <p className="text-sm text-ink/70">{formatServicePrice(service)}</p>
              {isValidBookingUrl(service.booking_url) && service.booking_button_text.trim() && (
                <a href={service.booking_url} className="link-line text-xs uppercase tracking-[0.18em]">{service.booking_button_text}</a>
              )}
            </div>
          </article>
        ))}
        {!loading && services.length === 0 && (
          <div className="border-y border-ink/15 py-16 text-center">
            <p className="font-serif text-3xl text-ink/65">Services and pricing will be available soon.</p>
          </div>
        )}
        {loading && <div className="border-y border-ink/15 py-16 text-center text-xs uppercase tracking-[0.18em] text-ink/35">Loading services…</div>}
      </section>
    </SecondaryPage>
  )
}
