'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '../../../components/DashboardLayout'
import { parkingService, type Ticket } from '../../../lib/parking'
import { useStore } from '../../../store/useStore'

export default function ParkingPage() {
  const router = useRouter()
  const darkMode = useStore((s) => s.darkMode)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { loadTickets() }, [page, statusFilter])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const data: any = await parkingService.getTickets(page, 15, statusFilter || undefined)
      const ticketsArray = Array.isArray(data) ? data : (data?.data || [])
      setTickets(ticketsArray)
      setTotalPages(data?.pagination?.totalPages || 1)
      setTotal(data?.pagination?.total || ticketsArray.length)
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
          <div className="empty-state" style={{ background: darkMode ? '#1a1a1a' : '', padding: 40, textAlign: 'center' }}>
            <div className="empty-icon" style={{ fontSize: 48 }}>🎟️</div>
            <div className="empty-title" style={{ fontSize: 18, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)', marginTop: 16 }}>No tickets found</div>
            <p style={{ fontSize: 13, marginTop: 8, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 24 }}>Try changing the filter or check-in a new vehicle</p>
            <Link href="/dashboard/parking/check-in" className="btn btn-primary btn-sm">
              Check-In Vehicle
            </Link>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => {
                const vehicleType = t.vehicle_type || t.vehicleType
                const checkInTime = t.check_in_time || t.checkInTime
                const checkOutTime = t.check_out_time || t.checkOutTime
                const status = t.status || t.paymentStatus
                const paymentMethod = t.payment_method || t.paymentMethod
                const licensePlate = t.license_plate || t.vehiclePlateNumber
                const fareAmount = t.fare_amount || t.fareAmount || 0
                const penaltyAmount = t.penalty_amount || t.penaltyAmount || 0
                const discountAmount = t.discount_amount || t.discountAmount || 0

                return (
                  <tr key={t._id || t.ticket_number}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>{t.ticket_number || '—'}</td>
                    <td>
                      <span style={{ marginRight: 6 }}>{vehicleType && vehicleIcon[vehicleType] ? vehicleIcon[vehicleType] : '🚗'}</span>
                      <span style={{ color: darkMode ? '#fff' : 'var(--text)' }}>{vehicleType || '—'}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)', letterSpacing: 1 }}>{licensePlate || <span style={{ color: darkMode ? '#888' : 'var(--text-muted)' }}>Guest</span>}</td>
                    <td>{checkInTime ? new Date(checkInTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>{checkOutTime ? new Date(checkOutTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : <span style={{ color: darkMode ? '#888' : 'var(--text-muted)' }}>—</span>}</td>
                    <td>{status ? statusBadge(status) : '—'}</td>
                    <td>
                      {paymentMethod
                        ? <span style={{ fontSize: 12, color: darkMode ? '#fff' : 'var(--text-subtle)', background: darkMode ? '#2a2a2a' : 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>{paymentMethod}</span>
                        : <span style={{ color: darkMode ? '#888' : 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: darkMode ? '#fff' : 'var(--text)', fontSize: 15 }}>
                      Rs. {(fareAmount + penaltyAmount - discountAmount).toFixed(0)}
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelectedTicket(t); setShowModal(true) }}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span style={{ color: darkMode ? '#fff' : '' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}

      {/* Ticket Details Modal */}
      {showModal && selectedTicket && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: darkMode ? '#1a1a1a' : '#fff', borderRadius: 16, maxWidth: 500,
            width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 24,
            border: darkMode ? '1px solid #333' : '1px solid var(--border)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: darkMode ? '#fff' : 'var(--text)', margin: 0 }}>
                Ticket Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: darkMode ? '#888' : 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {(() => {
                const vehicleType = selectedTicket.vehicle_type || selectedTicket.vehicleType
                const checkInTime = selectedTicket.check_in_time || selectedTicket.checkInTime
                const checkOutTime = selectedTicket.check_out_time || selectedTicket.checkOutTime
                const status = selectedTicket.status || selectedTicket.paymentStatus
                const paymentMethod = selectedTicket.payment_method || selectedTicket.paymentMethod
                const licensePlate = selectedTicket.license_plate || selectedTicket.vehiclePlateNumber
                const fareAmount = selectedTicket.fare_amount || selectedTicket.fareAmount || 0
                const penaltyAmount = selectedTicket.penalty_amount || selectedTicket.penaltyAmount || 0
                const discountAmount = selectedTicket.discount_amount || selectedTicket.discountAmount || 0

                return (
                  <>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Ticket Number</p>
                      <p style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)', fontFamily: 'monospace' }}>
                        {selectedTicket.ticket_number || '—'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Status</p>
                      <div>{status ? statusBadge(status) : '—'}</div>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Vehicle Type</p>
                      <p style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)' }}>
                        {vehicleType && vehicleIcon[vehicleType] ? vehicleIcon[vehicleType] : '🚗'} {vehicleType || '—'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>License Plate</p>
                      <p style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)' }}>
                        {licensePlate || 'Guest'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Check-In Time</p>
                      <p style={{ fontSize: 14, color: darkMode ? '#fff' : 'var(--text)' }}>
                        {checkInTime ? new Date(checkInTime).toLocaleString() : '—'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Check-Out Time</p>
                      <p style={{ fontSize: 14, color: darkMode ? '#fff' : 'var(--text)' }}>
                        {checkOutTime ? new Date(checkOutTime).toLocaleString() : '—'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Fare Amount</p>
                      <p style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)' }}>
                        Rs. {fareAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Penalty Amount</p>
                      <p style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)' }}>
                        Rs. {penaltyAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Discount Amount</p>
                      <p style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)' }}>
                        Rs. {discountAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Total Amount</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>
                        Rs. {(fareAmount + penaltyAmount - discountAmount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Payment Method</p>
                      <p style={{ fontSize: 14, color: darkMode ? '#fff' : 'var(--text)' }}>
                        {paymentMethod || '—'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Amount Received</p>
                      <p style={{ fontSize: 14, color: darkMode ? '#fff' : 'var(--text)' }}>
                        Rs. {(selectedTicket.amount_received || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Change Given</p>
                      <p style={{ fontSize: 14, color: darkMode ? '#fff' : 'var(--text)' }}>
                        Rs. {(selectedTicket.change_given || 0).toFixed(2)}
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>

            {selectedTicket.notes && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Notes</p>
                <p style={{ fontSize: 14, color: darkMode ? '#fff' : 'var(--text)' }}>{selectedTicket.notes}</p>
              </div>
            )}

            {selectedTicket.transaction_reference && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 4 }}>Transaction Reference</p>
                <p style={{ fontSize: 14, color: darkMode ? '#fff' : 'var(--text)', fontFamily: 'monospace' }}>{selectedTicket.transaction_reference}</p>
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost"
                style={{ padding: '8px 16px' }}
              >
                Close
              </button>
              {selectedTicket.status === 'ACTIVE' && (
                <button
                  onClick={() => { setShowModal(false); router.push('/dashboard/parking/check-out') }}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  Check-Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
