import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.adminLogin(username, password)
      // Preserve where the user was headed (e.g. /checkin-admin?ticket=...)
      const params = new URLSearchParams(location.search)
      const redirectTo = params.get('redirect') || '/admin'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fullscreen-msg">
      <form onSubmit={handleSubmit} className="card-surface" style={{ padding: '2.5rem', width: '100%', maxWidth: 380, textAlign: 'left' }}>
        <div className="eyebrow" style={{ marginBottom: '1rem' }}>GRV Admin</div>
        <h2 style={{ marginBottom: '1.5rem' }}>Sign in</h2>

        <div className="field">
          <label>Username</label>
          <input required value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <div style={{ color: 'var(--destructive)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
