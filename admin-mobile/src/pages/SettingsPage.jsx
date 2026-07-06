import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { HiBell, HiLogout, HiShieldCheck } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import TopBar from '../components/layout/TopBar'
import { useAuth } from '../context/AuthContext'
import {
  fetchDeviceStatus,
  getStoredAlertsEnabled,
  getStoredFcmToken,
  syncAlertsPreference,
} from '../services/push'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [pushSupported] = useState(Capacitor.isNativePlatform())

  useEffect(() => {
    let active = true
    ;(async () => {
      const local = await getStoredAlertsEnabled()
      if (!active) return
      setAlertsEnabled(local)

      const token = await getStoredFcmToken()
      if (token) {
        try {
          const status = await fetchDeviceStatus(token)
          if (active && status.registered) {
            setAlertsEnabled(Boolean(status.alerts_enabled))
          }
        } catch {
          // keep local preference
        }
      }

      if (active) setAlertsLoading(false)
    })()

    return () => {
      active = false
    }
  }, [])

  async function handleAlertsToggle() {
    const next = !alertsEnabled
    setAlertsEnabled(next)
    try {
      await syncAlertsPreference(next)
      toast.success(next ? 'Lead alerts on' : 'Lead alerts off')
    } catch {
      setAlertsEnabled(!next)
      toast.error('Could not update alert preference')
    }
  }

  async function handleLogout() {
    try {
      await logout()
      toast.success('Signed out')
      navigate('/login', { replace: true })
    } catch {
      toast.error('Could not sign out')
    }
  }

  return (
    <>
      <TopBar title="Settings" subtitle="Account & notifications" />

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <section className="rounded-2xl border border-white/10 bg-surface-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15">
              <HiShieldCheck className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Signed in</p>
              <p className="mt-0.5 text-sm text-white/60">
                {user?.username ?? 'Admin'}
              </p>
              <p className="mt-1 text-xs text-white/40">
                Session via secure mobile token (7 days)
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15">
                <HiBell className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Lead alerts</p>
                <p className="mt-0.5 text-xs text-white/50">
                  {pushSupported
                    ? 'Push when a new form or order arrives'
                    : 'Push works on the Android app only'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={alertsEnabled}
              disabled={alertsLoading || !pushSupported}
              onClick={handleAlertsToggle}
              className={[
                'relative h-8 w-14 shrink-0 rounded-full transition',
                alertsEnabled ? 'bg-brand' : 'bg-white/15',
                alertsLoading || !pushSupported ? 'opacity-50' : '',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-1 h-6 w-6 rounded-full bg-white transition',
                  alertsEnabled ? 'left-7' : 'left-1',
                ].join(' ')}
              />
            </button>
          </div>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 py-3.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          <HiLogout className="h-5 w-5" />
          Sign out
        </button>
      </main>
    </>
  )
}
