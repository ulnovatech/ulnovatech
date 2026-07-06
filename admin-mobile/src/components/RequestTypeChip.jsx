import { TYPE_META } from '../constants/requestTypes'

export default function RequestTypeChip({ type, className = '' }) {
  const meta = TYPE_META[type] || { label: 'Unknown', className: 'bg-gray-600/90 text-white' }

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${meta.className} ${className}`}
    >
      {meta.label}
    </span>
  )
}
