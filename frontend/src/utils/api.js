import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('API Request:', config.method.toUpperCase(), config.url)
    console.log('Token in localStorage:', token ? 'Yes' : 'No')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('Authorization header set:', config.headers.Authorization.substring(0, 20) + '...')
    } else {
      console.log('No token available - request will be unauthorized')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized error received')
      console.error('Error details:', error.response?.data)
      console.error('Clearing localStorage')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (userData) => api.post('/api/users/register', userData),
  login: (credentials) => api.post('/api/login', credentials),
  logout: () => api.post('/api/logout'),
  deleteAccount: (userId) => api.delete(`/api/users/${userId}`),
}

export default api
