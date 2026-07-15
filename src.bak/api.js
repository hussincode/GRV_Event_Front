const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/register', { method: 'POST', body: JSON.stringify(payload) }),
  adminLogin: (username, password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  adminLogout: () => request('/admin/logout', { method: 'POST' }),
  adminMe: () => request('/admin/me'),
  listRegistrations: () => request('/admin/registrations'),
  stats: () => request('/admin/registrations/stats'),
  approve: (id) => request(`/admin/registrations/${id}/approve`, { method: 'POST' }),
  reject: (id) => request(`/admin/registrations/${id}/reject`, { method: 'POST' }),
  checkinLookup: (ticketId) => request(`/checkin/lookup/${encodeURIComponent(ticketId)}`),
  checkin: (ticketId) => request(`/checkin/${encodeURIComponent(ticketId)}`, { method: 'POST' }),
};
