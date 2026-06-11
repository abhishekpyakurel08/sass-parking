'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import { parkingService, type Ticket } from '../../../lib/parking'

export default function ParkingPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => { loadTickets() }, [page, statusFilter])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const data: any = await parkingService.getTickets(page, 15, statusFilter || undefined)
      setTickets(data?.data || [])
      setTotalPages(data?.pagination?.totalPages || 1)
      setTotal(data?.pagination?.total || 0)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { ACTIVE: 'badge-blue', PENDING_PAYMENT: 'badge-yellow', PAID: 'badge-green' }
    return <span className={`badge ${map[s] || 'badge-blue'}`}>{s.replace('_', ' ')}</span>
  }

  const vehicleIcon: Record<string, string> = { CAR: '🚗', BIKE: '🏍️', TRUCK: '🚛', SUV: '🚙', BUS: '🚌' }

  return (
    <DashboardLayout title="Parking Tickets" subtitle={`${total} total tickets`}>

      {/* Actions bar */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['', 'ACTIVE', 'PENDING_PAYMENT', 'PAID'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}>
              {s === '' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard/parking/check-in')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Check-In
          </button>
          <button className="btn btn-success" onClick={() => router.push('/dashboard/parking/check-out')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            Check-Out
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /></div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎟️</div>
            <div className="empty-title">No tickets found</div>
            <p style={{ fontSize: 13, marginTop: 8 }}>Try changing the filter or check-in a new vehicle</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Vehicle</th>
                <th>License Plate</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t._id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>{t.ticket_number}</td>
                  <td>
                    <span style={{ marginRight: 6 }}>{vehicleIcon[t.vehicle_type] || '🚗'}</span>
                    <span style={{ color: 'var(--text)' }}>{t.vehicle_type}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text)', letterSpacing: 1 }}>{t.license_plate || <span style={{ color: 'var(--text-muted)' }}>Guest</span>}</td>
                  <td>{new Date(t.check_in_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{t.check_out_time ? new Date(t.check_out_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>{statusBadge(t.status)}</td>
                  <td>
                    {t.payment_method
                      ? <span style={{ fontSize: 12, color: 'var(--text-subtle)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>{t.payment_method}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>
                    Rs. {((t.fare_amount || 0) + (t.penalty_amount || 0) - (t.discount_amount || 0)).toFixed(0)}
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
