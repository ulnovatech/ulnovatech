import { NavLink } from 'react-router-dom'
import { HiHome, HiInbox, HiCog } from 'react-icons/hi'

const tabs = [
  { to: '/', label: 'Home', icon: HiHome, end: true },
  { to: '/inbox', label: 'Inbox', icon: HiInbox },
  { to: '/settings', label: 'Settings', icon: HiCog },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-surface-card/95 backdrop-blur-md"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex min-w-[4.5rem] flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition',
                isActive
                  ? 'text-brand'
                  : 'text-white/50 hover:text-white/80',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
