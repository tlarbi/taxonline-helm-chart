import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth'

const NAV = [
  { to: '/monitoring', label: 'Monitoring', icon: '◉' },
  { to: '/upload', label: 'Indexation', icon: '⬆' },
  { to: '/testing', label: 'Testing', icon: '⚗' },
  { to: '/analytics', label: 'Analytics', icon: '▦' },
  { to: '/management', label: 'Chunks', icon: '⊞' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#080b12', color: '#cbd5e1', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? '60px' : '220px',
        minWidth: collapsed ? '60px' : '220px',
        background: '#0a0e18',
        borderRight: '1px solid #1a2235',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 16px' : '24px 20px', borderBottom: '1px solid #1a2235' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff'
            }}>T</div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.05em' }}>TAXONLINE</div>
                <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.1em' }}>ADMIN</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: collapsed ? '12px 16px' : '10px 20px',
              fontSize: '12px', fontWeight: 500, letterSpacing: '0.05em',
              color: isActive ? '#38bdf8' : '#64748b',
              background: isActive ? 'rgba(56,189,248,0.06)' : 'transparent',
              borderLeft: isActive ? '2px solid #38bdf8' : '2px solid transparent',
              textDecoration: 'none', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            })}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>{icon}</span>
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #1a2235', padding: collapsed ? '12px 14px' : '16px 20px' }}>
          {!collapsed && (
            <div style={{ fontSize: '11px', color: '#334155', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username} · <span style={{ color: '#0ea5e9' }}>{user?.role}</span>
            </div>
          )}
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid #1e2d3d', borderRadius: '4px',
            color: '#475569', cursor: 'pointer', fontSize: '11px', padding: '6px 10px',
            width: '100%', textAlign: 'left', fontFamily: 'inherit', letterSpacing: '0.05em',
          }}>
            {collapsed ? '←' : '← Logout'}
          </button>
        </div>
      </aside>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)} style={{
        position: 'fixed', left: collapsed ? '44px' : '204px', top: '50%',
        transform: 'translateY(-50%)', zIndex: 100,
        background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '50%',
        width: '20px', height: '20px', cursor: 'pointer', color: '#475569',
        fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'left 0.2s ease',
      }}>
        {collapsed ? '›' : '‹'}
      </button>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '0' }}>
        <Outlet />
      </main>
    </div>
  )
}
