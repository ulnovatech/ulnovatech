import { useState } from 'react'
import PhoneInput from './PhoneInput'
import { defaultDialCode } from './CountrySelect'
import { useFormSubmit } from '../../lib/useFormSubmit'

const initial = { name: '', dialCode: defaultDialCode, phone: '', description: '' }

export default function ServiceInquiryForm({ endpoint, onSuccess }) {
  const [form, setForm] = useState(initial)
  const { submit, loading } = useFormSubmit({
    url: endpoint,
    onSuccess: () => {
      setForm(initial)
      onSuccess?.()
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await submit({
      name: form.name.trim(),
      phone: `${form.dialCode}${form.phone.trim()}`,
      description: form.description.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
        <PhoneInput
          dialCode={form.dialCode}
          onDialCodeChange={(dialCode) => setForm((f) => ({ ...f, dialCode }))}
          phone={form.phone}
          onPhoneChange={(phone) => setForm((f) => ({ ...f, phone }))}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Project details</label>
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          placeholder="What are you looking to build?"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Sending…' : 'Send inquiry'}
      </button>
    </form>
  )
}
