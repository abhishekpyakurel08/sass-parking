'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../../components/DashboardLayout'
import { parkingService } from '../../../../lib/parking'

export default function CheckOutPage() {
  const router = useRouter()
  
  const [ticketId, setTicketId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await parkingService.checkOut({ ticket_id: ticketId })
      setTicketData(data.summary)
    } catch (err: any) {
      setError(err.message || 'Check-out failed')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayment = () => {
    router.push(`/dashboard/parking/payment?ticket_id=${ticketId}`)
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '24px', color: '#1a1a2e' }}>
          Vehicle Check-Out
        </h2>

        {!ticketData ? (
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Ticket ID or License Plate *
                </label>
                <input
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="Enter ticket number or license plate"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  Enter ticket number, license plate, or scan QR code
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '12px',
                  marginBottom: '20px',
                  background: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '6px',
                  color: '#c33',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? '#999' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing...' : 'Calculate Fare'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '20px', marginBottom: '24px', color: '#1a1a2e' }}>
              Fare Summary
            </h3>

            <div style={{
              background: '#f9fafb',
              padding: '24px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong style={{ color: '#6b7280', fontSize: '12px' }}>Ticket Number</strong>
                  <div style={{ fontSize: '16px', color: '#1a1a2e' }}>{ticketData.ticket_number}</div>
                </div>
                <div>
                  <strong style={{ color: '#6b7280', fontSize: '12px' }}>License Plate</strong>
                  <div style={{ fontSize: '16px', color: '#1a1a2e' }}>{ticketData.license_plate}</div>
                </div>
                <div>
                  <strong style={{ color: '#6b7280', fontSize: '12px' }}>Vehicle Type</strong>
                  <div style={{ fontSize: '16px', color: '#1a1a2e' }}>{ticketData.vehicle_type}</div>
                </div>
                <div>
                  <strong style={{ color: '#6b7280', fontSize: '12px' }}>Duration</strong>
                  <div style={{ fontSize: '16px', color: '#1a1a2e' }}>{ticketData.duration_display}</div>
                </div>
                <div>
                  <strong style={{ color: '#6b7280', fontSize: '12px' }}>Check-in Time</strong>
                  <div style={{ fontSize: '14px', color: '#1a1a2e' }}>
                    {new Date(ticketData.check_in_time).toLocaleString()}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#6b7280', fontSize: '12px' }}>Check-out Time</strong>
                  <div style={{ fontSize: '14px', color: '#1a1a2e' }}>
                    {new Date(ticketData.check_out_time).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: '#f0fdf4',
              padding: '24px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#374151' }}>Subtotal</span>
                <span style={{ fontWeight: '600', color: '#1a1a2e' }}>Rs. {ticketData.subtotal.toFixed(2)}</span>
              </div>
              {ticketData.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#374151' }}>Discount</span>
                  <span style={{ fontWeight: '600', color: '#16a34a' }}>-Rs. {ticketData.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                paddingTop: '12px',
                borderTop: '1px solid #bbf7d0',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                <span style={{ color: '#1a1a2e' }}>Total Amount</span>
                <span style={{ color: '#16a34a' }}>Rs. {ticketData.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {ticketData.audit_alert && (
              <div style={{
                padding: '12px',
                marginBottom: '24px',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                color: '#92400e',
                fontSize: '14px'
              }}>
                ⚠️ {ticketData.audit_alert}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleProcessPayment}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Process Payment
              </button>
              <button
                onClick={() => {
                  setTicketData(null)
                  setTicketId('')
                }}
                style={{
                  padding: '12px 24px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
