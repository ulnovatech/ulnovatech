/**
 * Standardized POST helper for PHP form handlers.
 * Expects JSON: { status: 'success'|'error', message: string }
 */
export async function submitForm(url, formData) {
  const response = await fetch(url, {
    method: 'POST',
    body: formData instanceof FormData ? formData : objectToFormData(formData),
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('Invalid server response. Please try again.')
  }

  if (!response.ok || data.status !== 'success') {
    throw new Error(data.message || 'Submission failed. Please try again.')
  }

  return data
}

function objectToFormData(obj) {
  const fd = new FormData()
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      fd.append(key, String(value))
    }
  })
  return fd
}
