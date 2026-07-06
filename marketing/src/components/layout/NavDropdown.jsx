import { useEffect, useRef, useState } from 'react'

function NavLink({ item, onNavigate, className = '', style, ...rest }) {
  if (!item.href) {
    return (
      <span className={className} style={style} {...rest}>
        {item.label}
      </span>
    )
  }

  const isExternal = item.href.startsWith('http')

  return (
    <a
      href={item.href}
      className={className}
      style={style}
      onClick={onNavigate}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {item.label}
    </a>
  )
}

function DropdownPanel({ items, depth = 0, onNavigate }) {
  return (
    <ul
      className={`min-w-[14rem] rounded-xl border border-slate-700/80 bg-[#0b1218] py-2 shadow-xl ${
        depth > 0 ? 'ml-1' : ''
      }`}
    >
      {items.map((item) => (
        <NavDropdownItem key={`${item.label}-${depth}`} item={item} depth={depth} onNavigate={onNavigate} />
      ))}
    </ul>
  )
}

function NavDropdownItem({ item, depth, onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  if (item.children?.length) {
    return (
      <li ref={ref} className="relative">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5 hover:text-brand"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span>{item.label}</span>
          <span className={`text-xs transition ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {open && (
          <div className={`${depth === 0 ? 'absolute left-0 top-full z-50 pt-2' : 'pl-3 pt-1'}`}>
            <DropdownPanel items={item.children} depth={depth + 1} onNavigate={onNavigate} />
          </div>
        )}
      </li>
    )
  }

  return (
    <li>
      <NavLink
        item={item}
        onNavigate={onNavigate}
        className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 hover:text-brand"
      />
    </li>
  )
}

/** Desktop dropdown (single or nested). */
export default function NavDropdown({ label, items, onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const handleNavigate = () => {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <li ref={ref} className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-slate-200 transition hover:text-brand"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <span className={`text-xs transition ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <DropdownPanel items={items} onNavigate={handleNavigate} />
        </div>
      )}
    </li>
  )
}

export { NavLink, DropdownPanel }
