import { EditorialPageHeader } from '../components/layout/EditorialPageHeader'
import { SecondaryPage } from '../components/layout/SecondaryPage'

export function PrivacyPage() {
  return <SecondaryPage>
    <EditorialPageHeader eyebrow="Privacy" title="Privacy notice" introduction="How information submitted through the booking inquiry form is handled." />
    <div className="grid gap-12 pt-16 md:grid-cols-12 md:pt-24">
      <div className="space-y-10 leading-relaxed text-ink/65 md:col-span-7 md:col-start-5">
        <section><h2 className="font-serif text-4xl text-ink">Information collected</h2><p className="mt-4">The booking form collects the information you choose to provide, including your name, email address, optional phone number, requested service, preferred date and time, location, and message.</p></section>
        <section><h2 className="font-serif text-4xl text-ink">How it is used</h2><p className="mt-4">This information is used only to review and respond to your booking inquiry, manage the requested appointment, and keep relevant private administrative notes.</p></section>
        <section><h2 className="font-serif text-4xl text-ink">Access and security</h2><p className="mt-4">Inquiry records are stored in Supabase and are accessible only to the authorized website administrator. The public website cannot read inquiry records.</p></section>
        <section><h2 className="font-serif text-4xl text-ink">Your choices</h2><p className="mt-4">If you want to ask about, correct, or request deletion of an inquiry, use the contact details shown on the Contact page.</p></section>
      </div>
    </div>
  </SecondaryPage>
}
