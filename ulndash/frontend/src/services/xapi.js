// src/services/api.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = text; }

  if (!res.ok) {
    const message = (data && data.error) ? data.error : (res.statusText || 'API error');
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export const CompaniesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams({ ...params }).toString();
    return request(`/companies${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/companies/${encodeURIComponent(id)}`),
  create: (payload) =>
    request(`/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/companies/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  remove: (id) => request(`/companies/${encodeURIComponent(id)}`, { method: "DELETE" }),
  listInteractions: (companyId) =>
    request(`/companies/${encodeURIComponent(companyId)}/interactions`),
  createInteraction: (payload) =>
    request(`/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  importSpreadsheet: (formData) =>
    fetch(`${API_BASE}/import/companies`, { method: "POST", body: formData }).then(async (res) => {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }),

  // Dashboard stats endpoints
  stats: () => request(`/stats`),
  activity: (params = {}) => {
    const qs = new URLSearchParams({ ...params }).toString();
    return request(`/stats/activity${qs ? `?${qs}` : ""}`);
  },
  topIndustries: () => request(`/stats/industries/top`),
};

// ✅ FIXED: Rewrite RequestsAPI to use `request()` instead of `api.get/post`
export const RequestsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/requests${qs ? `?${qs}` : ""}`);
  },
  get: (id) => request(`/requests/${encodeURIComponent(id)}`),
  convertToCompany: (id) =>
    request(`/requests/${encodeURIComponent(id)}/convert`, { method: "POST" }),
};
