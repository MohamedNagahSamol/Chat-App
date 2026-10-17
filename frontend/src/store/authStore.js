import api from '../utils/axios'
import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  authChecked: false,
  authRequestId: 0,

  checkAuth: async () => {
    const { authChecked, authRequestId } = get()
    if (authChecked) return
    
    try {
      const { data } = await api.get('/api/auth/check')
      if (get().authRequestId === authRequestId) {
        set({ user: data, loading: false, authChecked: true })
      }
    } catch {
      if (get().authRequestId === authRequestId) {
        set({ user: null, loading: false, authChecked: true })
      }
    }
  },

  login: async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token)
    }
    set((state) => ({
      authChecked: false,
      loading: true,
      authRequestId: state.authRequestId + 1,
    }))
    await get().checkAuth()
  },

  register: async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password })
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token)
    }
    set((state) => ({
      authChecked: false,
      loading: true,
      authRequestId: state.authRequestId + 1,
    }))
    await get().checkAuth()
  },

  updateProfile: async (pimage) => {
    if (pimage instanceof FormData) {
      const { data } = await api.put('/api/auth/update-profile', pimage, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data.user) set({ user: data.user })
      return data
    }
    const { data } = await api.put('/api/auth/update-profile', { pimage })
    if (data.user) set({ user: data.user })
    return data
  },

  googleLogin: async (credential) => {
    const res = await api.post('/api/auth/google', { credential })
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token)
    }
    set((state) => ({
      authChecked: false,
      loading: true,
      authRequestId: state.authRequestId + 1,
    }))
    await get().checkAuth()
  },

  deleteAccount: async () => {
    try {
      await api.delete('/api/auth/delete-account')
    } finally {
      localStorage.removeItem('token')
      set({ user: null })
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout')
    } finally {
      localStorage.removeItem('token')
      set((state) => ({
        user: null,
        loading: false,
        authChecked: true,
        authRequestId: state.authRequestId + 1,
      }))
    }
  },
}))

export default useAuthStore
