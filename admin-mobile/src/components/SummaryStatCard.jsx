export default function SummaryStatCard({ label, value, hint, onClick }) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={[
        'rounded-2xl border border-white/10 bg-surface-card p-4 text-left transition',
        onClick ? 'hover:border-brand/40 active:scale-[0.98]' : '',
      ].join(' ')}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-white/50">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </Tag>
  )
}
