import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(232,160,32,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(232,160,32,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 0%, transparent 100%)',
      }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '380px',
        padding: '0 24px',
        animation: 'fadeIn 0.4s var(--ease-out) both',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'var(--accent)',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>
              TaxOnline
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            ADMINISTRATION DASHBOARD
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@taxonline.dz"
              style={{
                width: '100%',
                padding: '11px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '11px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--danger-dim)',
              border: '1px solid rgba(240,80,80,0.2)',
              borderRadius: '4px',
              color: 'var(--danger)',
              fontSize: '13px',
              marginBottom: '16px',
              fontFamily: 'var(--font-mono)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? 'var(--bg-overlay)' : 'var(--accent)',
              border: 'none',
              borderRadius: '4px',
              color: loading ? 'var(--text-muted)' : 'var(--text-inverse)',
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '0.02em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{
          marginTop: '32px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}>
          v1.0.0 — Accès restreint
        </p>
      </div>
    </div>
  )
}
