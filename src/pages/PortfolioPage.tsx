import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { PortfolioGallery } from '../components/portfolio/PortfolioGallery'

export function PortfolioPage() {
  return (
    <>
      <Header variant="solid" />
      <main id="main-content" className="min-h-screen bg-ivory px-5 pb-28 pt-36 sm:px-8 md:pb-36 md:pt-44 lg:px-12 lg:pt-48">
        <div className="mx-auto max-w-[1600px]">
          <header className="mb-16 grid gap-8 border-b border-ink/15 pb-14 md:mb-20 md:grid-cols-[1.8fr_1fr] md:items-end md:pb-20">
            <div>
              <p className="section-label mb-5">Selected portfolio · 2024—26</p>
              <h1 className="font-serif text-[clamp(4.5rem,10vw,9rem)] leading-[0.78] tracking-[-0.05em]">The work</h1>
            </div>
            <p className="max-w-md text-base leading-relaxed text-ink/60 md:justify-self-end">
              Bridal, event and editorial beauty shaped with intention, attention to detail and a modern point of view.
            </p>
          </header>

          <PortfolioGallery />
        </div>
      </main>
      <Footer />
    </>
  )
}
