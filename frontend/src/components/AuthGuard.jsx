import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function AuthGuard({ children }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
