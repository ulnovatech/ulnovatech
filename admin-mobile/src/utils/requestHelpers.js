export function normalizePhone(phone) {
  if (!phone) return ''
  const digits = phone.toString().trim().replace(/[^0-9+]/g, '')
  return digits.startsWith('+') ? digits.substring(1) : digits
}

export function getRequestDisplayName(row) {
  if (!row) return 'Unknown'
  return row.name || row.email || `Lead #${row.source_id}`
}

export function getDescriptionPreview(description, max = 120) {
  if (!description) return 'No message'
  const flat = description.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  return `${flat.slice(0, max)}…`
}

export function parseOrderDetails(description = '') {
  const lines = description.split('\n').map((l) => l.trim()).filter(Boolean)
  const out = {
    package: null,
    template: null,
    business: null,
    notes: null,
    tx_ref: null,
  }

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/i)
    if (!match) continue
    const key = match[1].toLowerCase().replace(/\s+/g, '_')
    const value = match[2].trim()
    if (key in out) out[key] = value
    if (key === 'payment_ref' || key === 'tx_ref' || key === 'reference') {
      out.tx_ref = value
    }
  }

  return out
}

export function formatRelativeTime(dateInput) {
  if (!dateInput) return '—'
  const date = new Date(dateInput.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return dateInput

  const diffSec = Math.round((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '—'
  const date = new Date(dateInput.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return dateInput
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export async function copyToClipboard(text) {
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
