import React from 'react'

export default function KPICard({title, value, delta, icon}) {
  const deltaIsPositive = typeof delta === 'string' ? delta.startsWith('+') : (delta > 0)
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div className="text-sm text-muted">{title}</div>
        <div className="text-xs text-muted">{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="kpi-value">{value}</div>
          <div className="text-sm text-muted mt-1">{deltaIsPositive ? <span className="text-green-400">{delta} ↑</span> : <span className="text-rose-400">{delta} ↓</span>}</div>
        </div>
      </div>
    </div>
  )
}
