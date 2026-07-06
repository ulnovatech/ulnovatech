const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

// Generic request helper
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }
  if (!res.ok) throw new Error(data?.error || res.statusText || 'API error');
  return data;
}

// All API endpoints
export const CompaniesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams({ ...params }).toString();
    return request(`/companies${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/companies/${encodeURIComponent(id)}`),
  create: (payload) =>
    request(`/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  update: (id, payload) =>
    request(`/companies/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  remove: (id) =>
    request(`/companies/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listInteractions: (companyId) =>
    request(`/companies/${encodeURIComponent(companyId)}/interactions`),
  createInteraction: (payload) =>
    request(`/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  importCSV: (formData) =>
    fetch(`${API_BASE}/import/companies`, { method: 'POST', body: formData }).then(
      async (res) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
    ),
  stats: () => request(`/stats`)
};
