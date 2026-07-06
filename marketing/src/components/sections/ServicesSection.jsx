import SectionTitle from './SectionTitle'
import { FaBroadcastTower, FaChalkboardTeacher, FaCogs, FaArrowRight } from 'react-icons/fa'

export default function ServicesSection({ onOpenInquiry }) {
  const cards = [
    {
      id: 'software',
      image: '/assets/img/services-1.jpg',
      icon: <FaCogs className="text-white" />,
      title: 'Custom Software Development',
      description: 'We build powerful backend systems, automation tools, and business platforms to perfectly fit your workflow.',
      href: '/service-details.html',
      inquiryId: null,
    },
    {
      id: 'webapp',
      image: '/assets/img/services-2.jpg',
      icon: <FaBroadcastTower className="text-white" />,
      title: 'Web & Mobile App Development',
      description: 'From sleek websites to scalable mobile apps — we design, develop, and deploy full-stack digital solutions.',
      href: '/service-details.html',
      inquiryId: 'app',
    },
    {
      id: 'it',
      image: '/assets/img/services.jpg',
      icon: <FaChalkboardTeacher className="text-white" />,
      title: 'IT Services & Technical Support',
      description: 'Infrastructure setup, network installations, tech consulting, and reliable support to keep your systems running smoothly.',
      href: '/service-details.html',
      inquiryId: null,
    },
  ]

  return (
    <section id="services" className="scroll-mt-24 bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Services" description="Featured Services" />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, idx) => (
            <article
              key={card.id}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                  src={card.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              </div>

              <div className="relative p-6">
                <div className="-mt-12 mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand shadow-sm ring-1 ring-black/5">
                  {card.icon}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <a href={card.href} className="text-lg font-semibold text-gray-900 hover:text-brand">
                    {card.title}
                  </a>
                  <FaArrowRight className="mt-1 shrink-0 text-gray-300 transition group-hover:text-brand" />
                </div>

                <p className="mt-3 text-sm leading-relaxed text-gray-600">{card.description}</p>

                {card.inquiryId && typeof onOpenInquiry === 'function' ? (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => onOpenInquiry(card.inquiryId)}
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

