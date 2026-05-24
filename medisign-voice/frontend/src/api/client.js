const API_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('medisign_token');
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.errors = data.errors;
    throw err;
  }
  return data;
}

export const api = {
  auth: {
    login: (body) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    me: () => apiRequest('/auth/me'),
  },
  patients: {
    list: () => apiRequest('/patients'),
    me: () => apiRequest('/patients/me'),
    get: (id) => apiRequest(`/patients/${id}`),
    create: (body) => apiRequest('/patients', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiRequest(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => apiRequest(`/patients/${id}`, { method: 'DELETE' }),
  },
  doctors: {
    list: () => apiRequest('/doctors'),
    me: () => apiRequest('/doctors/me'),
    create: (body) => apiRequest('/doctors', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiRequest(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => apiRequest(`/doctors/${id}`, { method: 'DELETE' }),
  },
  wards: {
    list: () => apiRequest('/wards'),
    create: (body) => apiRequest('/wards', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiRequest(`/wards/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => apiRequest(`/wards/${id}`, { method: 'DELETE' }),
  },
  templates: {
    list: () => apiRequest('/templates'),
    create: (body) => apiRequest('/templates', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiRequest(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => apiRequest(`/templates/${id}`, { method: 'DELETE' }),
  },
  requests: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return apiRequest(`/requests${q ? `?${q}` : ''}`);
    },
    create: (body) => apiRequest('/requests', { method: 'POST', body: JSON.stringify(body) }),
    handled: (id) => apiRequest(`/requests/${id}/handled`, { method: 'PATCH' }),
    analytics: () => apiRequest('/requests/analytics'),
  },
  notes: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return apiRequest(`/notes${q ? `?${q}` : ''}`);
    },
    create: (body) => apiRequest('/notes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiRequest(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => apiRequest(`/notes/${id}`, { method: 'DELETE' }),
  },
  ai: {
    improve: (body) => apiRequest('/ai/improve-message', { method: 'POST', body: JSON.stringify(body) }),
    urgency: (body) => apiRequest('/ai/detect-urgency', { method: 'POST', body: JSON.stringify(body) }),
  },
  voice: {
    generate: (body) => apiRequest('/voice/generate', { method: 'POST', body: JSON.stringify(body) }),
  },
  audit: {
    list: () => apiRequest('/audit'),
  },
};
