import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-ink px-5 pb-8 text-ivory sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 border-t border-ivory/20 pt-8 text-sm text-ivory/60 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Elma Rún</p>
        <div className="flex gap-6">
          <Link className="transition-colors hover:text-ivory" to="/portfolio">Work</Link>
          <Link className="transition-colors hover:text-ivory" to="/services">Services</Link>
          <Link className="transition-colors hover:text-ivory" to="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
