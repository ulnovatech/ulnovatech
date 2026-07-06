import { useEffect, useState } from 'react'
import { siteConfig } from '../../site.config'
import NavMenu from './NavMenu'
import MobileNav from './MobileNav'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <header
        id="header"
        className={`fixed inset-x-0 top-0 z-40 transition ${
          scrolled ? 'bg-[#000910]/95 shadow-lg backdrop-blur-md' : 'bg-[#000910]/90 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href={siteConfig.links.home} className="mr-auto flex items-center gap-3">
            <img
              src={siteConfig.links.logo}
              alt=""
              className="hidden h-9 w-auto sm:block"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <span className="text-lg font-semibold tracking-tight text-white">{siteConfig.name}</span>
          </a>

          <NavMenu />

          <a
            href={siteConfig.links.getStarted}
            className="hidden rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark sm:inline-flex"
          >
            Get Started
          </a>

          <button
            type="button"
            className="inline-flex rounded-md p-2 text-white hover:bg-white/10 xl:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="h-[4.25rem]" aria-hidden="true" />
    </>
  )
}
