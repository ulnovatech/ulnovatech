import HeroSection from '../components/sections/HeroSection'
import ServicesSection from '../components/sections/ServicesSection'
import ServicesExtendedSection from '../components/sections/ServicesExtendedSection'
import WhyUsSection from '../components/sections/WhyUsSection'
import ContactInfoSection from '../components/sections/ContactInfoSection'
import PortfolioBannerSection from '../components/sections/PortfolioBannerSection'
import GamifiedContactForm from '../components/forms/GamifiedContactForm'
import Reveal from '../components/motion/Reveal'

export default function HomePage({ onOpenInquiry }) {
  return (
    <>
      <HeroSection />

      <Reveal>
        <ServicesSection onOpenInquiry={onOpenInquiry} />
      </Reveal>

      {/* Real anchors used by nav dropdowns */}
      <div id="webdesign" className="scroll-mt-24" />
      <div id="appdev" className="scroll-mt-24" />
      <div id="marketing" className="scroll-mt-24" />
      <div id="graphics" className="scroll-mt-24" />

      <Reveal delay={0.05}>
        <ServicesExtendedSection onOpenInquiry={onOpenInquiry} />
      </Reveal>

      <Reveal delay={0.05}>
        <WhyUsSection />
      </Reveal>

      <Reveal delay={0.05}>
        <ContactInfoSection />
      </Reveal>

      <section className="bg-white pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm sm:p-8">
              <GamifiedContactForm />
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal delay={0.05}>
        <PortfolioBannerSection />
      </Reveal>
    </>
  )
}

