import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const isNetworkError = (err) => {
    return !err?.response || err?.code === 'ERR_NETWORK' || (typeof err?.message === 'string' && err.message.includes('Network Error'))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await register(name, email, password)
      toast.success('Registered!')
      navigate('/chat')
    } catch (err) {
      if (isNetworkError(err)) {
        toast.error('Server is unreachable. Please check your network connection or try again later.')
      } else {
        const msg = err.response?.data?.message
        toast.error(Array.isArray(msg) ? msg[0]?.msg || 'Registration failed' : msg || 'Registration failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>OBJ Chat</h1>
        <h2>Create account</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="reg-name" className="sr-only">Name</label>
          <input
            type="text"
            name="name"
            id="reg-name"
            aria-label="Name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={isSubmitting}
            required
          />
          <label htmlFor="reg-email" className="sr-only">Email</label>
          <input
            type="email"
            name="email"
            id="reg-email"
            aria-label="Email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
            required
          />
          <label htmlFor="reg-password" className="sr-only">Password</label>
          <input
            type="password"
            name="password"
            id="reg-password"
            aria-label="Password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
            required
          />
          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                <span>Registering...</span>
              </>
            ) : (
              'Register'
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
            text="signup_with"
            width="280"
            logo_alignment="center"
            disabled={isSubmitting}
            onSuccess={async (credentialResponse) => {
              if (isSubmitting) return
              setIsSubmitting(true)
              try {
                await useAuthStore.getState().googleLogin(credentialResponse.credential)
                toast.success('Signed up with Google')
                navigate('/chat')
              } catch (err) {
                if (isNetworkError(err)) {
                  toast.error('Server is unreachable. Please check your network connection or try again later.')
                } else {
                  toast.error(err.response?.data?.message || 'Google signup failed')
                }
                setIsSubmitting(false)
              }
            }}
            onError={() => {
              if (typeof navigator !== 'undefined' && !navigator.onLine) {
                toast.error('Server is unreachable. Please check your network connection or try again later.')
              } else {
                toast.error('Google signup failed. Please check your network connection or try again.')
              }
              setIsSubmitting(false)
            }}
          />
        </div>
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </main>
  )
}
