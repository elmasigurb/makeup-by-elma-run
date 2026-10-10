import { InquiryForm } from '../components/contact/InquiryForm'
import { EditorialPageHeader } from '../components/layout/EditorialPageHeader'
import { SecondaryPage } from '../components/layout/SecondaryPage'
import { contactDetails } from '../data/contact'

export function ContactPage() {
  return (
    <SecondaryPage>
      <EditorialPageHeader
        eyebrow="Contact & booking"
        title="Let’s talk"
        introduction="Share a few details about your date, service and plans. An inquiry starts the conversation and does not confirm an appointment."
      />

      <section className="grid gap-16 pt-16 md:grid-cols-12 md:gap-10 md:pt-24">
        <aside className="md:col-span-4 lg:col-span-3">
          <p className="section-label mb-8">Direct contact</p>
          <dl className="space-y-8">
            <div>
              <dt className="mb-2 text-xs uppercase tracking-[0.16em] text-ink/40">Email</dt>
              <dd className="font-serif text-2xl">
                {contactDetails.email ? (
                  <a className="link-line" href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a>
                ) : 'Email address to be added'}
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-xs uppercase tracking-[0.16em] text-ink/40">Instagram</dt>
              <dd className="font-serif text-2xl">
                {contactDetails.instagramLabel && contactDetails.instagramUrl ? (
                  <a className="link-line" href={contactDetails.instagramUrl} target="_blank" rel="noreferrer">
                    {contactDetails.instagramLabel}
                  </a>
                ) : 'Instagram profile to be added'}
              </dd>
            </div>
          </dl>
        </aside>

        <div className="md:col-span-8 md:pl-6 lg:col-span-8 lg:col-start-5 lg:pl-12">
          <InquiryForm />
        </div>
      </section>
    </SecondaryPage>
  )
}
