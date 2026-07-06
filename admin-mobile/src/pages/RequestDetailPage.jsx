import { useCallback, useEffect, useMemo, useState } from 'react'
import { HiArrowLeft, HiCheckCircle, HiClipboardCopy } from 'react-icons/hi'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EngageBar, { copyWithToast } from '../components/EngageBar'
import PaymentSummaryCard from '../components/PaymentSummaryCard'
import RequestTypeChip from '../components/RequestTypeChip'
import { apiFetch, ApiError } from '../services/api'
import { markContactedWithToast } from '../services/requests'
import {
  formatDateTime,
  getRequestDisplayName,
  parseOrderDetails,
} from '../utils/requestHelpers'

function MetaRow({ label, value, copyable = false }) {
  if (!value) return null

  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-white/40">
          {label}
        </p>
        <p className="mt-1 break-words text-sm text-white">{value}</p>
      </div>
      {copyable ? (
        <button
          type="button"
          onClick={() => copyWithToast(value, `${label} copied`)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/60 hover:text-white"
          aria-label={`Copy ${label}`}
        >
          <HiClipboardCopy className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  )
}

export default function RequestDetailPage() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [marking, setMarking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch(`/requests/${encodeURIComponent(type)}/${encodeURIComponent(id)}`)
      setRequest(data)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not load this lead'
      setError(message)
      setRequest(null)
    } finally {
      setLoading(false)
    }
  }, [type, id])

  useEffect(() => {
    load()
  }, [load])

  const orderMeta = useMemo(() => {
    if (!request || request.request_type !== 'website_order') return null
    const parsed = parseOrderDetails(request.description || '')
    const raw = request.raw || {}
    return {
      template: raw.template || parsed.template,
      package: parsed.package,
      business: raw.business || parsed.business,
      notes: parsed.notes,
      tx_ref: request.payment?.tx_ref || parsed.tx_ref,
    }
  }, [request])

  const payment = request?.payment ?? null
  const contacted = Boolean(request?.contacted)
  const displayName = getRequestDisplayName(request)

  async function handleMarkContacted() {
    if (!request || contacted || marking) return
    setMarking(true)
    try {
      await markContactedWithToast(request.request_type, request.source_id, (data) => {
        setRequest((prev) =>
          prev
            ? {
                ...prev,
                contacted: true,
                contact: data.contact ?? prev.contact,
              }
            : prev,
        )
      })
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface pb-36 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-surface/95 px-4 pb-4 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/80"
            aria-label="Go back"
          >
            <HiArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
            ) : (
              <>
                <h1 className="truncate text-lg font-bold">{displayName}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {request ? <RequestTypeChip type={request.request_type} /> : null}
                  {contacted ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                      <HiCheckCircle className="h-3.5 w-3.5" />
                      Contacted
                    </span>
                  ) : null}
                  {request?.submitted_at ? (
                    <span className="text-xs text-white/40">
                      {formatDateTime(request.submitted_at)}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <p>{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand"
            >
              Try again
            </button>
            <Link to="/inbox" className="mt-3 block text-xs text-white/50">
              Back to inbox
            </Link>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-2xl bg-surface-card" />
            <div className="h-48 animate-pulse rounded-2xl bg-surface-card" />
          </div>
        ) : null}

        {request ? (
          <div className="space-y-4">
            {!contacted ? (
              <button
                type="button"
                onClick={handleMarkContacted}
                disabled={marking}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-brand/40 bg-brand/10 py-3 text-sm font-semibold text-brand transition hover:bg-brand/20 disabled:opacity-60"
              >
                <HiCheckCircle className="h-5 w-5" />
                {marking ? 'Saving…' : 'Mark as contacted'}
              </button>
            ) : request.contact?.contacted_at ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Contacted {formatDateTime(request.contact.contacted_at)}
                {request.contact.contacted_by ? (
                  <span className="text-emerald-200/70">
                    {' '}
                    · {request.contact.contacted_by}
                  </span>
                ) : null}
              </div>
            ) : null}

            {payment ? <PaymentSummaryCard payment={payment} /> : null}

            <section className="rounded-2xl border border-white/10 bg-surface-card p-4">
              <h2 className="text-sm font-semibold text-white">Message</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                {request.description || 'No message provided.'}
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-surface-card px-4">
              <h2 className="pt-4 text-sm font-semibold text-white">Contact</h2>
              <MetaRow label="Phone" value={request.phone} copyable />
              <MetaRow label="Email" value={request.email} copyable />
            </section>

            {orderMeta ? (
              <section className="rounded-2xl border border-white/10 bg-surface-card px-4">
                <h2 className="pt-4 text-sm font-semibold text-white">Order details</h2>
                <MetaRow label="Template" value={orderMeta.template} copyable />
                <MetaRow label="Package" value={orderMeta.package} />
                <MetaRow label="Business" value={orderMeta.business} />
                <MetaRow label="Payment ref" value={orderMeta.tx_ref} copyable />
                {orderMeta.notes ? (
                  <MetaRow label="Notes" value={orderMeta.notes} />
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}
      </main>

      {request ? (
        <EngageBar
          phone={request.phone}
          email={request.email}
          whatsapp={request.phone}
        />
      ) : null}
    </div>
  )
}
