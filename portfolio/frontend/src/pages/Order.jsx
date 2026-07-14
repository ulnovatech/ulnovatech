import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import GamifiedOrderWizard from '../components/order/GamifiedOrderWizard';
import { formatUgx, getPlanById } from '../config/packages';
import { apiEndpoints, siteConfig } from '../site.config';

const Order = () => {
  const [searchParams] = useSearchParams();
  const templateName = searchParams.get('template') || '';

  const templateUrl = templateName
    ? `${apiEndpoints.portfolioDetail}?template=${encodeURIComponent(templateName)}`
    : null;

  const { data: templateData, loading: templateLoading, error: templateError } = useFetch(templateUrl);
  const defaultPlan = getPlanById('smart');

  if (templateLoading && templateName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-brand" />
          <p className="text-gray-600">Loading template details…</p>
        </div>
      </div>
    );
  }

  if (templateError && templateName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <p className="font-medium text-red-600">Could not load template details.</p>
          <Link to="/order" className="mt-4 inline-block font-semibold text-brand hover:underline">
            Continue with a custom order →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Choose your template</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">
            Tell us about your project — then start with a deposit
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Complete a short guided form first. When you&apos;re ready, pay a deposit with Flutterwave
            (MoMo, card, or bank) and we begin building.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <GamifiedOrderWizard templateName={templateName} templateData={templateData} />

          <div className="space-y-6">
            {templateData && (
              <section className="overflow-hidden rounded-xl bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-xl font-bold text-gray-900">Template preview</h3>
                <img
                  src={templateData.mainImage}
                  alt={templateData.title}
                  className="mb-4 h-64 w-full rounded-lg object-cover"
                />
                <h4 className="font-semibold text-gray-900">{templateData.title}</h4>
                <p className="mt-2 text-sm text-gray-600">{templateData.description}</p>
              </section>
            )}

            <section className="rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-xl font-bold text-gray-900">How it works</h3>
              <ol className="space-y-5 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">1</span>
                  <div>
                    <p className="font-semibold text-gray-900">Choose your design</p>
                    <p className="mt-1 text-gray-600">
                      Full ownership of the website is yours once your order is complete.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">2</span>
                  <div>
                    <p className="font-semibold text-gray-900">We build it</p>
                    <p className="mt-1 text-gray-600">
                      After payment, we&apos;ll contact you for your business details and get to work.
                      Customizations are included at no extra cost.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">3</span>
                  <div>
                    <p className="font-semibold text-gray-900">Go live</p>
                    <p className="mt-1 text-gray-600">
                      We&apos;ll set everything up and walk you through going live — including domain
                      name (your business&apos;s website address) options if you need one. No hosting
                      fees, ever.
                    </p>
                  </div>
                </li>
              </ol>
              <p className="mt-4 text-xs text-gray-500">
                Deposits from {formatUgx(defaultPlan.depositUgx)} depending on package. Balance due before launch.
              </p>
            </section>

            <section className="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 p-6">
              <h3 className="text-xl font-bold text-gray-900">Need help choosing?</h3>
              <p className="mt-2 text-sm text-gray-600">Talk to our team before you pay — no pressure.</p>
              <a
                href={siteConfig.scheduleCall}
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
              >
                Schedule a free call
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
