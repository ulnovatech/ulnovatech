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
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Secure checkout</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">
            Reserve your website in minutes
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Pick a package, pay a small deposit with Flutterwave (MoMo, card, or bank), and we lock your template instantly.
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
              <ol className="space-y-4 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">1</span>
                  <span>Choose your package and tell us about your business.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">2</span>
                  <span>Pay your deposit securely via Flutterwave.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">3</span>
                  <span>We reserve your template and contact you within 24 hours.</span>
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
