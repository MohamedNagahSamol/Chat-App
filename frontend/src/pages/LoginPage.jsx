import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Logged in')
      navigate('/chat')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>OBJ Chat</h1>
        <h2>Welcome back</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            id="login-email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="password"
            name="password"
            id="login-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit">Sign In</button>
        </form>
        <div className="google-divider">
          <span className="divider-label">or continue with</span>
        </div>
        <div className="google-btn-wrap">
          <GoogleLogin
            theme="outline"
            size="large"
            shape="pill"
            text="signin_with"
            width={300}
            logo_alignment="center"
            onSuccess={async (credentialResponse) => {
              try {
                await useAuthStore.getState().googleLogin(credentialResponse.credential)
                toast.success('Logged in with Google')
                navigate('/chat')
              } catch (err) {
                toast.error(err.response?.data?.message || 'Google login failed')
              }
            }}
            onError={() => toast.error('Google login failed')}
          />
        </div>
        <p className="auth-link">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
