import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { uploadApi, pipelineApi, createPipelineSocket } from '../../services/api'
import { format } from 'date-fns'

const DOC_TYPES = ['code', 'circulaire', 'loi', 'decret', 'instruction']
const DOMAINS = ['TVA', 'IS', 'IRG', 'TAP', 'TFP', 'Douanes', 'Timbre', 'Autre']
const STATUS_COLOR: Record<string, string> = {
  indexed: '#22c55e', processing: '#f59e0b', pending: '#475569',
  failed: '#ef4444', rolled_back: '#8b5cf6',
}

function PipelineLog({ jobId }: { jobId: number }) {
  const [logs, setLogs] = useState<any[]>([])
  const [done, setDone] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ws = createPipelineSocket(jobId, (event) => {
      setLogs(prev => [...prev, event])
      if (event.status === 'completed' || event.status === 'failed') setDone(true)
      setTimeout(() => containerRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50)
    })
    wsRef.current = ws
    return () => ws.close()
  }, [jobId])

  return (
    <div ref={containerRef} style={{
      background: '#050810', border: '1px solid #1a2235', borderRadius: '4px',
      padding: '12px', height: '160px', overflowY: 'auto', fontFamily: 'inherit',
    }}>
      {logs.map((log, i) => (
        <div key={i} style={{ fontSize: '11px', color: log.status === 'failed' ? '#f87171' : log.status === 'completed' ? '#4ade80' : '#94a3b8', lineHeight: '1.6' }}>
          <span style={{ color: '#334155' }}>[{log.timestamp?.slice(11, 19)}]</span> {log.message}
          {log.progress > 0 && <span style={{ color: '#0ea5e9', marginLeft: '8px' }}>{log.progress.toFixed(0)}%</span>}
        </div>
      ))}
      {!done && <div style={{ fontSize: '11px', color: '#334155' }}>▌</div>}
    </div>
  )
}

export default function UploadModule() {
  const [files, setFiles] = useState<File[]>([])
  const [meta, setMeta] = useState({ doc_type: 'code', year: new Date().getFullYear(), domain: 'TVA', tags: '' })
  const [uploading, setUploading] = useState(false)
  const [activeJobs, setActiveJobs] = useState<number[]>([])
  const qc = useQueryClient()

  const { data: docs } = useQuery({
    queryKey: ['documents'],
    queryFn: () => uploadApi.listDocuments().then(r => r.data),
    refetchInterval: 15_000,
  })

  const onDrop = useCallback((accepted: File[]) => {
    const pdfs = accepted.filter(f => f.name.endsWith('.pdf'))
    setFiles(prev => [...prev, ...pdfs])
    if (pdfs.length < accepted.length) toast.error('PDF uniquement')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: true })

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    try {
      const res = await uploadApi.uploadDocuments(files, meta)
      const jobIds = res.data.uploaded.map((u: any) => u.job_id)
      setActiveJobs(prev => [...prev, ...jobIds])
      setFiles([])
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success(`${jobIds.length} document(s) en cours d'indexation`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Upload error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '0.15em', marginBottom: '4px' }}>MODULE 1</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Upload & Indexation</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Dropzone */}
        <div>
          <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', marginBottom: '10px' }}>DOCUMENTS PDF</div>
          <div {...getRootProps()} style={{
            border: `2px dashed ${isDragActive ? '#0ea5e9' : '#1a2235'}`,
            borderRadius: '6px', padding: '40px 24px', textAlign: 'center',
            background: isDragActive ? 'rgba(14,165,233,0.04)' : '#0a0e18',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <input {...getInputProps()} />
            <div style={{ fontSize: '28px', marginBottom: '12px', opacity: 0.3 }}>⬆</div>
            <div style={{ fontSize: '12px', color: '#475569' }}>
              {isDragActive ? 'Déposer ici...' : 'Glisser-déposer ou cliquer'}
            </div>
            <div style={{ fontSize: '10px', color: '#334155', marginTop: '6px' }}>PDF uniquement · max 100MB / fichier</div>
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '4px', marginBottom: '4px', fontSize: '11px' }}>
                  <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>{f.name}</span>
                  <span style={{ color: '#334155', flexShrink: 0, marginLeft: '8px' }}>{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '14px', marginLeft: '8px' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metadata form */}
        <div>
          <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', marginBottom: '10px' }}>MÉTADONNÉES</div>
          <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'TYPE', key: 'doc_type', options: DOC_TYPES },
              { label: 'DOMAINE FISCAL', key: 'domain', options: DOMAINS },
            ].map(({ label, key, options }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '10px', color: '#475569', letterSpacing: '0.1em', marginBottom: '6px' }}>{label}</label>
                <select value={(meta as any)[key]} onChange={e => setMeta(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{ width: '100%', background: '#080b12', border: '1px solid #1e2d3d', borderRadius: '4px', color: '#e2e8f0', fontSize: '12px', padding: '8px 10px', fontFamily: 'inherit' }}>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#475569', letterSpacing: '0.1em', marginBottom: '6px' }}>ANNÉE</label>
              <input type="number" value={meta.year} onChange={e => setMeta(prev => ({ ...prev, year: +e.target.value }))}
                style={{ width: '100%', background: '#080b12', border: '1px solid #1e2d3d', borderRadius: '4px', color: '#e2e8f0', fontSize: '12px', padding: '8px 10px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#475569', letterSpacing: '0.1em', marginBottom: '6px' }}>TAGS (virgule)</label>
              <input value={meta.tags} onChange={e => setMeta(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="ex: 2024, TVA-import, reforme"
                style={{ width: '100%', background: '#080b12', border: '1px solid #1e2d3d', borderRadius: '4px', color: '#e2e8f0', fontSize: '12px', padding: '8px 10px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleUpload} disabled={uploading || !files.length}
              style={{
                background: (uploading || !files.length) ? '#0c3251' : 'linear-gradient(135deg, #0284c7, #6366f1)',
                border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px',
                fontWeight: 600, letterSpacing: '0.08em', padding: '12px', cursor: (uploading || !files.length) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', marginTop: '4px',
              }}>
              {uploading ? 'UPLOAD EN COURS...' : `→ INDEXER ${files.length || ''} FICHIER${files.length > 1 ? 'S' : ''}`}
            </button>
          </div>
        </div>
      </div>

      {/* Active pipeline logs */}
      {activeJobs.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', marginBottom: '12px' }}>PIPELINE EN COURS</div>
          {activeJobs.map(jobId => (
            <div key={jobId} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>Job #{jobId}</div>
              <PipelineLog jobId={jobId} />
            </div>
          ))}
        </section>
      )}

      {/* Documents table */}
      <section>
        <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em', marginBottom: '12px' }}>DOCUMENTS INDEXÉS ({docs?.length ?? 0})</div>
        <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2235' }}>
                {['Fichier', 'Type', 'Domaine', 'Année', 'Chunks', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#334155', letterSpacing: '0.05em', fontSize: '10px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(docs ?? []).map((d: any) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #0f1520' }}>
                  <td style={{ padding: '10px 16px', color: '#94a3b8', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.filename}</td>
                  <td style={{ padding: '10px 16px', color: '#64748b' }}>{d.doc_type}</td>
                  <td style={{ padding: '10px 16px', color: '#64748b' }}>{d.domain}</td>
                  <td style={{ padding: '10px 16px', color: '#64748b' }}>{d.year}</td>
                  <td style={{ padding: '10px 16px', color: '#38bdf8' }}>{d.chunk_count}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: '10px', color: STATUS_COLOR[d.status] ?? '#475569', border: `1px solid ${STATUS_COLOR[d.status] ?? '#475569'}33`, borderRadius: '3px', padding: '2px 8px' }}>
                      {d.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <button onClick={() => { if (confirm('Supprimer ?')) uploadApi.deleteDocument(d.id).then(() => qc.invalidateQueries({ queryKey: ['documents'] })) }}
                      style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '14px' }}>×</button>
                  </td>
                </tr>
              ))}
              {!docs?.length && (
                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#1e2d3d' }}>Aucun document indexé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
