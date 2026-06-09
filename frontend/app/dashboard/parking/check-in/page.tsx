'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../../components/DashboardLayout'
import { parkingService, type VehicleType } from '../../../../lib/parking'

export default function CheckInPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    license_plate: '',
    vehicle_type: 'CAR' as VehicleType,
    customer_code: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState<any>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await parkingService.checkIn(formData)
      setTicketData(data)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Check-in failed')
    } finally {
      setLoading(false)
    }
  }

  if (success && ticketData) {
    return (
      <DashboardLayout>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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
              Vehicle Checked In Successfully
            </h2>
            
            <div style={{
              background: '#f9fafb',
              padding: '24px',
              borderRadius: '8px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Ticket Number:</strong> {ticketData.ticket.ticket_number}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>License Plate:</strong> {ticketData.ticket.license_plate}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Vehicle Type:</strong> {ticketData.ticket.vehicle_type}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Check-in Time:</strong> {new Date(ticketData.ticket.check_in_time).toLocaleString()}
              </div>
              {ticketData.ticket.customer_name && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>Customer:</strong> {ticketData.ticket.customer_name}
                </div>
              )}
            </div>

            {ticketData.receipt.qr_code_url && (
              <div style={{ marginBottom: '24px' }}>
                <img 
                  src={ticketData.receipt.qr_code_url} 
                  alt="QR Code" 
                  style={{ maxWidth: '200px', margin: '0 auto' }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  Scan QR code to check out
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setSuccess(false)
                  setTicketData(null)
                  setFormData({
                    license_plate: '',
                    vehicle_type: 'CAR',
                    customer_code: '',
                    notes: '',
                  })
                }}
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
                Check In Another Vehicle
              </button>
              <button
                onClick={() => router.push('/dashboard/parking/check-out')}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Go to Check Out
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '24px', color: '#1a1a2e' }}>
          Vehicle Check-In
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
                License Plate
              </label>
              <input
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                placeholder="BA 12345"
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
                Leave empty for guest vehicles
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Vehicle Type *
              </label>
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
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
                <option value="CAR">Car</option>
                <option value="BIKE">Bike</option>
                <option value="SUV">SUV</option>
                <option value="TRUCK">Truck</option>
                <option value="BUS">Bus</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Customer Code
              </label>
              <input
                type="text"
                name="customer_code"
                value={formData.customer_code}
                onChange={handleChange}
                placeholder="CUST001"
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
                Enter customer code for registered customers
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
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
              {loading ? 'Processing...' : 'Check In Vehicle'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
