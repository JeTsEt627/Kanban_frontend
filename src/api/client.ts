import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // если backend использует httpOnly cookie
})

// Добавляем токен из localStorage в header Authorization, если есть
api.interceptors.request.use(config => {
  try {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  } catch (e) {
    // ignore
  }
  return config
})

export default api
