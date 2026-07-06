import NavDropdown, { NavLink } from './NavDropdown'
import { mainNavigation } from '../../site.config'

export default function NavMenu() {
  return (
    <nav id="navmenu" className="hidden xl:block" aria-label="Primary">
      <ul className="flex items-center gap-1">
        {mainNavigation.map((item) =>
          item.children ? (
            <NavDropdown key={item.id} label={item.label} items={item.children} />
          ) : (
            <li key={item.id}>
              <NavLink
                item={item}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-200 transition hover:text-brand"
              />
            </li>
          ),
        )}
      </ul>
    </nav>
  )
}
