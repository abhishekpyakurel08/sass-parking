'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '../../../../components/DashboardLayout'
import { parkingService, type PaymentMethod } from '../../../../lib/parking'

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ticketId = searchParams.get('ticket_id') || ''
  
  const [formData, setFormData] = useState({
    payment_method: 'CASH' as PaymentMethod,
    amount_received: '',
    transaction_reference: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const paymentData: any = {
        ticket_id: ticketId,
        payment_method: formData.payment_method,
      }

      if (formData.payment_method === 'CASH') {
        paymentData.amount_received = parseFloat(formData.amount_received)
      } else {
        paymentData.transaction_reference = formData.transaction_reference
      }

      const data = await parkingService.processPayment(paymentData)
      setReceiptData(data.receipt)
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (!ticketId) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#1a1a2e' }}>
            No Ticket Selected
          </h2>
          <button
            onClick={() => router.push('/dashboard/parking/check-out')}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Go to Check-Out
          </button>
        </div>
      </DashboardLayout>
    )
  }

  if (receiptData) {
    return (
      <DashboardLayout>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: 'white',
              fontSize: '40px',
              fontWeight: 'bold'
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#1a1a2e' }}>
              Payment Successful
            </h2>
            
            <div style={{
              background: '#f9fafb',
              padding: '24px',
              borderRadius: '8px',
              marginBottom: '24px',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6'
            }}>
              {receiptData.printable_text}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => router.push('/dashboard/parking/check-in')}
                style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                New Check-In
              </button>
              <button
                onClick={() => {
                  setReceiptData(null)
                  setFormData({
                    payment_method: 'CASH',
                    amount_received: '',
                    transaction_reference: '',
                  })
                }}
                style={{
                  padding: '12px 24px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Another Payment
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '24px', color: '#1a1a2e' }}>
          Process Payment
        </h2>

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
                Payment Method *
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="ESEWA">eSewa</option>
                <option value="KHALTI">Khalti</option>
                <option value="IMEPAY">IME Pay</option>
                <option value="CONNECTIPS">Connect IPS</option>
                <option value="WALLET">Wallet</option>
              </select>
            </div>

            {formData.payment_method === 'CASH' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Amount Received *
                </label>
                <input
                  type="number"
                  name="amount_received"
                  value={formData.amount_received}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {formData.payment_method !== 'CASH' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Transaction Reference *
                </label>
                <input
                  type="text"
                  name="transaction_reference"
                  value={formData.transaction_reference}
                  onChange={handleChange}
                  placeholder="TXN123456789"
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
              </div>
            )}

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
                background: loading ? '#999' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Processing...' : 'Complete Payment'}
            </button>
          </form>

          <button
            onClick={() => router.back()}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginTop: '12px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
