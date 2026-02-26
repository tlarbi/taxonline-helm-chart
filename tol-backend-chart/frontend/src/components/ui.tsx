import { ReactNode, CSSProperties } from 'react'
import { clsx } from 'clsx'

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
  glow?: boolean
}

export function Card({ children, style, glow }: CardProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '6px',
      padding: '20px',
      boxShadow: glow ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Card Header ─────────────────────────────────────────────────────────────
export function CardHeader({ title, subtitle, action }: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
      <div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: subtitle ? '4px' : 0,
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const badgeColors: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: 'var(--success-dim)', color: 'var(--success)' },
  warning: { bg: 'var(--warning-dim)', color: 'var(--warning)' },
  danger:  { bg: 'var(--danger-dim)',  color: 'var(--danger)' },
  info:    { bg: 'var(--info-dim)',    color: 'var(--info)' },
  neutral: { bg: 'var(--bg-overlay)', color: 'var(--text-secondary)' },
}

export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: BadgeVariant }) {
  const { bg, color } = badgeColors[variant]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      background: bg,
      color,
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      fontWeight: '500',
      borderRadius: '3px',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {children}
    </span>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
  loading?: boolean
  icon?: ReactNode
}

const btnStyles: Record<string, CSSProperties> = {
  primary:   { background: 'var(--accent)',      color: 'var(--text-inverse)', border: '1px solid var(--accent)' },
  secondary: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
  ghost:     { background: 'transparent',        color: 'var(--text-secondary)', border: '1px solid transparent' },
  danger:    { background: 'var(--danger-dim)',   color: 'var(--danger)',       border: '1px solid rgba(240,80,80,0.2)' },
}

export function Button({ children, onClick, variant = 'secondary', size = 'md', disabled, type = 'button', loading, icon }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '6px 12px' : '8px 16px',
        borderRadius: '4px',
        fontFamily: 'var(--font-body)',
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: '500',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        ...btnStyles[variant],
      }}
    >
      {loading ? (
        <span style={{
          width: '12px', height: '12px',
          border: '1.5px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
          display: 'inline-block',
        }} />
      ) : icon}
      {children}
    </button>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, unit, trend, color }: {
  label: string
  value: string | number
  unit?: string
  trend?: { value: number; positive: boolean }
  color?: string
}) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '6px',
      padding: '16px 20px',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '10px',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          fontWeight: '700',
          color: color || 'var(--text-primary)',
          lineHeight: 1,
        }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>
      {trend && (
        <div style={{
          marginTop: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: trend.positive ? 'var(--success)' : 'var(--danger)',
        }}>
          {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '28px 32px 0',
      marginBottom: '24px',
    }}>
      <div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            marginTop: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
    </div>
  )
}

// ─── Status Dot ───────────────────────────────────────────────────────────────
export function StatusDot({ status }: { status: 'up' | 'down' | 'degraded' }) {
  const colors = { up: 'var(--success)', down: 'var(--danger)', degraded: 'var(--warning)' }
  return (
    <span style={{
      display: 'inline-block',
      width: '8px', height: '8px',
      borderRadius: '50%',
      background: colors[status],
      boxShadow: `0 0 0 2px ${colors[status]}33`,
      animation: status === 'up' ? 'pulse-glow 2s infinite' : 'none',
    }} />
  )
}
