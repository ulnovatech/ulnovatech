import { useState } from 'react'
import NavDropdown, { NavLink } from './NavDropdown'
import { mainNavigation } from '../../site.config'

function MobileAccordionItem({ item, depth = 0, onNavigate }) {
  const [open, setOpen] = useState(false)

  if (item.children?.length) {
    return (
      <div className="border-b border-slate-800">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-white"
          style={{ paddingLeft: `${16 + depth * 12}px` }}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {item.label}
          <span className={`text-xs transition ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {open && (
          <div className="pb-2">
            {item.children.map((child) => (
              <MobileAccordionItem key={child.label} item={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      item={item}
      onNavigate={onNavigate}
      className="block border-b border-slate-800 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-brand"
      style={{ paddingLeft: `${16 + depth * 12}px` }}
    />
  )
}

export default function MobileNav({ open, onClose }) {
  if (!open) return null

  const handleNavigate = () => onClose()

  return (
    <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close menu" />
      <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-[#000910] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
          <span className="text-sm font-semibold text-white">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-300 hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <ul>
            {mainNavigation.map((item) =>
              item.children ? (
                <li key={item.id}>
                  <MobileAccordionItem item={item} onNavigate={handleNavigate} />
                </li>
              ) : (
                <li key={item.id} className="border-b border-slate-800">
                  <NavLink
                    item={item}
                    onNavigate={handleNavigate}
                    className="block px-4 py-3 text-sm font-medium text-white hover:text-brand"
                  />
                </li>
              ),
            )}
          </ul>
        </nav>
      </div>
    </div>
  )
}
