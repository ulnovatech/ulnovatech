import { useEffect, useState } from 'react'
import { FiArrowRight, FiCheck } from 'react-icons/fi'
import Reveal from '../components/motion/Reveal'
import { appPackages, formatUgx, websitePackages } from '../config/pricing'

function PriceCard({ pkg }) {
  const price = pkg.priceLabel || formatUgx(pkg.priceUgx)

  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-brand/30 hover:shadow-md">
      {pkg.badge && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
          {pkg.badge}
        </span>
      )}
      <div className="mb-4 flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          {pkg.emoji}
        </span>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{pkg.title}</h3>
          <p className="mt-1 text-xl font-bold text-brand">{price}</p>
        </div>
      </div>
      <p className="text-sm text-gray-500">{pkg.idealFor}</p>
      {pkg.pages && (
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">Pages: {pkg.pages}</p>
      )}
      <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-600">
        {pkg.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm font-medium text-gray-800">{pkg.highlight}</p>
      <a
        href={pkg.cta}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Get started
        <FiArrowRight className="h-4 w-4" />
      </a>
    </article>
  )
}

export default function PricesPage() {
  const [tab, setTab] = useState('websites')

  useEffect(() => {
    document.title = 'Pricing — UlnovaTech'
  }, [])

  const packages = tab === 'websites' ? websitePackages : appPackages

  return (
    <>
      <section className="bg-[#000910] py-16 text-white md:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">Transparent pricing</p>
            <h1 className="mt-3 text-3xl font-bold md:text-5xl">Packages built for Ugandan businesses</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Website templates from our portfolio include deposit checkout. Custom apps and systems — let&apos;s talk.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 flex justify-center">
              <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                {[
                  { id: 'websites', label: 'Websites' },
                  { id: 'apps', label: 'Apps & systems' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                      tab === item.id ? 'bg-brand text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 0.03}>
                <PriceCard pkg={pkg} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <p className="mt-10 text-center text-sm text-gray-500">
              Prices are negotiable for bundled services.{' '}
              <a href="/track-order" className="font-semibold text-brand hover:underline">
                Track an existing order
              </a>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
