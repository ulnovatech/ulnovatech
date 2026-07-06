import SectionTitle from './SectionTitle'
import {
  FaBriefcase,
  FaClipboardCheck,
  FaChartBar,
  FaBinoculars,
  FaSun,
  FaCalendarAlt,
  FaArrowRight,
} from 'react-icons/fa'

export default function ServicesExtendedSection({ onOpenInquiry }) {
  const items = [
    {
      id: 'graphics',
      icon: <FaBriefcase />,
      title: 'UI/UX Design',
      description: 'We craft clean, intuitive interfaces that look great and feel natural for your users.',
      inquiryId: null,
      href: '/service-details.html',
    },
    {
      id: 'webdesign',
      icon: <FaClipboardCheck />,
      title: 'API Integration',
      description:
        'Seamlessly connect your app or website with payment systems like MTN MOMO, Airtel Money, Banks, CRMs, or external services.',
      inquiryId: null,
      href: '/service-details.html',
    },
    {
      id: 'webdesign',
      icon: <FaChartBar />,
      title: 'E-commerce Solutions',
      description: 'Launch a secure online store with full inventory, payment, and customer features.',
      inquiryId: 'web',
      href: '/service-details.html',
    },
    {
      id: 'marketing',
      icon: <FaBinoculars />,
      title: 'Digital Marketing',
      description:
        'We help you reach the right audience through smart SEO, social media, content, and online ad strategies — built to grow your brand and sales.',
      inquiryId: 'marketing',
      href: '/service-details.html',
    },
    {
      id: 'services',
      icon: <FaSun />,
      title: 'Maintenance & Support',
      description: 'Ongoing updates, bug fixes, and tech help to keep your product running smoothly.',
      inquiryId: null,
      href: '/service-details.html',
    },
    {
      id: 'services',
      icon: <FaCalendarAlt />,
      title: 'Tech Consulting',
      description: 'Get expert advice on the right tools, platforms, or strategy for your project.',
      inquiryId: null,
      href: '/service-details.html',
    },
  ]

  return (
    <section id="services-2" className="scroll-mt-24 bg-gray-50 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Services" description="CHECK OUT OUR SERVICES" />

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.title}
              className="group relative flex gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-brand/40 hover:shadow-md"
            >
              <div className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <span className="text-lg">{item.icon}</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={item.href}
                    className="truncate text-base font-semibold text-gray-900 hover:text-brand"
                    aria-label={item.title}
                  >
                    {item.title}
                  </a>
                  <FaArrowRight className="mt-1 shrink-0 text-gray-300 transition group-hover:text-brand" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>

                {item.inquiryId && typeof onOpenInquiry === 'function' ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => onOpenInquiry(item.inquiryId)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    >
                      Request a quote <span aria-hidden="true">→</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

