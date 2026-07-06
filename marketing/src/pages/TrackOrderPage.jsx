import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiArrowRight, FiCheck, FiSearch } from 'react-icons/fi'
import Reveal from '../components/motion/Reveal'
import PhoneInput from '../components/forms/PhoneInput'
import { defaultDialCode } from '../components/forms/CountrySelect'
import { apiEndpoints, siteConfig } from '../site.config'

const empty = {
  reference: '',
  dialCode: defaultDialCode,
  phone: '',
}

export default function TrackOrderPage() {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)

  const progress = useMemo(() => (order ? 100 : form.reference && form.phone ? 50 : 25), [order, form])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.reference.trim()) {
      toast.error('Enter your payment reference.')
      return
    }
    if (!form.phone.trim()) {
      toast.error('Enter the phone number used when ordering.')
      return
    }

    setLoading(true)
    setOrder(null)
    try {
      const response = await fetch(apiEndpoints.orderStatus, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_ref: form.reference.trim(),
          phone: form.phone.trim(),
          countryCode: form.dialCode,
        }),
      })
      const result = await response.json()

      if (response.ok && result.success) {
        setOrder(result.order)
        toast.success('Order found!')
        return
      }

      toast.error(result.message || 'Could not find your order.')
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setOrder(null)
    setForm(empty)
  }

  return (
    <div className="bg-gradient-to-b from-orange-50/80 to-gray-50 py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">Client portal</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">Track your order</h1>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Enter your payment reference and phone number to see deposit status and next steps.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {order ? 'Your order status' : 'Look up your order'}
                </h2>
                <p className="text-sm text-gray-500">
                  Reference starts with <span className="font-mono text-gray-700">ULN-</span>
                </p>
              </div>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-brand">{progress}%</span>
            </div>

            <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>

            {!order ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Payment reference</label>
                  <input
                    type="text"
                    value={form.reference}
                    onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                    placeholder="ULN-20260101120000-abcd1234"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Phone used at checkout</label>
                  <PhoneInput
                    dialCode={form.dialCode}
                    phone={form.phone}
                    onDialCodeChange={(dialCode) => setForm((f) => ({ ...f, dialCode }))}
                    onPhoneChange={(phone) => setForm((f) => ({ ...f, phone }))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                >
                  <FiSearch />
                  {loading ? 'Looking up…' : 'Track my order'}
                  {!loading && <FiArrowRight />}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                  <p className="text-sm font-medium text-green-800">{order.status_label}</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900">{order.headline}</h3>
                  <p className="mt-2 text-sm text-gray-600">{order.next_step}</p>
                </div>

                <dl className="grid gap-3 rounded-xl bg-gray-50 p-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">Reference</dt>
                    <dd className="font-mono font-medium text-gray-900">{order.reference}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Template</dt>
                    <dd className="font-medium text-gray-900">{order.template}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Package</dt>
                    <dd className="font-medium text-gray-900">{order.package_title}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Deposit</dt>
                    <dd className="font-bold text-brand">{order.deposit_label}</dd>
                  </div>
                </dl>

                <div>
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Progress</h4>
                  <ol className="space-y-3">
                    {order.timeline?.map((step, index) => (
                      <li key={step.id} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            step.done ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {step.done ? <FiCheck className="h-4 w-4" /> : index + 1}
                        </span>
                        <span className={step.done ? 'font-medium text-gray-900' : 'text-gray-500'}>{step.label}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Look up another order
                  </button>
                  <a
                    href={siteConfig.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-brand px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    Chat with support
                  </a>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  )
}
