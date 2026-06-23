import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function request(path, options = {}) {
  const token = await getToken()

  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 204) return null

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Request failed')

  return json.data !== undefined ? json.data : json
}

export const getDocs = () =>
  request('/api/documents')

export const createDoc = (body) =>
  request('/api/documents', { method: 'POST', body: JSON.stringify(body) })

export const getDoc = (id) =>
  request(`/api/documents/${id}`)

export const updateDoc = (id, body) =>
  request(`/api/documents/${id}`, { method: 'PATCH', body: JSON.stringify(body) })

export const deleteDoc = (id) =>
  request(`/api/documents/${id}`, { method: 'DELETE' })

export const shareDoc = (id, email) =>
  request(`/api/documents/${id}/share`, { method: 'POST', body: JSON.stringify({ email }) })

export const getShares = (id) =>
  request(`/api/documents/${id}/shares`)

export const uploadFile = async (file) => {
  const token = await getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Upload failed')
  return json.data !== undefined ? json.data : json
}
