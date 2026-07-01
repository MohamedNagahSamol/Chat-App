import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await register(name, email, password)
      toast.success('Registered!')
      navigate('/chat')
    } catch (err) {
      const msg = err.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0]?.msg || 'Registration failed' : msg || 'Registration failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>OBJ Chat</h1>
        <h2>Create account</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            id="reg-name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
          <input
            type="email"
            name="email"
            id="reg-email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="password"
            name="password"
            id="reg-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button type="submit">Register</button>
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
                toast.success('Signed up with Google')
                navigate('/chat')
              } catch (err) {
                toast.error(err.response?.data?.message || 'Google signup failed')
              }
            }}
            onError={() => toast.error('Google signup failed')}
          />
        </div>
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
