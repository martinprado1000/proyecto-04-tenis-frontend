import { createContext, useContext, useEffect, useState } from 'react'
import { apiClient } from '../api/client'

const AuthContext = createContext(null)
const STORAGE_KEY = 'mp_user'
const TOKEN_KEY = 'mp_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      if (user.token) {
        window.sessionStorage.setItem(TOKEN_KEY, user.token)
      }
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY)
      window.sessionStorage.removeItem(TOKEN_KEY)
    }
  }, [user])

  useEffect(() => {
    if (!user?.token) return

    apiClient.get('/auth/check-status')
      .then(({ data }) => {
        setUser((currentUser) => currentUser ? {
          ...currentUser,
          isClient: data.isClient ?? false,
        } : currentUser)
      })
      .catch(() => {})
  }, [user?.token])

  const login = (userData) => setUser(userData)
  const logout = () => setUser(null)

  const isAdmin = user?.rol === 'admin'
  const isSuperadmin = Boolean(user?.isSuperadmin || (Array.isArray(user?.roles) && user.roles.some((r) => String(r).toUpperCase() === 'SUPERADMIN')))
  const isAuthenticated = Boolean(user)

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAdmin, isSuperadmin, isAuthenticated, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
