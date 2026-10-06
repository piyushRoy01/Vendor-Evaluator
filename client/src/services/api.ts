const API_BASE = '/api';

export class ApiError extends Error {
  statusCode: number;
  errorCode: string;
  errors?: any;

  constructor(message: string, statusCode: number, errorCode: string, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
  }
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('vendor_eval_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Server response error.' }));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('vendor_eval_token');
      localStorage.removeItem('vendor_eval_user');
      window.dispatchEvent(new Event('auth_logout'));
    }
    throw new ApiError(data.message || 'An error occurred', response.status, data.errorCode || 'UNKNOWN_ERROR', data.errors);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/auth/me'),

  // Vendors
  getVendors: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/vendors${qs ? `?${qs}` : ''}`);
  },
  getVendor: (id: string) => apiRequest(`/vendors/${id}`),
  createVendor: (data: any) => apiRequest('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  updateVendor: (id: string, data: any) => apiRequest(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateVendorStatus: (id: string, status: string) =>
    apiRequest(`/vendors/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // EIC
  getEics: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/eics${qs ? `?${qs}` : ''}`);
  },
  getEic: (id: string) => apiRequest(`/eics/${id}`),
  createEic: (data: any) => apiRequest('/eics', { method: 'POST', body: JSON.stringify(data) }),
  updateEic: (id: string, data: any) => apiRequest(`/eics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Contracts
  getContracts: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/contracts${qs ? `?${qs}` : ''}`);
  },
  getContract: (id: string) => apiRequest(`/contracts/${id}`),
  createContract: (data: any) => apiRequest('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  updateContract: (id: string, data: any) => apiRequest(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assignEic: (contractId: string, eicId: string) =>
    apiRequest(`/contracts/${contractId}/assign-eic`, { method: 'PATCH', body: JSON.stringify({ eicId }) }),
  updateContractStatus: (contractId: string, status: string) =>
    apiRequest(`/contracts/${contractId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Evaluations
  getEvaluations: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/evaluations${qs ? `?${qs}` : ''}`);
  },
  getEvaluation: (id: string) => apiRequest(`/evaluations/${id}`),
  createEvaluationDraft: (data: { poId: string; periodStart: string; periodEnd: string }) =>
    apiRequest('/evaluations', { method: 'POST', body: JSON.stringify(data) }),
  updateEvaluationScores: (id: string, data: any) =>
    apiRequest(`/evaluations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  submitEvaluation: (id: string) => apiRequest(`/evaluations/${id}/submit`, { method: 'POST' }),
  approveEvaluation: (id: string) => apiRequest(`/evaluations/${id}/approve`, { method: 'POST' }),
  returnEvaluation: (id: string, reason: string) =>
    apiRequest(`/evaluations/${id}/return`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Reports
  getDashboard: () => apiRequest('/reports/dashboard'),
  getVendorReport: () => apiRequest('/reports/vendors'),
  getContractReport: () => apiRequest('/reports/contracts'),
  getPerformanceReport: () => apiRequest('/reports/performance'),

  // Audit Logs
  getAuditLogs: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/audit${qs ? `?${qs}` : ''}`);
  },

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/mark-all-read', { method: 'POST' }),

  // Criteria
  getCriteria: () => apiRequest('/criteria'),
  updateCriterion: (id: string, data: any) => apiRequest(`/criteria/${id}`, { method: 'PUT', body: JSON.stringify(data) })
};
