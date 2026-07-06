import StarsBackground from './StarsBackground'

export default function PortfolioBannerSection() {
  return (
    <section className="bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-3xl bg-black shadow-[0_0_24px_rgba(255,255,255,0.08)]"
          role="region"
          aria-label="Portfolio banner section"
        >
          <StarsBackground />

          <div className="relative z-10 grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Check Out Our Portfolio</h2>
              <p className="mt-3 text-base text-white/75">Beautiful proof of work</p>
              <a
                href="/portfolio-details.html"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                View Past Projects
              </a>
            </div>

            <div className="flex justify-center lg:justify-end">
              <img
                className="w-[520px] max-w-full select-none"
                src="/assets/img/laptop-trs.png"
                alt="Open Laptop"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

