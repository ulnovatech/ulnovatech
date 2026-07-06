import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import PhoneInput from './PhoneInput'
import { defaultDialCode } from './CountrySelect'
import { apiEndpoints } from '../../site.config'
import { useFormSubmit } from '../../lib/useFormSubmit'

const steps = [
  { id: 'name', title: 'Your name', subtitle: 'How should we address you?', required: true, type: 'text', placeholder: 'Your name' },
  { id: 'phone', title: 'Phone number', subtitle: 'So we can reach you quickly', required: true, type: 'phone' },
  { id: 'email', title: 'Email address', subtitle: 'For updates about your inquiry', required: true, type: 'email', placeholder: 'you@company.com' },
  { id: 'subject', title: 'Subject', subtitle: 'What is this about?', required: true, type: 'text', placeholder: 'Project subject' },
  { id: 'message', title: 'Message', subtitle: 'Tell us what you need', required: true, type: 'textarea', placeholder: 'Write your message…' },
]

const empty = {
  name: '',
  dialCode: defaultDialCode,
  phone: '',
  email: '',
  subject: '',
  message: '',
}

export default function GamifiedContactForm() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(empty)
  const [done, setDone] = useState(false)

  const { submit, loading } = useFormSubmit({
    url: apiEndpoints.contact,
    onSuccess: () => setDone(true),
  })

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step])
  const current = steps[step]

  const validateStep = () => {
    if (current.id === 'phone') {
      if (!form.phone.trim()) return 'Please enter your phone number.'
      return null
    }
    const value = form[current.id]?.trim?.() ?? form[current.id]
    if (current.required && !value) return `Please fill in ${current.title.toLowerCase()}.`
    if (current.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address.'
    }
    return null
  }

  const goNext = () => {
    const err = validateStep()
    if (err) {
      toast.error(err)
      return
    }
    if (step < steps.length - 1) setStep((s) => s + 1)
  }

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const handleSubmit = async () => {
    const err = validateStep()
    if (err) {
      toast.error(err)
      return
    }
    await submit({
      name: form.name.trim(),
      phone: `${form.dialCode}${form.phone.trim()}`,
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    })
  }

  const reset = () => {
    setForm(empty)
    setStep(0)
    setDone(false)
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-xl font-semibold text-gray-900">Message sent!</h3>
        <p className="mt-2 text-sm text-gray-600">We received your inquiry and will get back to you soon.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand">Get in touch</p>
          <h3 className="text-xl font-semibold text-gray-900">{current.title}</h3>
          <p className="text-sm text-gray-600">{current.subtitle}</p>
        </div>
        <div className="text-right text-sm font-medium text-brand">{progress}%</div>
      </div>

      <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-6 space-y-4">
        {current.type === 'phone' ? (
          <PhoneInput
            dialCode={form.dialCode}
            onDialCodeChange={(dialCode) => setForm((f) => ({ ...f, dialCode }))}
            phone={form.phone}
            onPhoneChange={(phone) => setForm((f) => ({ ...f, phone }))}
          />
        ) : current.type === 'textarea' ? (
          <textarea
            rows={5}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder={current.placeholder}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        ) : (
          <input
            type={current.type === 'email' ? 'email' : 'text'}
            value={form[current.id]}
            onChange={(e) => setForm((f) => ({ ...f, [current.id]: e.target.value }))}
            placeholder={current.placeholder}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={goBack}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
        )}

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="ml-auto rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="ml-auto rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send message'}
          </button>
        )}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={`h-2 w-2 rounded-full ${i <= step ? 'bg-brand' : 'bg-gray-200'}`}
          />
        ))}
      </div>
    </div>
  )
}
