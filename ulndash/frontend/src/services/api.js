const API_BASE =
  import.meta.env.VITE_API_BASE ||
  '/api';

async function request(path, options = {}) {
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${base}/${normalizedPath}`;
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  const defaultHeaders =
    hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {};
  const headers = { ...defaultHeaders, ...(options.headers || {}) };

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = (data && data.error) ? data.error : (res.statusText || 'API error');
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export { request };

export const AuthAPI = {
  me: () => request('/auth/me'),
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

export const CompaniesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/companies${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/companies/${encodeURIComponent(id)}`),
  create: (payload) =>
    request(`/companies`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/companies/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) => request(`/companies/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listInteractions: (companyId) => {
    const qs = new URLSearchParams({ company_id: companyId }).toString();
    return request(`/interactions${qs ? `?${qs}` : ''}`);
  },
  createInteraction: (payload) =>
    request(`/interactions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  importSpreadsheet: (formData) =>
    request(`/import/companies`, {
      method: 'POST',
      body: formData,
      headers: {},
    }),
  stats: () => request(`/companies/stats`),
  activity: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/companies/activity${qs ? `?${qs}` : ''}`);
  },
  topIndustries: () => request(`/companies/top-industries`),
};

export const RequestsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/requests${qs ? `?${qs}` : ''}`);
  },
  get: (type, id) => request(`/requests/${encodeURIComponent(type)}/${encodeURIComponent(id)}`),
  convertToCompany: (id) =>
    request(`/requests/${encodeURIComponent(id)}/convert`, { method: 'POST' }),
};

export const CompetitorsAPI = {
  stats: () => request(`/competitors/stats`),
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/competitors${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/competitors/${encodeURIComponent(id)}`),
  create: (payload) =>
    request(`/competitors`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/competitors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) => request(`/competitors/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  importSpreadsheet: (formData) =>
    request(`/import/competitors`, {
      method: 'POST',
      body: formData,
      headers: {},
    }),
};

export const ProspectsAPI = {
  stats: () => request(`/prospects/stats`),
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/prospects${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/prospects/${encodeURIComponent(id)}`),
  create: (payload) =>
    request(`/prospects`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/prospects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id) => request(`/prospects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  convertToCompany: (id, payload = {}) =>
    request(`/prospects/${encodeURIComponent(id)}/convert`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  importSpreadsheet: (formData) =>
    request(`/import/prospects`, {
      method: 'POST',
      body: formData,
      headers: {},
    }),
};