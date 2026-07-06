import { useState } from 'react'
import { siteConfig } from '../../site.config'
import HeroTypedText from './HeroTypedText'
import { FaPlayCircle } from 'react-icons/fa'
import Reveal from '../motion/Reveal'

export default function HeroSection() {
  const [expanded, setExpanded] = useState(false)

  return (
    <section id="hero" className="relative isolate scroll-mt-24 overflow-hidden bg-[#000910] text-white">
      <img
        src="/assets/img/ulnova3.jpg"
        alt=""
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
        loading="eager"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <Reveal y={10}>
            <HeroTypedText />
          </Reveal>

          <Reveal delay={0.05} y={12}>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg">
              Creative tech experts crafting custom digital solutions that fit your needs.
              {!expanded ? (
                <>
                  <span className="sr-only"> More text hidden.</span>
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="ml-2 inline-flex items-center font-semibold text-brand hover:text-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#000910]"
                  >
                    Read More
                  </button>
                </>
              ) : (
                <>
                  <span className="inline">
                    {' '}
                    We’re a team of skilled tech artisans and designers dedicated to making and delivering apps,
                    websites, graphics, animations, and more.
                    <br />
                    <br />— built to work your way, tailored to every client’s vision and needs. Our team ensures that
                    every project combines creativity, usability, and technology to deliver outstanding results.
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="ml-2 inline-flex items-center font-semibold text-brand hover:text-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#000910]"
                  >
                    Read Less
                  </button>
                </>
              )}
            </p>
          </Reveal>

          <Reveal delay={0.1} y={12}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <a
                href={siteConfig.links.getStarted}
                className="inline-flex items-center justify-center rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#000910]"
              >
                Get Started
              </a>

              <a
                href="https://www.youtube.com/watch?v=Y7f98aduVJ8"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#000910]"
              >
                <FaPlayCircle className="text-lg" />
                Watch Video
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

