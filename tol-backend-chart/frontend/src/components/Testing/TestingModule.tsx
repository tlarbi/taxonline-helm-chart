import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { testsApi } from '../../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/auth'

const DOMAINS = ['TVA', 'IS', 'IRG', 'TAP', 'TFP', 'Douanes', 'Timbre', 'Tous']

const RETRIEVAL_MODES = [
  { label: 'Semantic (Qdrant)', value: 'semantic' },
  { label: 'BM25 (OpenSearch)', value: 'bm25' },
  { label: 'Hybrid', value: 'hybrid' },
]

export default function TestingModule() {
  const [activeTab, setActiveTab] = useState<'library' | 'runs' | 'new-run'>('library')
  const [showNewCase, setShowNewCase] = useState(false)
  const [newCase, setNewCase] = useState({ question: '', expected_answer: '', domain: 'TVA', tags: '' })
  const [runConfig, setRunConfig] = useState({ name: '', modeA: 'hybrid', modeB: '', topK: 5, minScore: 0.015 })
  const { isEditor } = useAuthStore()
  const qc = useQueryClient()

  const { data: cases } = useQuery({ queryKey: ['test-cases'], queryFn: () => testsApi.listCases().then(r => r.data) })
  const { data: runs } = useQuery({ queryKey: ['test-runs'], queryFn: () => testsApi.listRuns().then(r => r.data), refetchInterval: 5000 })

  const createCase = async () => {
    try {
      await testsApi.createCase({ ...newCase, tags: newCase.tags.split(',').map(t => t.trim()).filter(Boolean) })
      toast.success('Test case créé')
      setShowNewCase(false)
      setNewCase({ question: '', expected_answer: '', domain: 'TVA', tags: '' })
      qc.invalidateQueries({ queryKey: ['test-cases'] })
    } catch { toast.error('Erreur') }
  }

  const deleteCase = async (id: number) => {
    await testsApi.deleteCase(id)
    qc.invalidateQueries({ queryKey: ['test-cases'] })
  }

  const startRun = async () => {
    if (!runConfig.name) { toast.error('Nom requis'); return }
    const configA = { mode: runConfig.modeA, top_k: runConfig.topK, min_score: runConfig.minScore }
    const configB = runConfig.modeB ? { mode: runConfig.modeB, top_k: runConfig.topK, min_score: runConfig.minScore } : undefined
    try {
      await testsApi.createRun({ name: runConfig.name, config_a: configA, config_b: configB })
      toast.success('Test suite lancée')
      setActiveTab('runs')
      qc.invalidateQueries({ queryKey: ['test-runs'] })
    } catch { toast.error('Erreur') }
  }

  const inputStyle = {
    width: '100%', background: '#080b12', border: '1px solid #1e2d3d', borderRadius: '4px',
    color: '#e2e8f0', fontSize: '12px', padding: '8px 10px', fontFamily: 'inherit', boxSizing: 'border-box' as const,
  }
  const labelStyle = { display: 'block' as const, fontSize: '10px', color: '#475569', letterSpacing: '0.1em', marginBottom: '6px' }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '0.15em', marginBottom: '4px' }}>MODULE 3</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Testing</h1>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', padding: '4px' }}>
          {([['library', 'Bibliothèque'], ['runs', 'Runs'], ['new-run', 'Nouveau run']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? '#1a2235' : 'transparent', border: 'none',
              color: activeTab === tab ? '#f1f5f9' : '#475569', fontSize: '11px', padding: '6px 14px',
              cursor: 'pointer', borderRadius: '4px', fontFamily: 'inherit', letterSpacing: '0.05em',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Library tab */}
      {activeTab === 'library' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#475569' }}>{cases?.length ?? 0} cas de test</div>
            {isEditor() && (
              <button onClick={() => setShowNewCase(!showNewCase)} style={{
                background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '4px',
                color: '#38bdf8', fontSize: '11px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit',
              }}>+ Nouveau cas</button>
            )}
          </div>

          {showNewCase && (
            <div style={{ background: '#0a0e18', border: '1px solid #0ea5e933', borderRadius: '6px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>QUESTION</label>
                  <textarea value={newCase.question} onChange={e => setNewCase(p => ({ ...p, question: e.target.value }))}
                    rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Quel est le taux de TVA sur les produits alimentaires ?" />
                </div>
                <div>
                  <label style={labelStyle}>RÉPONSE ATTENDUE</label>
                  <textarea value={newCase.expected_answer} onChange={e => setNewCase(p => ({ ...p, expected_answer: e.target.value }))}
                    rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>DOMAINE</label>
                  <select value={newCase.domain} onChange={e => setNewCase(p => ({ ...p, domain: e.target.value }))} style={inputStyle}>
                    {DOMAINS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>TAGS</label>
                  <input value={newCase.tags} onChange={e => setNewCase(p => ({ ...p, tags: e.target.value }))} style={inputStyle} placeholder="taux,exonération" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={createCase} style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px', padding: '8px 20px', cursor: 'pointer', fontFamily: 'inherit' }}>Créer</button>
                <button onClick={() => setShowNewCase(false)} style={{ background: 'none', border: '1px solid #1a2235', borderRadius: '4px', color: '#475569', fontSize: '11px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
              </div>
            </div>
          )}

          <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', overflow: 'hidden' }}>
            {(cases ?? []).map((c: any, i: number) => (
              <div key={c.id} style={{ padding: '14px 20px', borderBottom: '1px solid #0f1520', display: 'grid', gridTemplateColumns: '1fr 200px 100px 60px', gap: '16px', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '4px' }}>{c.question}</div>
                  <div style={{ fontSize: '10px', color: '#334155' }}>{c.expected_answer?.slice(0, 80)}...</div>
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{c.domain}</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {c.tags?.map((t: string) => (
                    <span key={t} style={{ fontSize: '9px', color: '#475569', background: '#111827', borderRadius: '3px', padding: '2px 6px' }}>{t}</span>
                  ))}
                </div>
                {isEditor() && (
                  <button onClick={() => deleteCase(c.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '14px' }}>×</button>
                )}
              </div>
            ))}
            {!cases?.length && <div style={{ padding: '24px', textAlign: 'center', color: '#334155', fontSize: '11px' }}>Aucun cas de test</div>}
          </div>
        </div>
      )}

      {/* Runs tab */}
      {activeTab === 'runs' && (
        <div>
          {(runs ?? []).map((run: any) => (
            <div key={run.id} style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', padding: '20px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 600 }}>{run.name}</span>
                  <span style={{ marginLeft: '12px', fontSize: '10px', color: '#334155' }}>#{run.id}</span>
                </div>
                <span style={{ fontSize: '10px', color: run.status === 'completed' ? '#22c55e' : run.status === 'running' ? '#f59e0b' : '#ef4444', border: `1px solid currentColor`, borderRadius: '3px', padding: '2px 8px' }}>
                  {run.status}
                </span>
              </div>
              {run.summary && Object.keys(run.summary).length > 0 && (
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#22c55e' }}>{run.summary.passed}</div>
                    <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '0.1em' }}>PASSED</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444' }}>{run.summary.failed}</div>
                    <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '0.1em' }}>FAILED</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#38bdf8' }}>{run.summary.pass_rate}%</div>
                    <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '0.1em' }}>PASS RATE</div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!runs?.length && <div style={{ padding: '40px', textAlign: 'center', color: '#334155', fontSize: '11px' }}>Aucun run lancé</div>}
        </div>
      )}

      {/* New run tab */}
      {activeTab === 'new-run' && (
        <div style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', padding: '24px', maxWidth: '600px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>NOM DU RUN</label>
              <input value={runConfig.name} onChange={e => setRunConfig(p => ({ ...p, name: e.target.value }))}
                style={inputStyle} placeholder="Benchmark hybrid v1.2" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>CONFIG A (obligatoire)</label>
                <select value={runConfig.modeA} onChange={e => setRunConfig(p => ({ ...p, modeA: e.target.value }))} style={inputStyle}>
                  {RETRIEVAL_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>CONFIG B (A/B test)</label>
                <select value={runConfig.modeB} onChange={e => setRunConfig(p => ({ ...p, modeB: e.target.value }))} style={inputStyle}>
                  <option value="">— aucun —</option>
                  {RETRIEVAL_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>TOP-K</label>
                <input type="number" value={runConfig.topK} onChange={e => setRunConfig(p => ({ ...p, topK: +e.target.value }))} style={inputStyle} min={1} max={20} />
              </div>
              <div>
                <label style={labelStyle}>SCORE SEUIL</label>
                <input type="number" step="0.001" value={runConfig.minScore} onChange={e => setRunConfig(p => ({ ...p, minScore: +e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <button onClick={startRun} style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', padding: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              ▶ LANCER LA SUITE DE TESTS
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
