import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  BriefcaseIcon,
  ChartBarIcon,
  BookOpenIcon,
  PhoneIcon,
  MagnifyingGlassCircleIcon,
} from '@heroicons/react/24/outline'
import { PresentationChartBarIcon } from '@heroicons/react/24/solid'
import ulnLogo from '../assets/uln-logo.png'
import { appLinks } from '../site.config'

function externalAppLink(href, label, Icon) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-sm transition text-muted hover:bg-gray-800/40"
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </a>
  )
}

export default function Sidebar() {
  const navItem = (to, label, Icon) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-sm transition ${
          isActive
            ? 'bg-gradient-to-r from-accent-purple/20 to-accent-blue/10 text-white shadow-neon-lg'
            : 'text-muted hover:bg-gray-800/40'
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  )

  return (
    <aside className="w-60 bg-bg-800 border-r border-gray-800 p-4 flex flex-col gap-6">
      <div className="flex items-center gap-3 px-2">
        <img
          src={ulnLogo}
          alt="UlnovaTech Logo"
          className="w-10 h-10 rounded-lg object-contain p-1"
        />
        <div>
          <div className="text-white font-semibold">Ulnova Tech</div>
          <div className="text-xs text-muted">Reachout Dashboard</div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItem('/', 'Dashboard', ChartBarIcon)}
        {navItem('/prospects', 'Prospects', PhoneIcon)}
        {navItem('/companies', 'Companies', BriefcaseIcon)}
        {navItem('/requests', 'Requests', ChartBarIcon)}
        {navItem('/analytics', 'Analytics', PresentationChartBarIcon)}
        {navItem('/competitors', 'Competition', PresentationChartBarIcon)}
        {navItem('/goal', 'Goals', PresentationChartBarIcon)}
        {navItem('/templates', 'Templates', BookOpenIcon)}
        {navItem('/blog', 'Blog', BookOpenIcon)}
      </nav>

      <div className="border-t border-gray-800 pt-4">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider px-4 mb-2">
          Apps
        </h3>
        <div className="flex flex-col gap-1">
          {externalAppLink(appLinks.discoveryIntelligence, 'Discovery Intelligence', MagnifyingGlassCircleIcon)}
          {externalAppLink(appLinks.homeSite, 'Home Site', HomeIcon)}
          {externalAppLink(appLinks.blog, 'Blog', BookOpenIcon)}
          {externalAppLink(appLinks.portfolio, 'Portfolio', BriefcaseIcon)}
        </div>
      </div>
    </aside>
  )
}
