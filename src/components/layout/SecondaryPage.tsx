import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Header } from './Header'

interface SecondaryPageProps {
  children: ReactNode
}

export function SecondaryPage({ children }: SecondaryPageProps) {
  return (
    <>
      <Header variant="solid" />
      <main id="main-content" className="min-h-screen bg-ivory px-5 pb-28 pt-36 sm:px-8 md:pb-36 md:pt-44 lg:px-12 lg:pt-48">
        <div className="mx-auto max-w-[1600px] animate-page-in">{children}</div>
      </main>
      <Footer />
    </>
  )
}
