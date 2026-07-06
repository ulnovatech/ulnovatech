import { REQUEST_TYPES } from '../constants/requestTypes'

export default function FilterChipRow({ value, onChange }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
      {REQUEST_TYPES.map((item) => {
        const active = (value || '') === item.key
        return (
          <button
            key={item.key || 'all'}
            type="button"
            onClick={() => onChange(item.key)}
            className={[
              'shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition',
              active
                ? 'bg-brand text-white'
                : 'border border-white/10 bg-surface-card text-white/70 hover:text-white',
            ].join(' ')}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
