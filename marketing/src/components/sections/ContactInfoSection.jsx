import { siteConfig } from '../../site.config'
import SectionTitle from './SectionTitle'
import { FaMapMarkerAlt, FaEnvelope, FaPhoneAlt } from 'react-icons/fa'

export default function ContactInfoSection() {
  return (
    <section id="contact" className="scroll-mt-24 bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Contact" description="Let's talk about your project." align="center" />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm transition hover:shadow-md">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <FaMapMarkerAlt />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                <b>Address</b>
              </h3>
              <p className="mt-2 text-sm text-gray-700">{siteConfig.location}</p>
              {siteConfig.addressNote ? <p className="mt-1 text-xs text-gray-500">{siteConfig.addressNote}</p> : null}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm transition hover:shadow-md">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <FaEnvelope />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                <b>Email Us</b>
              </h3>
              <a
                href={`mailto:${siteConfig.email}`}
                className="mt-2 inline-block text-sm font-semibold text-gray-800 hover:text-brand"
              >
                {siteConfig.email}
              </a>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm transition hover:shadow-md">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <FaPhoneAlt />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                <b>Lets Talk</b>
              </h3>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-semibold">
                {siteConfig.phones.slice(0, 2).map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/\s+/g, '')}`} className="text-gray-800 hover:text-brand">
                    {phone}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <p className="text-sm leading-relaxed text-gray-700">
              Prefer WhatsApp? Use the floating button or message us directly.
            </p>
            <a
              href={siteConfig.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Chat on WhatsApp
            </a>

            <div className="mt-6 border-t border-gray-200 pt-5">
              <p className="text-sm font-semibold text-gray-900">Quick links</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="#services"
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:border-brand/50 hover:text-brand"
                >
                  Services
                </a>
                <a
                  href={siteConfig.links.portfolio}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:border-brand/50 hover:text-brand"
                >
                  Portfolio
                </a>
                <a
                  href={siteConfig.links.about}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:border-brand/50 hover:text-brand"
                >
                  About
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

