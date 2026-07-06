import { Link } from 'react-router-dom'
import RequestTypeChip from './RequestTypeChip'
import {
  formatRelativeTime,
  getDescriptionPreview,
  getRequestDisplayName,
} from '../utils/requestHelpers'

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?'
}

export default function RequestCard({ request }) {
  const name = getRequestDisplayName(request)
  const detailPath = `/inbox/${request.request_type}/${request.source_id}`

  return (
    <Link
      to={detailPath}
      className="block rounded-2xl border border-white/10 bg-surface-card p-4 transition active:scale-[0.99] hover:border-white/20"
    >
      <div className="flex items-start gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-sm font-bold text-brand">
          {initials(name)}
          {request.contacted ? (
            <span
              className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-surface-card bg-emerald-400"
              title="Contacted"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold text-white">{name}</p>
            <span className="shrink-0 text-xs text-white/40">
              {formatRelativeTime(request.submitted_at)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <RequestTypeChip type={request.request_type} />
            {request.contacted ? (
              <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                Contacted
              </span>
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-white/55">
            {getDescriptionPreview(request.description)}
          </p>
          {request.phone ? (
            <p className="mt-2 text-xs text-white/35">{request.phone}</p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
