'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { auditService, type AuditLog } from '../../../lib/audit'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
  })

  useEffect(() => {
    loadLogs()
  }, [page, filters])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const data = await auditService.getAuditLogs(
        page,
        20,
        undefined,
        filters.action || undefined,
        filters.entityType || undefined
      )
      setLogs(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('create') || actionLower.includes('add')) return '#10b981'
    if (actionLower.includes('delete') || actionLower.includes('remove')) return '#ef4444'
    if (actionLower.includes('update') || actionLower.includes('edit')) return '#f59e0b'
    return '#3b82f6'
  }

  return (
    <DashboardLayout>
      <div>
        <h2 style={{ fontSize: '28px', marginBottom: '24px', color: '#1a1a2e' }}>
          Audit Logs
        </h2>

        {/* Filters */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
              Filter by Action
            </label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              placeholder="e.g., create, delete, update"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
              Filter by Entity Type
            </label>
            <input
              type="text"
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              placeholder="e.g., Ticket, Customer, Rate"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => setFilters({ action: '', entityType: '' })}
              style={{
                padding: '10px 20px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Loading audit logs...
          </div>
        ) : (
          <>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Action
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Entity Type
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Entity ID
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      User ID
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      IP Address
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: `${getActionColor(log.action)}20`,
                          color: getActionColor(log.action),
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e' }}>
                        {log.entity_type}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>
                        {log.entity_id}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>
                        {log.user_id}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>
                        {log.ip_address}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '8px 16px',
                    background: page === 1 ? '#e5e7eb' : '#3b82f6',
                    color: page === 1 ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: '8px 16px', color: '#6b7280' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '8px 16px',
                    background: page === totalPages ? '#e5e7eb' : '#3b82f6',
                    color: page === totalPages ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
