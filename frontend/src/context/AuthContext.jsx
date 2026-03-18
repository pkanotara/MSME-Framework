import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userRole')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role })
    const { accessToken, refreshToken, user: userData } = res.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('userRole', role)
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    setUser(userData)
    return userData
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.clear()
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const isAdmin = user?.role === 'super_admin'
  const isOwner = user?.role === 'restaurant_owner'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isOwner, reload: loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
