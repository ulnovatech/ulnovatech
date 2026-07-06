import { useEffect } from 'react'
import { FiCheckCircle } from 'react-icons/fi'
import Reveal from '../components/motion/Reveal'
import { aboutStats } from '../config/pricing'
import { siteConfig } from '../site.config'

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About Us — UlnovaTech'
  }, [])

  return (
    <>
      <section className="bg-[#000910] py-16 text-white md:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">About UlnovaTech</p>
            <h1 className="mt-3 text-3xl font-bold md:text-5xl">Your tech partner from concept to launch — and beyond</h1>
          </Reveal>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <img
              src="/assets/img/about.jpg"
              alt="UlnovaTech team at work"
              className="w-full rounded-2xl object-cover shadow-lg"
              onError={(e) => {
                e.currentTarget.src = siteConfig.links.logo
              }}
            />
            <div className="mt-6 space-y-4 text-gray-600">
              <p>
                At UlnovaTech, we believe every great idea deserves a solid digital foundation. We turn concepts into
                dependable digital solutions — custom software, robust websites, and intuitive mobile apps.
              </p>
              <p>
                We are dedicated problem solvers who thrive on real-world challenges: school management platforms,
                SACCO automation, high-performance websites, and more — with innovation, accuracy, and genuine care.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="space-y-6">
              <p className="text-lg italic text-gray-700">
                Our commitment to excellence is at the heart of everything we do. We work with integrity and efficiency,
                keeping today&apos;s users front and center.
              </p>
              <div>
                <h2 className="text-xl font-bold text-gray-900">What sets us apart</h2>
                <ul className="mt-4 space-y-3">
                  {[
                    'Human-centered design that drives satisfaction and engagement',
                    'Innovative design & engineering — visually striking and reliable',
                    'Continuous growth with scalable, future-ready technology',
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-gray-600">
                      <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <img
                src="/assets/img/about-2.jpg"
                alt="UlnovaTech collaboration"
                className="w-full rounded-2xl object-cover shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {aboutStats.map((stat) => (
            <Reveal key={stat.label}>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center shadow-sm">
                <div className="text-3xl" aria-hidden="true">
                  {stat.icon}
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}
