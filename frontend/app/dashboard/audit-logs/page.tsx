'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { auditService, type AuditLog } from '../../../lib/audit'

const ACTION_COLORS: Record<string, string> = {
  create: 'badge-green', add: 'badge-green',
  delete: 'badge-red', remove: 'badge-red',
  update: 'badge-yellow', edit: 'badge-yellow', modify: 'badge-yellow',
  login: 'badge-blue', logout: 'badge-blue',
  suspend: 'badge-red', activate: 'badge-green',
  payment: 'badge-purple', checkout: 'badge-purple',
}

function getActionBadgeClass(action: string) {
  const lower = action.toLowerCase()
  for (const [k, v] of Object.entries(ACTION_COLORS)) if (lower.includes(k)) return v
  return 'badge-blue'
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ action: '', entityType: '' })

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data: any = await auditService.getAuditLogs(page, 20, undefined, filters.action || undefined, filters.entityType || undefined)
      setLogs(data?.data || [])
      setTotalPages(data?.pagination?.totalPages || 1)
      setTotal(data?.pagination?.total || 0)
    } catch { } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { load() }, [load])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  return (
    <DashboardLayout title="Audit Logs" subtitle={`${total} security events recorded`}>
      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label" style={{ marginBottom: 6 }}>Filter by Action</label>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="form-input" style={{ paddingLeft: 34 }} placeholder="create, delete, login…" value={filters.action} onChange={e => handleFilterChange('action', e.target.value)} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label" style={{ marginBottom: 6 }}>Filter by Entity</label>
          <input className="form-input" placeholder="Ticket, Customer, Rate…" value={filters.entityType} onChange={e => handleFilterChange('entityType', e.target.value)} />
        </div>
        {(filters.action || filters.entityType) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ action: '', entityType: '' }); setPage(1) }}>
            ✕ Clear
          </button>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No audit logs found</div>
            <p style={{ fontSize: 13, marginTop: 8 }}>Logs appear when users perform actions</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>User</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td><span className={`badge ${getActionBadgeClass(log.action)}`}>{log.action}</span></td>
                  <td style={{ color: 'var(--text)', fontWeight: 600 }}>{log.entity_type}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.entity_id}>{log.entity_id}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.user_id}>{log.user_id}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{log.ip_address || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}
    </DashboardLayout>
  )
}
