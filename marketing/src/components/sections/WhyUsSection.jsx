import SectionTitle from './SectionTitle'
import { FaUsers, FaClock, FaCoins, FaAward } from 'react-icons/fa'

export default function WhyUsSection() {
  const cards = [
    {
      icon: <FaUsers />,
      title: 'Expert & Professional Team',
      description:
        'We’re a team of skilled people who love what we do. You can count on us to handle your project with care and creativity.',
      tone: 'bg-blue-600',
    },
    {
      icon: <FaClock />,
      title: 'Quick Delivery',
      description: 'We work fast without cutting corners. Your order gets to you on time so you don’t have to wait around.',
      tone: 'bg-sky-500',
    },
    {
      icon: <FaCoins />,
      title: 'Affordable Price',
      description: 'Good quality doesn’t always mean expensive. We keep our prices fair so you get real value for your money.',
      tone: 'bg-emerald-600',
    },
    {
      icon: <FaAward />,
      title: 'Satisfaction Guarantee',
      description: 'We want you to be happy with our work. If something isn’t right, we’ll fix it until you’re satisfied.',
      tone: 'bg-amber-500',
    },
  ]

  return (
    <section id="why" className="scroll-mt-24 bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Why Choose Us"
          description="We’re here to make things easier for you. Our services are built around your needs, so you can get started without stress."
          align="center"
        />

        <div className="grid gap-5 md:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone} text-white`}>
                  <span className="text-lg">{card.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

