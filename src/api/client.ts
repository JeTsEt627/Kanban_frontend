import axios from 'axios'

// Use environment variable VITE_BACKEND_URL to point to backend (e.g. http://localhost:8000)
// Fallback to empty string which will make requests relative to current origin (not recommended).
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BACKEND,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
