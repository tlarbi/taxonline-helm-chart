import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, Cell } from 'recharts'
import { analyticsApi } from '../../services/api'
import toast from 'react-hot-toast'

const DOMAIN_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#f87171', '#e879f9', '#fb923c', '#2dd4bf']

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '4px', padding: '10px 14px', fontSize: '11px', fontFamily: 'inherit' }}>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color ?? '#94a3b8' }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  )
}

export default function AnalyticsModule() {
  const [exportLoading, setExportLoading] = useState(false)

  const { data: coverage } = useQuery({
    queryKey: ['coverage'],
    queryFn: () => analyticsApi.coverage().then(r => r.data),
  })

  const { data: topQueries } = useQuery({
    queryKey: ['top-queries'],
    queryFn: () => analyticsApi.topQueries({ limit: 15 }).then(r => r.data),
  })

  const { data: failedQueries } = useQuery({
    queryKey: ['failed-queries'],
    queryFn: () => analyticsApi.topQueries({ limit: 10, failed_only: true }).then(r => r.data),
  })

  const { data: behavior } = useQuery({
    queryKey: ['user-behavior'],
    queryFn: () => analyticsApi.userBehavior(7).then(r => r.data),
  })

  const { data: heatmap } = useQuery({
    queryKey: ['heatmap'],
    queryFn: () => analyticsApi.heatmap(30).then(r => r.data),
  })

  const handleExport = async (format: string, table: string) => {
    setExportLoading(true)
    try {
      const res = await analyticsApi.export(format, table, 30)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${table}_30d.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Export ${format.toUpperCase()} lancé`)
    } catch {
      toast.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  // Build heatmap grid
  const heatmapDomains = [...new Set((heatmap ?? []).map((h: any) => h.domain))]
  const heatmapDays = [...new Set((heatmap ?? []).map((h: any) => h.day?.slice(0, 10)))]
  const heatmapMap: Record<string, number> = {}
  ;(heatmap ?? []).forEach((h: any) => { heatmapMap[`${h.day?.slice(0,10)}_${h.domain}`] = h.count })
  const maxHeat = Math.max(...Object.values(heatmapMap), 1)

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '0.15em', marginBottom: '4px' }}>MODULE 4</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Analytics</h1>
        </div>
        {/* Export buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'CSV Queries', fmt: 'csv', tbl: 'query_logs' },
            { label: 'JSON Docs', fmt: 'json', tbl: 'documents' },
          ].map(({ label, fmt, tbl }) => (
            <button key={label} onClick={() => handleExport(fmt, tbl)} disabled={exportLoading}
              style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '4px', color: '#94a3b8', fontSize: '11px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em' }}>
              ↓ {label}
            </button>
          ))}
        </div>
      </div>

      {/* Coverage */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', marginBottom: '14px' }}>COVERAGE PAR DOMAINE FISCAL</div>
        <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', padding: '20px' }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={coverage ?? []} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" />
              <XAxis dataKey="domain" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="chunks" name="Chunks" radius={[2, 2, 0, 0]}>
                {(coverage ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
            {(coverage ?? []).map((c: any, i: number) => (
              <div key={c.domain} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: DOMAIN_COLORS[i % DOMAIN_COLORS.length], display: 'inline-block' }} />
                <span style={{ color: '#64748b' }}>{c.domain}</span>
                <span style={{ color: '#334155' }}>({c.documents} docs)</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Heatmap */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', marginBottom: '14px' }}>HEATMAP DOCUMENTS CONSULTÉS (30 JOURS)</div>
        <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', padding: '20px', overflowX: 'auto' }}>
          {heatmapDomains.length === 0 ? (
            <div style={{ color: '#334155', fontSize: '11px', textAlign: 'center', padding: '20px' }}>Pas de données</div>
          ) : (
            <div>
              {/* Column headers (days) */}
              <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${heatmapDays.length}, 28px)`, gap: '2px', marginBottom: '4px' }}>
                <div />
                {heatmapDays.map(d => (
                  <div key={d} style={{ fontSize: '9px', color: '#334155', textAlign: 'center', transform: 'rotate(-45deg)', transformOrigin: 'center bottom', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d?.slice(5)}</div>
                ))}
              </div>
              {heatmapDomains.map(domain => (
                <div key={domain} style={{ display: 'grid', gridTemplateColumns: `80px repeat(${heatmapDays.length}, 28px)`, gap: '2px', marginBottom: '2px', alignItems: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>{domain}</div>
                  {heatmapDays.map(day => {
                    const val = heatmapMap[`${day}_${domain}`] ?? 0
                    const intensity = val / maxHeat
                    return (
                      <div key={day} title={`${domain} ${day}: ${val}`} style={{
                        width: '26px', height: '18px', borderRadius: '2px',
                        background: intensity > 0 ? `rgba(56,189,248,${0.1 + intensity * 0.9})` : '#111827',
                        cursor: 'default',
                      }} />
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Queries */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Top queries */}
        <div>
          <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', marginBottom: '12px' }}>TOP QUERIES</div>
          <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', overflow: 'hidden' }}>
            {(topQueries ?? []).map((q: any, i: number) => (
              <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #0f1520', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '10px', color: '#334155', width: '20px', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.query}</span>
                <span style={{ fontSize: '11px', color: '#38bdf8', flexShrink: 0 }}>{q.count}×</span>
                <span style={{ fontSize: '10px', color: '#475569', flexShrink: 0 }}>{q.avg_score?.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Failed queries */}
        <div>
          <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', marginBottom: '12px' }}>FAILED QUERIES</div>
          <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', overflow: 'hidden' }}>
            {(failedQueries ?? []).length === 0 ? (
              <div style={{ padding: '20px', fontSize: '11px', color: '#334155', textAlign: 'center' }}>✓ Aucune query en échec</div>
            ) : (
              (failedQueries ?? []).map((q: any, i: number) => (
                <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #0f1520', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '10px', color: '#334155', width: '20px', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: '11px', color: '#f87171', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.query}</span>
                  <span style={{ fontSize: '11px', color: '#ef4444', flexShrink: 0 }}>{q.count}×</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
