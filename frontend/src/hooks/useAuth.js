import { useMemo, useState } from 'react'
import { loginUser, registerUser } from '../api'

const STORAGE_KEY = 'sweetshop.auth'

const readStoredAuth = () => {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export function useAuth() {
  const [auth, setAuth] = useState(() => readStoredAuth())
  const isAuthenticated = useMemo(() => Boolean(auth?.access), [auth])

  const persist = (payload) => {
    setAuth(payload)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    }
  }

  const clear = () => {
    setAuth(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  const performLogin = async (credentials) => {
    const data = await loginUser(credentials)
    persist({ access: data.access, refresh: data.refresh, user: data.user })
    return data.user
  }

  const register = async (payload) => {
    await registerUser(payload)
    await performLogin({ username: payload.username, password: payload.password })
  }

  return {
    auth,
    isAuthenticated,
    login: performLogin,
    register,
    logout: clear,
  }
}
