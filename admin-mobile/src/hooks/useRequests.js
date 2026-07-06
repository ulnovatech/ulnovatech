import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch, ApiError } from '../services/api'

export function useRequests({ type = '', q = '', perPage = 20 } = {}) {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, total_pages: 1, per_page: perPage })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const requestId = useRef(0)

  const buildParams = useCallback(
    (pageNum) => {
      const params = new URLSearchParams({
        page: String(pageNum),
        per_page: String(perPage),
        sort: 'submitted_at',
        dir: 'DESC',
      })
      if (type) params.set('type', type)
      if (q.trim()) params.set('q', q.trim())
      return params.toString()
    },
    [type, q, perPage],
  )

  const fetchPage = useCallback(
    async (pageNum, { append = false, isRefresh = false } = {}) => {
      const id = ++requestId.current
      if (isRefresh) setRefreshing(true)
      else if (append) setLoadingMore(true)
      else setLoading(true)

      setError(null)

      try {
        const data = await apiFetch(`/requests?${buildParams(pageNum)}`)
        if (id !== requestId.current) return

        const nextRows = data.data || []
        setRows((prev) => (append ? [...prev, ...nextRows] : nextRows))
        setPage(data.page || pageNum)
        setMeta({
          total: data.total ?? nextRows.length,
          total_pages: data.total_pages ?? 1,
          per_page: data.per_page ?? perPage,
        })
      } catch (err) {
        if (id !== requestId.current) return
        const message =
          err instanceof ApiError ? err.message : 'Could not load inbox'
        setError(message)
        if (!append) setRows([])
      } finally {
        if (id === requestId.current) {
          setLoading(false)
          setLoadingMore(false)
          setRefreshing(false)
        }
      }
    },
    [buildParams, perPage],
  )

  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  const refresh = useCallback(() => fetchPage(1, { isRefresh: true }), [fetchPage])

  const loadMore = useCallback(() => {
    if (loadingMore || loading || page >= meta.total_pages) return
    fetchPage(page + 1, { append: true })
  }, [fetchPage, loadingMore, loading, page, meta.total_pages])

  const hasMore = page < meta.total_pages

  return {
    rows,
    meta,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    loadMore,
    hasMore,
  }
}
