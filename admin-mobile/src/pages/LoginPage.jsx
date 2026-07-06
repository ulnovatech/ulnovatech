import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { HiLockClosed, HiUser } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../services/api'
import { SITE } from '../site.config'

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password) {
      toast.error('Enter your username and password')
      return
    }

    setSubmitting(true)
    try {
      await login(username.trim(), password)
      toast.success('Welcome back')
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not sign in. Try again.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="relative overflow-hidden px-6 pb-10 pt-[max(env(safe-area-inset-top),2.5rem)]">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: SITE.brandColor }}
        />
        <div className="relative mx-auto max-w-md">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">
            Ulnova
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">{SITE.name}</h1>
          <p className="mt-2 text-white/60">{SITE.tagline}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-8">
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-surface-card p-6 shadow-2xl shadow-black/40"
        >
          <h2 className="text-lg font-semibold text-white">Sign in</h2>
          <p className="mt-1 text-sm text-white/50">
            Use your CRM admin credentials
          </p>

          <label className="mt-6 block">
            <span className="text-xs font-medium uppercase tracking-wide text-white/50">
              Username
            </span>
            <div className="relative mt-2">
              <HiUser className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface-elevated py-3 pl-10 pr-4 text-white outline-none ring-brand focus:border-brand focus:ring-1"
                placeholder="admin"
                disabled={submitting}
              />
            </div>
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-medium uppercase tracking-wide text-white/50">
              Password
            </span>
            <div className="relative mt-2">
              <HiLockClosed className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface-elevated py-3 pl-10 pr-4 text-white outline-none ring-brand focus:border-brand focus:ring-1"
                placeholder="••••••••"
                disabled={submitting}
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-brand py-3.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
