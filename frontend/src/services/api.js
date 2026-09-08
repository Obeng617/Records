const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...options.headers
    },
    cache: 'no-store',
    ...options
  };

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = isGet ? `${API_BASE}${endpoint}${separator}_t=${Date.now()}` : `${API_BASE}${endpoint}`;

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Clients
  getClients: (search = '') => request(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getClientById: (id) => request(`/clients/${id}`),
  createClient: (clientData) => request('/clients', {
    method: 'POST',
    body: JSON.stringify(clientData)
  }),
  deleteClient: (id) => request(`/clients/${id}`, {
    method: 'DELETE'
  }),

  // Transactions
  addTransaction: (clientId, txData) => request(`/clients/${clientId}/transactions`, {
    method: 'POST',
    body: JSON.stringify(txData)
  }),
  deleteTransaction: (transactionId) => request(`/transactions/${transactionId}`, {
    method: 'DELETE'
  }),
  getClientTransactions: (clientId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    const queryString = params.toString();
    return request(`/clients/${clientId}/transactions${queryString ? `?${queryString}` : ''}`);
  },
  getGlobalTransactions: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    const queryString = params.toString();
    return request(`/transactions${queryString ? `?${queryString}` : ''}`);
  },

  // Stats
  getDashboardStats: () => request('/dashboard/stats'),

  // Foodstuffs Scheme Module (Isolated)
  getContributors: (search = '') => request(`/contributors${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getContributorById: (id) => request(`/contributors/${id}`),
  createContributor: (data) => request('/contributors', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteContributor: (id) => request(`/contributors/${id}`, {
    method: 'DELETE'
  }),
  getContributorPayments: (id, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    const queryString = params.toString();
    return request(`/contributors/${id}/contributions${queryString ? `?${queryString}` : ''}`);
  },
  toggleContribution: (contributorId, toggleData) => request(`/contributors/${contributorId}/contributions/toggle`, {
    method: 'POST',
    body: JSON.stringify(toggleData)
  }),
  batchToggleContributions: (batchData) => request('/contributions/batch-toggle', {
    method: 'POST',
    body: JSON.stringify(batchData)
  }),
  getWeeklyContributions: (weekDate) => request(`/contributions/week${weekDate ? `?week_date=${weekDate}` : ''}`),
  getContributionStats: () => request('/contributions/stats')
};
