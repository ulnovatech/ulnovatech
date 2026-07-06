import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiRefresh, HiTrendingUp } from 'react-icons/hi'
import FilterChipRow from '../components/FilterChipRow'
import PullToRefresh from '../components/PullToRefresh'
import SummaryStatCard from '../components/SummaryStatCard'
import TopBar from '../components/layout/TopBar'
import { TYPE_META } from '../constants/requestTypes'
import { useOnAppResume } from '../hooks/useAppResume'
import { apiFetch, ApiError } from '../services/api'
import { useAuth } from '../context/AuthContext'

function HomeSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-2xl border border-white/5 bg-surface-card"
        />
      ))}
    </div>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [chipType, setChipType] = useState('')

  const loadSummary = useCallback(async (isRefresh = false) => {
    setError(null)
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const data = await apiFetch('/mobile/summary')
      setSummary(data)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not load summary'
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useOnAppResume(loadSummary)

  const totals = summary?.totals
  const highlights = summary?.highlights
  const payments = summary?.payments
  const byType24h = summary?.by_type?.last_24h || {}

  const typeChips = Object.entries(byType24h)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <>
      <TopBar
        title="Lead pulse"
        subtitle={
          user?.username
            ? `Signed in as ${user.username}`
            : 'Your inbox at a glance'
        }
      />

      <PullToRefresh onRefresh={() => loadSummary(true)} refreshing={refreshing}>
        <main className="mx-auto max-w-lg px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <HiTrendingUp className="h-4 w-4 text-brand" />
              Last 24 hours
            </div>
            <button
              type="button"
              onClick={() => loadSummary(true)}
              disabled={loading || refreshing}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              <HiRefresh
                className={`h-4 w-4 ${loading || refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => loadSummary()}
                className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand"
              >
                Try again
              </button>
            </div>
          ) : null}

          {loading && !summary ? <HomeSkeleton /> : null}

          {summary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SummaryStatCard
                  label="New leads"
                  value={totals?.last_24h ?? 0}
                  hint={`${totals?.last_7d ?? 0} this week`}
                />
                <SummaryStatCard
                  label="Website orders"
                  value={highlights?.website_orders_24h ?? 0}
                  hint="24h"
                />
                <SummaryStatCard
                  label="Contact forms"
                  value={highlights?.contact_24h ?? 0}
                  hint="24h"
                />
                <SummaryStatCard
                  label="Service inquiries"
                  value={highlights?.service_inquiries_24h ?? 0}
                  hint="24h"
                />
              </div>

              {typeChips.length > 0 ? (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">By type</h2>
                    <Link
                      to={chipType ? `/inbox?type=${chipType}` : '/inbox'}
                      className="text-xs font-semibold text-brand"
                    >
                      Open inbox →
                    </Link>
                  </div>
                  <FilterChipRow value={chipType} onChange={setChipType} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {typeChips.map(([type, count]) => {
                      const meta = TYPE_META[type] || { label: type }
                      return (
                        <Link
                          key={type}
                          to={`/inbox?type=${type}`}
                          className="rounded-xl border border-white/10 bg-surface-card px-3 py-2 text-xs text-white/80 transition hover:border-brand/40"
                        >
                          <span className="font-semibold text-white">{count}</span>{' '}
                          {meta.label}
                        </Link>
                      )
                    })}
                  </div>
                </section>
              ) : null}

              <section className="rounded-2xl border border-white/10 bg-surface-card p-4">
                <h2 className="text-sm font-semibold text-white">Payments</h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-white/50">Pending deposits</p>
                    <p className="mt-1 text-xl font-bold text-amber-400">
                      {payments?.pending_deposits ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Paid (24h)</p>
                    <p className="mt-1 text-xl font-bold text-emerald-400">
                      {payments?.successful_deposits_24h ?? 0}
                    </p>
                  </div>
                </div>
              </section>

              <Link
                to="/inbox"
                className="flex min-h-[44px] items-center justify-center rounded-2xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                View all leads
              </Link>
            </div>
          ) : null}

          {!loading && !error && !summary ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">
              No activity data yet. Pull down to refresh.
            </div>
          ) : null}
        </main>
      </PullToRefresh>
    </>
  )
}
