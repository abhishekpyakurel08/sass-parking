'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { parkingService } from '../../../lib/parking'

export default function ParkingPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadTickets()
  }, [page])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const data = await parkingService.getTickets(page, 20)
      setTickets(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error('Failed to load tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#3b82f6'
      case 'PENDING_PAYMENT':
        return '#f59e0b'
      case 'PAID':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  return (
    <DashboardLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', color: '#1a1a2e' }}>
            Parking Tickets
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.href = '/dashboard/parking/check-in'}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Check-In
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/parking/check-out'}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Check-Out
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Loading tickets...
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
                      Ticket #
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      License Plate
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Vehicle Type
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Check-In
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Check-Out
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e' }}>
                        {ticket.ticket_number}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e' }}>
                        {ticket.license_plate}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e' }}>
                        {ticket.vehicle_type}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                        {new Date(ticket.check_in_time).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                        {ticket.check_out_time ? new Date(ticket.check_out_time).toLocaleString() : '-'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: `${getStatusColor(ticket.status)}20`,
                          color: getStatusColor(ticket.status),
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {ticket.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a1a2e', fontWeight: '600' }}>
                        Rs. {((ticket.fare_amount || 0) + (ticket.penalty_amount || 0) - (ticket.discount_amount || 0)).toFixed(2)}
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
