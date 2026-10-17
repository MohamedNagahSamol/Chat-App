import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const isNetworkError = (err) => {
    return !err?.response || err?.code === 'ERR_NETWORK' || (typeof err?.message === 'string' && err.message.includes('Network Error'))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await login(email, password)
      toast.success('Logged in')
      navigate('/chat')
    } catch (err) {
      if (isNetworkError(err)) {
        toast.error('Server is unreachable. Please check your network connection or try again later.')
      } else {
        toast.error(err.response?.data?.message || 'Login failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>OBJ Chat</h1>
        <h2>Welcome back</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email" className="sr-only">Email</label>
          <input
            type="email"
            name="email"
            id="login-email"
            aria-label="Email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
            required
          />
          <label htmlFor="login-password" className="sr-only">Password</label>
          <input
            type="password"
            name="password"
            id="login-password"
            aria-label="Password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting}
            required
          />
          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        <div className="google-divider">
          <span className="divider-label">or continue with</span>
        </div>
        <div className="google-btn-wrap">
          <GoogleLogin
            theme="filled_black"
            size="large"
            shape="pill"
            text="signin_with"
            width="280"
            logo_alignment="center"
            disabled={isSubmitting}
            onSuccess={async (credentialResponse) => {
              if (isSubmitting) return
              setIsSubmitting(true)
              try {
                await useAuthStore.getState().googleLogin(credentialResponse.credential)
                toast.success('Logged in with Google')
                navigate('/chat')
              } catch (err) {
                if (isNetworkError(err)) {
                  toast.error('Server is unreachable. Please check your network connection or try again later.')
                } else {
                  toast.error(err.response?.data?.message || 'Google login failed')
                }
                setIsSubmitting(false)
              }
            }}
            onError={() => {
              if (typeof navigator !== 'undefined' && !navigator.onLine) {
                toast.error('Server is unreachable. Please check your network connection or try again later.')
              } else {
                toast.error('Google login failed. Please check your network connection or try again.')
              }
              setIsSubmitting(false)
            }}
          />
        </div>
        <p className="auth-link">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </main>
  )
}
