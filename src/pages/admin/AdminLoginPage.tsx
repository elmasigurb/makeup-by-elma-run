import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { checkAdminAccess } from '../../lib/adminAuth'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const client = supabase
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isSupabaseConfigured || !client) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Enter your email address and password.')
      return
    }

    setSubmitting(true)
    const { error: signInError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError('The email address or password was not accepted.')
      setSubmitting(false)
      return
    }

    const access = await checkAdminAccess()
    if (!access.authorized) {
      await client.auth.signOut()
      setError(access.error ?? 'This account is not authorized to manage the website.')
      setSubmitting(false)
      return
    }

    navigate('/admin', { replace: true })
  }

  return (
    <main className="grid min-h-screen bg-ivory text-ink lg:grid-cols-2">
      <section className="hidden bg-[#d8d6d1] lg:block" aria-hidden="true" />
      <section className="flex min-h-screen items-center px-5 py-24 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-lg">
          <a href="/" className="font-serif text-3xl">Elma Rún</a>
          <p className="section-label mb-5 mt-20">Private administration</p>
          <h1 className="font-serif text-6xl leading-none tracking-[-0.04em] sm:text-7xl">Welcome back</h1>
          <p className="mt-6 max-w-md leading-relaxed text-ink/55">
            Sign in with the administrator account configured in Supabase. New accounts cannot be created here.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-12 space-y-8">
            <div>
              <label htmlFor="admin-email" className="text-xs uppercase tracking-[0.18em] text-ink/55">Email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full border-0 border-b border-ink/25 bg-transparent px-0 py-3 text-base outline-none transition-colors focus:border-ink"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="text-xs uppercase tracking-[0.18em] text-ink/55">Password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full border-0 border-b border-ink/25 bg-transparent px-0 py-3 text-base outline-none transition-colors focus:border-ink"
              />
            </div>

            {error && <p className="border-l border-[#7f3d34] pl-4 text-sm text-[#7f3d34]" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="min-h-14 w-full border border-ink px-7 text-xs uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-ivory disabled:cursor-wait disabled:opacity-50"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
