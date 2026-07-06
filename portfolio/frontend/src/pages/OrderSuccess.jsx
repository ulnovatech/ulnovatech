import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiHome, FiRefreshCw, FiXCircle } from 'react-icons/fi';
import { apiEndpoints, siteConfig } from '../site.config';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref') || searchParams.get('trx_ref') || '';
  const [state, setState] = useState({ loading: true, data: null, error: null });

  const verifyPayment = async () => {
    if (!txRef) {
      setState({
        loading: false,
        data: null,
        error: 'Missing payment reference. Contact us if you were charged.',
      });
      return;
    }

    setState({ loading: true, data: null, error: null });

    try {
      const response = await fetch(apiEndpoints.paymentVerify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_ref: txRef }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setState({ loading: false, data: result, error: null });
        return;
      }

      if (response.status === 202 || result.status === 'pending') {
        setState({
          loading: false,
          data: { status: 'pending', tx_ref: txRef, message: result.message },
          error: null,
        });
        return;
      }

      setState({
        loading: false,
        data: null,
        error: result.message || 'Payment verification failed.',
      });
    } catch (error) {
      console.error(error);
      setState({
        loading: false,
        data: null,
        error: 'Could not verify payment. Try again in a moment.',
      });
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [txRef]);

  if (state.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <h1 className="text-xl font-bold text-gray-900">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-gray-600">Hang tight — we are securing your template.</p>
        </div>
      </div>
    );
  }

  if (state.data?.status === 'successful' || state.data?.success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-green-200 bg-gradient-to-b from-green-50 to-white p-8 text-center shadow-lg">
          <div className="text-5xl mb-4" aria-hidden="true">🎉</div>
          <FiCheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Template reserved!</h1>
          <p className="mt-3 text-gray-600">
            {state.data.message || 'Your deposit is confirmed. Our team will reach out within 24 hours.'}
          </p>

          <dl className="mt-6 space-y-2 rounded-xl bg-white/80 p-4 text-left text-sm">
            {state.data.customer_name && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{state.data.customer_name}</dd>
              </div>
            )}
            {state.data.template && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Template</dt>
                <dd className="font-medium text-gray-900">{state.data.template}</dd>
              </div>
            )}
            {state.data.deposit_label && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Deposit paid</dt>
                <dd className="font-bold text-brand">{state.data.deposit_label}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Reference</dt>
              <dd className="font-mono text-xs text-gray-800">{txRef}</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              <FiHome />
              Browse more templates
            </Link>
            <a
              href="/track-order"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Track order status
            </a>
            <a
              href={siteConfig.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (state.data?.status === 'pending') {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <FiClock className="mx-auto mb-4 h-12 w-12 text-amber-600" />
          <h1 className="text-xl font-bold text-gray-900">Payment processing</h1>
          <p className="mt-3 text-sm text-gray-600">
            {state.data.message || 'Your payment is still being confirmed. This usually takes under a minute.'}
          </p>
          <p className="mt-2 font-mono text-xs text-gray-500">Ref: {txRef}</p>
          <button
            type="button"
            onClick={verifyPayment}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <FiRefreshCw />
            Check again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <FiXCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
        <h1 className="text-xl font-bold text-gray-900">We could not confirm payment</h1>
        <p className="mt-3 text-sm text-gray-600">
          {state.error || 'If you were charged, contact us with your payment reference.'}
        </p>
        {txRef && <p className="mt-2 font-mono text-xs text-gray-500">Ref: {txRef}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={verifyPayment}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <FiRefreshCw />
            Retry verification
          </button>
          <Link
            to="/order"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Back to order
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
