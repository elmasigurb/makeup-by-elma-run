import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchNewInquiryCount } from '../../services/inquiryService'

export function AdminStartPage() {
  const [newInquiries, setNewInquiries] = useState<number | null>(null)

  useEffect(() => {
    fetchNewInquiryCount().then(setNewInquiries).catch(() => setNewInquiries(null))
  }, [])

  return (
    <section>
      <p className="section-label mb-5">Overview</p>
      <h1 className="max-w-4xl font-serif text-6xl leading-[0.92] tracking-[-0.04em] sm:text-7xl">Your website, in one place.</h1>
      <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink/55">
        Manage your portfolio, page content, services and client inquiries without changing website code.
      </p>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link to="/admin/portfolio" className="group bg-ivory p-7 transition-colors hover:bg-white sm:p-9">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/40">Available now</p>
          <h2 className="mt-8 font-serif text-4xl">Manage portfolio</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/55">Upload images, edit details, reorder work and control what appears publicly.</p>
          <span className="link-line mt-9 inline-block text-xs uppercase tracking-[0.17em]">Open portfolio</span>
        </Link>
        <Link to="/admin/inquiries" className="group bg-ivory p-7 transition-colors hover:bg-white sm:p-9">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/40">{newInquiries === null ? 'Inquiries' : `${newInquiries} new`}</p>
          <h2 className="mt-8 font-serif text-4xl">Booking inquiries</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/55">Review client details, update statuses and keep private notes.</p>
          <span className="link-line mt-9 inline-block text-xs uppercase tracking-[0.17em]">Open inquiries</span>
        </Link>
        <Link to="/admin/services" className="group bg-ivory p-7 transition-colors hover:bg-white sm:p-9">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/40">Available now</p>
          <h2 className="mt-8 font-serif text-4xl">Services & pricing</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/55">Edit services, prices, booking links and display order.</p>
          <span className="link-line mt-9 inline-block text-xs uppercase tracking-[0.17em]">Open services</span>
        </Link>
      </div>
    </section>
  )
}
