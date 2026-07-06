import { useState } from 'react'
import { apiEndpoints } from '../../site.config'
import { useFormSubmit } from '../../lib/useFormSubmit'

export default function NewsletterForm({ className = '' }) {
  const [email, setEmail] = useState('')
  const { submit, loading } = useFormSubmit({
    url: apiEndpoints.newsletter,
    onSuccess: () => setEmail(''),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await submit({ email: email.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-2 sm:flex-row ${className}`}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? 'Subscribing…' : 'Subscribe'}
      </button>
    </form>
  )
}
