import { useLocation } from 'react-router-dom'

const titles: Record<string, string> = {
  '/admin/homepage': 'Homepage',
  '/admin/about': 'About Me',
  '/admin/services': 'Services & Pricing',
  '/admin/settings': 'Settings',
}

export function AdminComingSoonPage() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Content editor'

  return (
    <section className="py-10 md:py-20">
      <p className="section-label mb-5">Coming next</p>
      <h1 className="font-serif text-6xl tracking-[-0.04em] sm:text-7xl">{title}</h1>
      <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink/55">
        This editor has not been built yet. The current stage is focused exclusively on the Portfolio Manager.
      </p>
    </section>
  )
}
