import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { checkAdminAccess } from '../../lib/adminAuth'
import { isSupabaseConfigured } from '../../lib/supabase'

type AccessState = 'loading' | 'authorized' | 'signed-out' | 'denied' | 'error' | 'unconfigured'

export function AdminProtectedRoute() {
  const [state, setState] = useState<AccessState>(isSupabaseConfigured ? 'loading' : 'unconfigured')

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let active = true
    checkAdminAccess().then((result) => {
      if (!active) return
      if (result.error) setState('error')
      else if (!result.user) setState('signed-out')
      else if (!result.authorized) setState('denied')
      else setState('authorized')
    })

    return () => {
      active = false
    }
  }, [])

  if (state === 'authorized') return <Outlet />
  if (state === 'signed-out') return <Navigate to="/admin/login" replace />

  if (state === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-ivory px-5 text-ink">
        <p className="text-sm uppercase tracking-[0.2em] text-ink/50">Checking admin access…</p>
      </main>
    )
  }

  const message = state === 'unconfigured'
    ? 'Supabase has not been connected yet. Add the required values to your local .env file.'
    : state === 'denied'
      ? 'This signed-in account is not authorized as an administrator.'
      : 'Admin authorization could not be verified. Confirm that the Supabase migrations have been applied.'
  const actionHref = state === 'unconfigured' ? '/' : '/admin/login'
  const actionLabel = state === 'unconfigured' ? 'Return to website' : 'Return to sign in'

  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-5 text-ink">
      <div className="w-full max-w-xl border-t border-ink pt-8">
        <p className="section-label mb-5">Admin access</p>
        <h1 className="font-serif text-5xl tracking-[-0.035em]">Access unavailable</h1>
        <p className="mt-6 max-w-lg leading-relaxed text-ink/60">{message}</p>
        <a href={actionHref} className="link-line mt-8 inline-block text-sm uppercase tracking-[0.16em]">{actionLabel}</a>
      </div>
    </main>
  )
}
