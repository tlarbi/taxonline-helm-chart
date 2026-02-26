import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, token } = useAuthStore()
  const navigate = useNavigate()

  if (token) { navigate('/monitoring', { replace: true }); return null }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password)
      navigate('/monitoring', { replace: true })
    } catch {
      toast.error('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080b12', fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(30,37,53,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,37,53,0.4) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '600px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(14,165,233,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: '360px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '48px', height: '48px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#fff',
          }}>T</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.1em' }}>TAXONLINE</div>
          <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '0.15em', marginTop: '4px' }}>ADMIN DASHBOARD</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '8px', padding: '32px',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: '#475569', letterSpacing: '0.1em', marginBottom: '8px' }}>USERNAME</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              required autoFocus
              style={{
                width: '100%', background: '#080b12', border: '1px solid #1e2d3d',
                borderRadius: '4px', color: '#e2e8f0', fontSize: '13px',
                padding: '10px 12px', fontFamily: 'inherit', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '10px', color: '#475569', letterSpacing: '0.1em', marginBottom: '8px' }}>PASSWORD</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', background: '#080b12', border: '1px solid #1e2d3d',
                borderRadius: '4px', color: '#e2e8f0', fontSize: '13px',
                padding: '10px 12px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', background: loading ? '#0c3251' : 'linear-gradient(135deg, #0284c7, #6366f1)',
            border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px',
            fontWeight: 600, letterSpacing: '0.1em', padding: '12px',
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            transition: 'opacity 0.15s',
          }}>
            {loading ? 'AUTHENTICATING...' : '→ SIGN IN'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '10px', color: '#1e2d3d', marginTop: '20px', letterSpacing: '0.05em' }}>
          TaxOnline © 2025 · Algérie
        </div>
      </div>
    </div>
  )
}
