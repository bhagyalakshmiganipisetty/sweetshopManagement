const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
const METRICS_URL = import.meta.env.VITE_METRICS_URL || 'http://localhost:5001/metrics/sweets'

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  if (!response.ok) {
    const message = data.detail || 'Unexpected error'
    throw new Error(message)
  }
  return data
}

export const registerUser = (payload) => request('/auth/register/', { method: 'POST', body: payload })

export const loginUser = (payload) => request('/auth/login/', { method: 'POST', body: payload })

export const fetchSweets = ({ token, filters = {} }) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value)
  })
  const query = params.toString()
  return request(`/sweets/${query ? `?${query}` : ''}`, { token })
}

export const createSweet = ({ token, payload }) =>
  request('/sweets/', { method: 'POST', body: payload, token })

export const updateSweet = ({ token, sweetId, payload }) =>
  request(`/sweets/${sweetId}/`, { method: 'PUT', body: payload, token })

export const deleteSweet = ({ token, sweetId }) =>
  request(`/sweets/${sweetId}/`, { method: 'DELETE', token })

export const purchaseSweet = ({ token, sweetId, amount }) =>
  request(`/sweets/${sweetId}/purchase/`, { method: 'POST', body: { amount }, token })

export const restockSweet = ({ token, sweetId, amount }) =>
  request(`/sweets/${sweetId}/restock/`, { method: 'POST', body: { amount }, token })

export const fetchMetrics = async () => {
  try {
    const response = await fetch(METRICS_URL)
    if (!response.ok) return []
    return response.json()
  } catch (error) {
    console.warn('Metrics API not reachable', error)
    return []
  }
}
