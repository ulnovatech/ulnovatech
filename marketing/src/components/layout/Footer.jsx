import NewsletterForm from '../forms/NewsletterForm'
import FooterLinks from './FooterLinks'
import { footerServiceLinks, footerUsefulLinks, siteConfig } from '../../site.config'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer id="footer" className="bg-[#000910] text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <a href={siteConfig.links.home} className="inline-flex items-center gap-3">
              <img
                src={siteConfig.links.logo}
                alt={siteConfig.name}
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="text-lg font-semibold text-white">{siteConfig.name}</span>
            </a>
            <p className="mt-4 text-sm text-slate-400">{siteConfig.tagline}</p>
            <div className="mt-5 space-y-2 text-sm text-slate-300">
              <p>{siteConfig.location}</p>
              {siteConfig.phones.map((phone) => (
                <p key={phone}>
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-brand">
                    {phone}
                  </a>
                </p>
              ))}
              <p>
                <a href={`mailto:${siteConfig.email}`} className="hover:text-brand">
                  {siteConfig.email}
                </a>
              </p>
              <p className="text-slate-500">{siteConfig.addressNote}</p>
            </div>
            <div className="mt-5 flex gap-3">
              {Object.entries(siteConfig.social).map(([key, href]) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-slate-700 px-2.5 py-1 text-xs uppercase tracking-wide text-slate-300 hover:border-brand hover:text-brand"
                >
                  {key}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <FooterLinks title="Useful Links" links={footerUsefulLinks} />
          </div>

          <div className="lg:col-span-2">
            <FooterLinks title="Our Services" links={footerServiceLinks} />
          </div>

          <div className="lg:col-span-4">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Our Newsletter</h4>
            <p className="mb-4 text-sm text-slate-400">
              Subscribe for updates about our products and services.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          <p>
            © {year} <strong className="text-slate-300">{siteConfig.name}</strong>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
