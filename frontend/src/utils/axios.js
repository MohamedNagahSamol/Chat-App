import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://chat-app-backend-production-c2e8.up.railway.app',
  withCredentials: true,
})

export default api
