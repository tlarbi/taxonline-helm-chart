import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { chunksApi } from '../../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/auth'

export default function ManagementModule() {
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const { isEditor } = useAuthStore()
  const qc = useQueryClient()

  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['chunks-search', search, domain],
    queryFn: () => chunksApi.search(search, domain || undefined).then(r => r.data),
    enabled: search.length >= 3,
  })

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); refetch() }
  
  const handleUpdate = async (id: string) => {
    try {
      await chunksApi.update(id, { text: editText })
      toast.success('Chunk mis à jour')
      setEditingId(null)
      refetch()
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce chunk ?')) return
    try {
      await chunksApi.delete(id)
      toast.success('Chunk supprimé')
      refetch()
    } catch { toast.error('Erreur') }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '0.15em', marginBottom: '4px' }}>MODULE 5</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Gestion des Chunks</h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Recherche sémantique (min. 3 caractères)..."
          style={{ flex: 1, background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '4px', color: '#e2e8f0', fontSize: '12px', padding: '10px 14px', fontFamily: 'inherit', outline: 'none' }} />
        <select value={domain} onChange={e => setDomain(e.target.value)}
          style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '4px', color: '#94a3b8', fontSize: '12px', padding: '10px 14px', fontFamily: 'inherit' }}>
          <option value="">Tous domaines</option>
          {['TVA', 'IS', 'IRG', 'TAP', 'Douanes'].map(d => <option key={d}>{d}</option>)}
        </select>
        <button type="submit" style={{ background: '#0284c7', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px', padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em' }}>
          Rechercher
        </button>
      </form>

      {/* Results */}
      {isLoading && <div style={{ color: '#334155', fontSize: '11px' }}>Recherche...</div>}

      {results && (
        <div style={{ fontSize: '11px', color: '#334155', marginBottom: '12px' }}>{results.length} chunks trouvés</div>
      )}

      <div>
        {(results ?? []).map((chunk: any) => (
          <div key={chunk.id} style={{ background: '#0a0e18', border: '1px solid #1a2235', borderRadius: '6px', padding: '16px 20px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                {/* Meta */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '9px', color: '#334155', fontFamily: 'monospace' }}>{chunk.id.slice(0, 8)}...</span>
                  {chunk.metadata?.domain && <span style={{ fontSize: '10px', color: '#38bdf8' }}>{chunk.metadata.domain}</span>}
                  {chunk.metadata?.doc_type && <span style={{ fontSize: '10px', color: '#6366f1' }}>{chunk.metadata.doc_type}</span>}
                  {chunk.metadata?.year && <span style={{ fontSize: '10px', color: '#64748b' }}>{chunk.metadata.year}</span>}
                  <span style={{ fontSize: '10px', color: '#22c55e' }}>score: {chunk.score?.toFixed(4)}</span>
                </div>
                {/* Text */}
                {editingId === chunk.id ? (
                  <textarea value={editText} onChange={e => setEditText(e.target.value)}
                    rows={6} style={{ width: '100%', background: '#080b12', border: '1px solid #0ea5e9', borderRadius: '4px', color: '#e2e8f0', fontSize: '11px', padding: '10px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.7', maxHeight: '120px', overflow: 'hidden', position: 'relative' }}>
                    {chunk.text}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(transparent, #0a0e18)' }} />
                  </div>
                )}
              </div>

              {isEditor() && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  {editingId === chunk.id ? (
                    <>
                      <button onClick={() => handleUpdate(chunk.id)} style={{ background: '#0284c7', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>✓ Sauver</button>
                      <button onClick={() => setEditingId(null)} style={{ background: 'none', border: '1px solid #1a2235', borderRadius: '4px', color: '#475569', fontSize: '10px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(chunk.id); setEditText(chunk.text) }} style={{ background: 'none', border: '1px solid #1a2235', borderRadius: '4px', color: '#94a3b8', fontSize: '10px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Éditer</button>
                      <button onClick={() => handleDelete(chunk.id)} style={{ background: 'none', border: '1px solid #7f1d1d', borderRadius: '4px', color: '#f87171', fontSize: '10px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Suppr.</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {results?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#334155', fontSize: '11px' }}>Aucun résultat pour cette recherche</div>
        )}

        {!results && !isLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#1e2d3d', fontSize: '11px' }}>Entrez au moins 3 caractères pour rechercher des chunks</div>
        )}
      </div>
    </div>
  )
}
