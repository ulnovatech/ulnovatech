import toast from 'react-hot-toast'
import { apiFetch, ApiError } from './api'

export async function markRequestContacted(type, id, notes = '') {
  return apiFetch(
    `/requests/${encodeURIComponent(type)}/${encodeURIComponent(id)}/contacted`,
    {
      method: 'POST',
      body: JSON.stringify({
        channel: 'mobile',
        notes: notes || undefined,
      }),
    },
  )
}

export async function markContactedWithToast(type, id, onSuccess) {
  try {
    const data = await markRequestContacted(type, id)
    toast.success('Marked as contacted')
    onSuccess?.(data)
    return data
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : 'Could not update contact status'
    toast.error(message)
    throw err
  }
}
