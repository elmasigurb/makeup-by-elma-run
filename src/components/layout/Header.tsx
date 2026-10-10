import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const links = [
  { label: 'Work', to: '/portfolio' },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Book', to: '/contact' },
]

interface HeaderProps {
  variant?: 'overlay' | 'solid'
}

export function Header({ variant = 'overlay' }: HeaderProps) {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        variant === 'solid' || scrolled || menuOpen
          ? 'bg-ivory/95 text-ink shadow-[0_1px_0_rgba(27,26,24,.1)] backdrop-blur'
          : 'text-white'
      }`}
    >
      <a href="#main-content" className="sr-only z-[60] bg-ivory px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:h-24 lg:px-12">
        <Link to="/" className="relative z-50 font-serif text-2xl font-medium tracking-[0.02em] lg:text-3xl">
          Elma Rún
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-10 md:flex">
          {links.map((link) => (
            <NavLink key={link.label} to={link.to} className="link-line text-sm tracking-[0.14em]">
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="relative z-50 -mr-2 grid size-11 place-items-center md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
        </button>
      </div>

      <div
        id="mobile-navigation"
        aria-hidden={!menuOpen}
        className={`absolute inset-x-0 top-20 h-[calc(100svh-5rem)] bg-ivory px-5 transition-all duration-500 md:hidden ${
          menuOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-4 opacity-0'
        }`}
      >
        <nav aria-label="Mobile navigation" className="flex h-full flex-col justify-center gap-4 pb-20">
          {links.map((link, index) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="border-b border-ink/15 py-3 font-serif text-5xl font-normal"
            >
              <span className="mr-4 font-sans text-xs tracking-widest text-taupe">0{index + 1}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
