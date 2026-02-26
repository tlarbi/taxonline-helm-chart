import axios from 'axios'

const api = axios.create({
  baseURL: (window as any).__TAXONLINE_CONFIG__?.apiUrl ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Inject token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) => {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    return api.post('/auth/login', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  me: () => api.get('/auth/me'),
  listUsers: () => api.get('/auth/users'),
  createUser: (data: any) => api.post('/auth/users', data),
}

// ── Upload ────────────────────────────────────────────────────────────────
export const uploadApi = {
  uploadDocuments: (files: File[], meta: any) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    Object.entries(meta).forEach(([k, v]) => form.append(k, String(v)))
    return api.post('/upload/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  listDocuments: (params?: any) => api.get('/upload/documents', { params }),
  deleteDocument: (id: number) => api.delete(`/upload/documents/${id}`),
}

// ── Pipeline ──────────────────────────────────────────────────────────────
export const pipelineApi = {
  getJob: (id: number) => api.get(`/pipeline/jobs/${id}`),
  listJobs: (params?: any) => api.get('/pipeline/jobs', { params }),
  rollbackJob: (id: number) => api.post(`/pipeline/jobs/${id}/rollback`),
}

// ── Metrics ───────────────────────────────────────────────────────────────
export const metricsApi = {
  health: () => api.get('/metrics/health'),
  realtime: () => api.get('/metrics/realtime'),
  performance: (hours?: number) => api.get('/metrics/performance', { params: { hours } }),
}

// ── Analytics ─────────────────────────────────────────────────────────────
export const analyticsApi = {
  coverage: () => api.get('/analytics/coverage'),
  heatmap: (days?: number) => api.get('/analytics/heatmap', { params: { days } }),
  topQueries: (params?: any) => api.get('/analytics/top-queries', { params }),
  userBehavior: (days?: number) => api.get('/analytics/user-behavior', { params: { days } }),
  export: (format: string, table: string, days: number) =>
    api.get('/analytics/export', { params: { format, table, days }, responseType: 'blob' }),
}

// ── Tests ─────────────────────────────────────────────────────────────────
export const testsApi = {
  listCases: (domain?: string) => api.get('/tests/cases', { params: { domain } }),
  createCase: (data: any) => api.post('/tests/cases', data),
  updateCase: (id: number, data: any) => api.put(`/tests/cases/${id}`, data),
  deleteCase: (id: number) => api.delete(`/tests/cases/${id}`),
  listRuns: () => api.get('/tests/runs'),
  createRun: (data: any) => api.post('/tests/runs', data),
  getRun: (id: number) => api.get(`/tests/runs/${id}`),
}

// ── Chunks ────────────────────────────────────────────────────────────────
export const chunksApi = {
  search: (q: string, domain?: string) => api.get('/chunks/search', { params: { q, domain } }),
  get: (id: string) => api.get(`/chunks/${id}`),
  update: (id: string, data: any) => api.put(`/chunks/${id}`, data),
  delete: (id: string) => api.delete(`/chunks/${id}`),
  reindex: (docId: number) => api.post(`/chunks/reindex/${docId}`),
}

// ── WebSocket helper ──────────────────────────────────────────────────────
export function createPipelineSocket(jobId: number, onMessage: (e: any) => void): WebSocket {
  const wsBase = (window as any).__TAXONLINE_CONFIG__?.wsUrl ?? '/ws'
  const token = localStorage.getItem('access_token') ?? ''
  const ws = new WebSocket(`${wsBase}/pipeline/ws/${jobId}?token=${token}`)
  ws.onmessage = (e) => onMessage(JSON.parse(e.data))
  return ws
}
