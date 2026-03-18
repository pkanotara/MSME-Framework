import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let queue = []

const processQueue = (error, token = null) => {
  queue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (error.response.data?.code === 'TOKEN_EXPIRED') {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            queue.push({ resolve, reject })
          }).then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
        }
        original._retry = true
        isRefreshing = true
        try {
          const refreshToken = localStorage.getItem('refreshToken')
          const role = localStorage.getItem('userRole')
          const res = await axios.post('/api/auth/refresh', { refreshToken, role })
          const { accessToken, refreshToken: newRefresh } = res.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefresh)
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
          processQueue(null, accessToken)
          original.headers.Authorization = `Bearer ${accessToken}`
          return api(original)
        } catch (err) {
          processQueue(err, null)
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(err)
        } finally {
          isRefreshing = false
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
