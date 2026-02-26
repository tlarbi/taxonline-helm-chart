import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { metricsApi } from '../../services/api'
import { format } from 'date-fns'

const STATUS_COLOR: Record<string, string> = {
  ok: '#22c55e', green: '#22c55e',
  yellow: '#f59e0b', degraded: '#f59e0b',
  error: '#ef4444', red: '#ef4444',
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? '#64748b'
  return (
    <span style={{
      fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
      color, border: `1px solid ${color}33`, borderRadius: '3px',
      padding: '2px 8px', textTransform: 'uppercase',
    }}>● {status}</span>
  )
}

function MetricCard({ label, value, sub, highlight }: { label: string; value: string | number; sub?: string; highlight?: boolean }) {
  return (
    <div style={{
      background: '#0a0e18', border: `1px solid ${highlight ? '#0ea5e933' : '#1a2235'}`,
      borderRadius: '6px', padding: '20px 24px',
    }}>
      <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.1em', marginBottom: '10px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: highlight ? '#38bdf8' : '#f1f5f9', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#334155', marginTop: '6px' }}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '4px', padding: '10px 14px', fontSize: '11px', fontFamily: 'inherit' }}>
      <div style={{ color: '#475569', marginBottom: '6px' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function MonitoringModule() {
  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ['health'],
    queryFn: () => metricsApi.health().then(r => r.data),
    refetchInterval: 30_000,
  })

  const { data: realtime, refetch: refetchRealtime } = useQuery({
    queryKey: ['realtime'],
    queryFn: () => metricsApi.realtime().then(r => r.data),
    refetchInterval: 10_000,
  })

  const { data: perf } = useQuery({
    queryKey: ['performance'],
    queryFn: () => metricsApi.performance(24).then(r => r.data),
    refetchInterval: 60_000,
  })

  const [lastRefresh, setLastRefresh] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => { setLastRefresh(new Date()); refetchRealtime() }, 10_000)
    return () => clearInterval(t)
  }, [])

  const chartData = (perf ?? []).map((p: any) => ({
    ...p,
    hour: format(new Date(p.hour), 'HH:mm'),
  }))

  // Alerts
  const alerts: string[] = []
  if (realtime?.avg_retrieval_score < 0.015) alerts.push('⚠ Score moyen < 0.015')
  if (realtime?.error_rate > 5) alerts.push(`⚠ Error rate ${realtime.error_rate}%`)
  if (health?.services?.qdrant?.status !== 'ok') alerts.push('⚠ Qdrant dégradé')

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '0.15em', marginBottom: '4px' }}>MODULE 2</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Monitoring</h1>
        </div>
        <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.05em' }}>
          Refresh {format(lastRefresh, 'HH:mm:ss')}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: '6px', padding: '12px 16px', marginBottom: '24px', fontSize: '12px', color: '#fca5a5' }}>
          {alerts.map((a, i) => <div key={i}>{a}</div>)}
        </div>
      )}

      {/* Service health */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', marginBottom: '14px' }}>SERVICES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {health?.services && Object.entries(health.services).map(([name, info]: any) => (
            <div key={name} style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>{name}</span>
                <StatusBadge status={info.status} />
              </div>
              {info.vectors_count !== undefined && (
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>{info.vectors_count?.toLocaleString()}</div>
              )}
              {info.shards !== undefined && (
                <div style={{ fontSize: '11px', color: '#475569' }}>{info.shards} shards</div>
              )}
              {info.models && (
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>{info.models.join(', ')}</div>
              )}
              {info.error && <div style={{ fontSize: '10px', color: '#f87171', marginTop: '4px' }}>{info.error}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Real-time metrics */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', marginBottom: '14px' }}>MÉTRIQUES TEMPS RÉEL</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <MetricCard label="QUERIES / MIN" value={realtime?.queries_per_minute ?? '—'} highlight />
          <MetricCard label="CACHE HIT RATE" value={`${realtime?.cache_hit_rate ?? 0}%`} />
          <MetricCard label="SCORE MOYEN" value={realtime?.avg_retrieval_score?.toFixed(4) ?? '—'} sub={realtime?.avg_retrieval_score < 0.015 ? '⚠ sous seuil' : undefined} />
          <MetricCard label="LATENCE MOY." value={`${realtime?.avg_latency_ms ?? 0}ms`} />
          <MetricCard label="ERROR RATE" value={`${realtime?.error_rate ?? 0}%`} sub={`${realtime?.failed_queries ?? 0} failed`} />
        </div>
      </section>

      {/* Charts */}
      <section>
        <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', marginBottom: '14px' }}>PERFORMANCE 24H</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Score chart */}
          <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', padding: '20px' }}>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '16px' }}>Score moyen de retrieval</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avg_score" stroke="#38bdf8" dot={false} strokeWidth={1.5} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Latency chart */}
          <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', padding: '20px' }}>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '16px' }}>Latence moyenne (ms)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avg_latency" stroke="#a78bfa" dot={false} strokeWidth={1.5} name="Latence (ms)" />
                <Line type="monotone" dataKey="failed" stroke="#f87171" dot={false} strokeWidth={1} name="Échecs" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  )
}
