import api from '../utils/axios'
import { create } from 'zustand'
import { io } from 'socket.io-client'

const useChatStore = create((set, get) => ({
  socket: null,
  users: [],
  messages: [],
  selectedUser: null,
  onlineUsers: [],

  connectSocket: (userId) => {
    const socket = io('/', { query: { userId } })
    set({ socket })

    socket.on('getOnlineUsers', (users) => {
      set({ onlineUsers: users })
    })

    socket.on('newMessage', (message) => {
      const { selectedUser, messages } = get()
      if (
        selectedUser &&
        (message.senderId === selectedUser._id || message.receiverId === selectedUser._id)
      ) {
        set({ messages: [...messages, message] })
      }
    })
  },

  disconnectSocket: () => {
    const { socket } = get()
    if (socket) socket.close()
    set({ socket: null })
  },

  getUsers: async () => {
    const { data } = await api.get('/api/message/user')
    set({ users: data.user })
  },

  getMessages: async (userId) => {
    const { data } = await api.get(`/api/message/${userId}`)
    set({ messages: data.conversations || [] })
  },

  sendMessage: async (userId, message, file, mediaType) => {
    if (file instanceof File) {
      const formData = new FormData()
      formData.append('message', message)
      formData.append(mediaType || 'image', file)
      const { data } = await api.post(`/api/message/send/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      set((state) => ({ messages: [...state.messages, data.newMessage] }))
      return data
    }
    const { data } = await api.post(`/api/message/send/${userId}`, { message, image: file })
    set((state) => ({ messages: [...state.messages, data.newMessage] }))
    return data
  },

  selectUser: (user) => {
    set({ selectedUser: user, messages: [] })
    if (user) get().getMessages(user._id)
  },
}))

export default useChatStore
