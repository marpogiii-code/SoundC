const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('soundc_token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  put: (endpoint, data) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
