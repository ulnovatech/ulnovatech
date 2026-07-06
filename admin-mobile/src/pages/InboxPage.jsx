import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HiInbox, HiSearch } from 'react-icons/hi'
import { useSearchParams } from 'react-router-dom'
import FilterChipRow from '../components/FilterChipRow'
import InboxSkeleton from '../components/InboxSkeleton'
import PullToRefresh from '../components/PullToRefresh'
import RequestCard from '../components/RequestCard'
import TopBar from '../components/layout/TopBar'
import { useOnAppResume } from '../hooks/useAppResume'
import { useRequests } from '../hooks/useRequests'

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const typeFilter = searchParams.get('type') || ''
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const debouncedQuery = useDebouncedValue(query)
  const loadMoreRef = useRef(null)

  useEffect(() => {
    const current = searchParams.get('q') || ''
    if (debouncedQuery === current) return
    const next = new URLSearchParams(searchParams)
    if (debouncedQuery) next.set('q', debouncedQuery)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }, [debouncedQuery, searchParams, setSearchParams])

  const { rows, meta, loading, loadingMore, refreshing, error, refresh, loadMore, hasMore } =
    useRequests({ type: typeFilter, q: debouncedQuery })

  const handleResume = useCallback(() => {
    refresh()
  }, [refresh])

  useOnAppResume(handleResume)

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '120px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore, rows.length])

  const empty = !loading && !error && rows.length === 0
  const subtitle = useMemo(() => {
    if (meta.total === 0) return 'No leads yet'
    return `${meta.total} lead${meta.total === 1 ? '' : 's'}`
  }, [meta.total])

  return (
    <>
      <TopBar title="Inbox" subtitle={subtitle} />

      <PullToRefresh onRefresh={refresh} refreshing={refreshing}>
        <main className="mx-auto max-w-lg px-4 py-4">
          <div className="relative mb-4">
            <HiSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, email…"
              className="w-full rounded-xl border border-white/10 bg-surface-card py-3 pl-10 pr-4 text-sm text-white outline-none ring-brand focus:border-brand focus:ring-1"
            />
          </div>

          <div className="mb-4">
            <FilterChipRow
              value={typeFilter}
              onChange={(type) => {
                const next = new URLSearchParams(searchParams)
                if (type) next.set('type', type)
                else next.delete('type')
                setSearchParams(next)
              }}
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <p>{error}</p>
              <button
                type="button"
                onClick={refresh}
                className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand"
              >
                Try again
              </button>
            </div>
          ) : null}

          {loading && rows.length === 0 ? <InboxSkeleton /> : null}

          {rows.length > 0 ? (
            <div className="space-y-3">
              {rows.map((row) => (
                <RequestCard key={`${row.request_type}-${row.source_id}`} request={row} />
              ))}
            </div>
          ) : null}

          {empty ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-card">
                <HiInbox className="h-7 w-7 text-brand" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-white">Inbox is clear</h2>
              <p className="mt-2 max-w-xs text-sm text-white/50">
                New leads from forms and orders will show up here. Pull down to refresh.
              </p>
            </div>
          ) : null}

          {hasMore ? (
            <div ref={loadMoreRef} className="py-6 text-center text-xs text-white/40">
              {loadingMore ? 'Loading more…' : 'Scroll for more'}
            </div>
          ) : null}
        </main>
      </PullToRefresh>
    </>
  )
}
