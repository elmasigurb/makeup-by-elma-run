import { useState } from 'react'
import {
  BadgeDollarSign,
  ExternalLink,
  Home,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  UserRound,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const navigation = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Portfolio', to: '/admin/portfolio', icon: Images },
  { label: 'Homepage', to: '/admin/homepage', icon: Home },
  { label: 'About Me', to: '/admin/about', icon: UserRound },
  { label: 'Services & Pricing', to: '/admin/services', icon: BadgeDollarSign },
  { label: 'Inquiries', to: '/admin/inquiries', icon: Mail },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const signOut = async () => {
    await supabase?.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f3f0ea] text-ink">
      <header className="sticky top-0 z-40 flex h-18 items-center justify-between border-b border-ink/10 bg-ivory/95 px-5 backdrop-blur lg:hidden">
        <Link to="/admin" className="font-serif text-2xl">Elma Rún</Link>
        <button type="button" onClick={() => setMobileOpen(true)} className="grid size-11 place-items-center" aria-label="Open admin navigation">
          <Menu size={23} strokeWidth={1.5} />
        </button>
      </header>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,19rem)] flex-col border-r border-ink/10 bg-ivory px-5 py-7 transition-transform duration-300 lg:w-72 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-12 flex items-center justify-between">
          <Link to="/admin" onClick={() => setMobileOpen(false)} className="font-serif text-3xl">Elma Rún</Link>
          <button type="button" onClick={() => setMobileOpen(false)} className="grid size-10 place-items-center lg:hidden" aria-label="Close admin navigation">
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        <p className="mb-4 px-3 text-[0.68rem] uppercase tracking-[0.2em] text-ink/35">Administration</p>
        <nav className="space-y-1" aria-label="Admin navigation">
          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `flex min-h-12 items-center gap-3 px-3 text-sm transition-colors ${isActive ? 'bg-ink text-ivory' : 'text-ink/60 hover:bg-ink/5 hover:text-ink'}`}
            >
              <Icon size={18} strokeWidth={1.4} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t border-ink/10 pt-5">
          <a href="/" target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-3 px-3 text-sm text-ink/55 hover:text-ink">
            <ExternalLink size={17} strokeWidth={1.4} /> View website
          </a>
          <button type="button" onClick={signOut} className="flex min-h-11 w-full items-center gap-3 px-3 text-sm text-ink/55 hover:text-ink">
            <LogOut size={17} strokeWidth={1.4} /> Sign out
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-72">
        <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-10 lg:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
