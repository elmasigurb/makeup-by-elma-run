import { Link } from 'react-router-dom'
import { SecondaryPage } from '../components/layout/SecondaryPage'

export function NotFoundPage() {
  return (
    <SecondaryPage>
      <section className="grid min-h-[45vh] place-items-center text-center">
        <div>
          <p className="section-label mb-5">404 · Page not found</p>
          <h1 className="font-serif text-6xl tracking-[-0.04em] sm:text-8xl">This page has moved.</h1>
          <p className="mx-auto mt-6 max-w-lg leading-relaxed text-ink/65">
            The address may be incorrect, or the page may no longer be available.
          </p>
          <Link to="/" className="link-line mt-10 inline-block text-xs uppercase tracking-[0.18em]">
            Return home
          </Link>
        </div>
      </section>
    </SecondaryPage>
  )
}
