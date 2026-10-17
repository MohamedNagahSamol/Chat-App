import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import AuthGuard from './components/AuthGuard'
import ChatGuard from './components/ChatGuard'
import useAuthStore from './store/authStore'

export default function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<ChatGuard><LoginPage /></ChatGuard>} />
        <Route path="/register" element={<ChatGuard><RegisterPage /></ChatGuard>} />
        <Route
          path="/chat"
          element={
            <AuthGuard>
              <ChatPage />
            </AuthGuard>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<ChatGuard><Navigate to="/chat" replace /></ChatGuard>} />
      </Routes>
    </BrowserRouter>
  )
}
