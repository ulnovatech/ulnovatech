import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiArrowRight, FiCheck, FiLock, FiZap } from 'react-icons/fi';
import { apiEndpoints } from '../../site.config';
import { formatUgx, getPlanById, pricingPlans } from '../../config/packages';
import { orderCountries, wizardSteps } from './orderWizardConfig';

const emptyForm = {
  websiteName: '',
  template: '',
  phone: '',
  countryCode: '+256',
  country: 'UG',
  fullName: '',
  email: '',
  businessName: '',
  notes: '',
  package: 'smart',
};

export default function GamifiedOrderWizard({ templateName = '', templateData = null }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    ...emptyForm,
    websiteName: templateName,
    template: templateName,
  });
  const [paying, setPaying] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  const currentStep = wizardSteps[step];
  const selectedPlan = getPlanById(form.package);
  const progress = useMemo(() => Math.round(((step + 1) / wizardSteps.length) * 100), [step]);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (code) => {
    const country = orderCountries.find((item) => item.code === code);
    if (!country) return;
    setForm((prev) => ({
      ...prev,
      country: country.code,
      countryCode: country.dial,
      phone: '',
    }));
  };

  const validateStep = () => {
    if (currentStep.id === 'contact') {
      if (!form.fullName.trim()) return 'Please enter your full name.';
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        return 'Please enter a valid email address.';
      }
      if (!form.phone.trim()) return 'Please enter your phone number.';
      return null;
    }

    if (currentStep.id === 'project') {
      if (!form.websiteName.trim()) return 'Please enter a template or website name.';
      return null;
    }

    return null;
  };

  const goNext = () => {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    if (step < wizardSteps.length - 1) setStep((value) => value + 1);
  };

  const goBack = () => {
    if (step > 0) setStep((value) => value - 1);
  };

  const startPayment = async () => {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }

    setPaying(true);
    try {
      const response = await fetch(apiEndpoints.paymentInit, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          template: form.template || form.websiteName,
          websiteName: form.websiteName,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.payment_link) {
        toast.success('Opening secure checkout…');
        window.location.href = result.payment_link;
        return;
      }

      if (result.code === 'payments_not_configured') {
        toast.error(result.message);
        return;
      }

      toast.error(result.message || 'Could not start payment. Please try again.');
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const requestQuoteOnly = async () => {
    setQuoteSubmitting(true);
    try {
      const response = await fetch(apiEndpoints.order, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          template: form.template || form.websiteName,
          websiteName: form.websiteName,
        }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);
        setForm({
          ...emptyForm,
          websiteName: templateName,
          template: templateName,
        });
        setStep(0);
      } else {
        toast.error(result.message || 'Could not submit quote request.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Step {step + 1} of {wizardSteps.length}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">{currentStep.emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentStep.title}</h2>
              <p className="text-sm text-gray-600">{currentStep.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-brand">
          {progress}% complete
        </div>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-orange-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {templateData && step === 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-orange-100 bg-orange-50/60">
          <div className="grid gap-4 p-4 sm:grid-cols-[120px_1fr] sm:items-center">
            <img
              src={templateData.mainImage}
              alt={templateData.title}
              className="h-24 w-full rounded-lg object-cover"
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-brand">Selected template</p>
              <h3 className="font-semibold text-gray-900">{templateData.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{templateData.description}</p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-[280px] animate-fade-in">
        {currentStep.id === 'package' && (
          <div className="grid gap-4 sm:grid-cols-3">
            {pricingPlans.map((plan) => {
              const selected = form.package === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => updateField('package', plan.id)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    selected
                      ? 'border-brand bg-orange-50 shadow-md ring-2 ring-brand/20'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {plan.badge === 'popular' && (
                    <span className="absolute -top-2 right-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      Popular
                    </span>
                  )}
                  {plan.badge === 'best-value' && (
                    <span className="absolute -top-2 right-3 rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      Best value
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{plan.title}</h4>
                      <p className="mt-1 text-lg font-bold text-brand">{formatUgx(plan.priceUgx)}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Deposit today: <span className="font-semibold text-gray-700">{formatUgx(plan.depositUgx)}</span>
                      </p>
                    </div>
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        selected ? 'border-brand bg-brand text-white' : 'border-gray-300'
                      }`}
                    >
                      {selected && <FiCheck className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {currentStep.id === 'contact' && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Full name *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="you@business.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Phone *</label>
              <div className="flex gap-2">
                <select
                  value={form.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-28 rounded-lg border border-gray-300 px-3 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {orderCountries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Business name</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="Optional"
              />
            </div>
          </div>
        )}

        {currentStep.id === 'project' && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Template / website name *</label>
              <input
                type="text"
                value={form.websiteName}
                onChange={(e) => {
                  updateField('websiteName', e.target.value);
                  updateField('template', e.target.value);
                }}
                disabled={!!templateName}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-gray-100"
                placeholder="e.g. Health Clinic Website"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Notes or custom requests</label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="Timeline, branding, features you need…"
              />
            </div>
          </div>
        )}

        {currentStep.id === 'pay' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="font-semibold text-gray-900">Order summary</h3>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Template</dt>
                  <dd className="font-medium text-gray-900">{form.websiteName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Package</dt>
                  <dd className="font-medium text-gray-900">{selectedPlan.title}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Package total</dt>
                  <dd className="text-gray-700">{formatUgx(selectedPlan.priceUgx)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-gray-200 pt-2">
                  <dt className="font-semibold text-gray-900">Deposit due now</dt>
                  <dd className="text-lg font-bold text-brand">{formatUgx(selectedPlan.depositUgx)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
              <FiZap className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <p>
                Pay your deposit with <strong>MTN MoMo</strong>, <strong>Airtel Money</strong>, card, or bank transfer via Flutterwave.
                Your template is reserved immediately after payment.
              </p>
            </div>

            <button
              type="button"
              onClick={startPayment}
              disabled={paying}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiLock className="h-5 w-5" />
              {paying ? 'Starting checkout…' : `Pay ${formatUgx(selectedPlan.depositUgx)} & reserve`}
            </button>

            <button
              type="button"
              onClick={requestQuoteOnly}
              disabled={quoteSubmitting || paying}
              className="w-full text-center text-sm font-medium text-gray-600 underline-offset-2 hover:text-brand hover:underline disabled:opacity-60"
            >
              {quoteSubmitting ? 'Sending quote request…' : 'Skip payment — request a quote only'}
            </button>
          </div>
        )}
      </div>

      {currentStep.id !== 'pay' && (
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiArrowLeft />
            Back
          </button>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Continue
            <FiArrowRight />
          </button>
        </div>
      )}

      {currentStep.id === 'pay' && step > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand"
          >
            <FiArrowLeft />
            Edit details
          </button>
        </div>
      )}
    </div>
  );
}
