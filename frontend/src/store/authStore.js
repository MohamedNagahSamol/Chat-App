import axios from 'axios'
import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  checkAuth: async () => {
    try {
      const { data } = await axios.get('/api/auth/check')
      set({ user: data, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    await axios.post('/api/auth/login', { email, password })
    await get().checkAuth()
  },

  register: async (name, email, password) => {
    await axios.post('/api/auth/register', { name, email, password })
    await get().checkAuth()
  },

  updateProfile: async (pimage) => {
    if (pimage instanceof FormData) {
      const { data } = await axios.put('/api/auth/update-profile', pimage, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data.user) set({ user: data.user })
      return data
    }
    const { data } = await axios.put('/api/auth/update-profile', { pimage })
    if (data.user) set({ user: data.user })
    return data
  },

  googleLogin: async (credential) => {
    await axios.post('/api/auth/google', { credential })
    await get().checkAuth()
  },

  deleteAccount: async () => {
    await axios.delete('/api/auth/delete-account')
    set({ user: null })
  },

  logout: async () => {
    await axios.post('/api/auth/logout')
    set({ user: null })
  },
}))

export default useAuthStore
