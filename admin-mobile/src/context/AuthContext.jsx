import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiFetch, clearToken, getToken, setToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = await getToken()
    if (!token) {
      setUser(null)
      return null
    }

    try {
      const data = await apiFetch('/auth/mobile/me')
      setUser(data.user ?? data)
      return data.user ?? data
    } catch {
      await clearToken()
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await refresh()
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [refresh])

  const login = useCallback(async (username, password) => {
    const data = await apiFetch('/auth/mobile/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })

    if (!data.token) {
      throw new Error('Login did not return a token')
    }

    await setToken(data.token)
    setUser(data.user ?? null)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/mobile/logout', { method: 'POST', body: '{}' })
    } catch {
      // Stateless logout — clear local token regardless
    }
    await clearToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refresh,
    }),
    [user, loading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
