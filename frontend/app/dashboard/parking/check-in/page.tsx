'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '../../../../store/useStore'
import DashboardLayout from '../../../../components/DashboardLayout'
import { parkingService, type VehicleType } from '../../../../lib/parking'
import { checkInSchema } from '../../../../lib/validation.schemas'

export default function CheckInPage() {
  const router = useRouter()
  const darkMode = useStore((s) => s.darkMode)
  const [formData, setFormData] = useState({ license_plate: '', vehicle_type: 'CAR' as VehicleType, customer_code: '', notes: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    
    // Validate with Zod
    const validationResult = checkInSchema.safeParse({
      license_plate: formData.license_plate || undefined,
      vehicle_type: formData.vehicle_type,
      customer_code: formData.customer_code || undefined,
      notes: formData.notes || undefined,
    })

    if (!validationResult.success) {
      const errors: Record<string, string> = {}
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message
        }
      })
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const payload = {
        license_plate: formData.license_plate || undefined,
        vehicle_type: formData.vehicle_type,
        customer_code: formData.customer_code || undefined,
        notes: formData.notes || undefined,
      }
      const data = await parkingService.checkIn(payload)
      setTicketData(data)
    } catch (err: any) { setError(err.message || 'Check-in failed') }
    finally { setLoading(false) }
  }

  const vehicleTypes: { value: VehicleType; label: string; icon: string }[] = [
    { value: 'CAR', label: 'Car', icon: '🚗' }, { value: 'BIKE', label: 'Bike', icon: '🏍️' },
    { value: 'SUV', label: 'SUV', icon: '🚙' }, { value: 'TRUCK', label: 'Truck', icon: '🚛' },
    { value: 'BUS', label: 'Bus', icon: '🚌' },
  ]

  if (ticketData) {
    const t = ticketData?.ticket || ticketData?.data?.ticket || ticketData?.summary || ticketData
    return (
      <DashboardLayout title="Check-In Successful" subtitle="Vehicle has been checked in">
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="card" style={{ textAlign: 'center', padding: 40, background: darkMode ? '#1a1a1a' : 'var(--bg-card)', border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--green)',
            }}>
              <svg width="36" height="36" fill="none" stroke="var(--green)" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: darkMode ? '#fff' : 'var(--text)', marginBottom: 24 }}>Vehicle Checked In!</h2>

            <div style={{ background: darkMode ? '#2a2a2a' : 'var(--bg-elevated)', borderRadius: 12, padding: 24, textAlign: 'left', marginBottom: 24, border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
              {[
                ['Ticket Number', t?.ticket_number, true],
                ['License Plate', t?.license_plate || 'Guest'],
                ['Vehicle Type', t?.vehicle_type],
                ['Check-In Time', t?.check_in_time ? new Date(t.check_in_time).toLocaleString() : '—'],
                t?.customer_name ? ['Customer', t.customer_name] : null,
              ].filter(Boolean).map(([k, v, accent]: any) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
                  <span style={{ color: darkMode ? '#888' : 'var(--text-muted)', fontSize: 13 }}>{k}</span>
                  <span style={{ fontWeight: 600, color: accent ? 'var(--accent)' : (darkMode ? '#fff' : 'var(--text)'), fontFamily: accent ? 'monospace' : undefined }}>{v}</span>
                </div>
              ))}
            </div>

            {(ticketData.receipt?.qr_code_url || ticketData.data?.receipt?.qr_code_url) && (
              <div style={{ marginBottom: 24 }}>
                <img src={ticketData.receipt?.qr_code_url || ticketData.data?.receipt?.qr_code_url} alt="QR Code" style={{ width: 160, height: 160, borderRadius: 8, border: darkMode ? '1px solid #333' : '1px solid var(--border)' }} />
                <p style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)', marginTop: 8 }}>Scan QR to check out</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => { setTicketData(null); setFormData({ license_plate: '', vehicle_type: 'CAR', customer_code: '', notes: '' }) }}>
                Check In Another
              </button>
              <button className="btn btn-success" onClick={() => router.push('/dashboard/parking/check-out')}>
                Go to Check-Out →
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Vehicle Check-In" subtitle="Register a new vehicle entering the parking facility">
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div className="card" style={{ background: darkMode ? '#1a1a1a' : 'var(--bg-card)', border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit}>
            {/* Vehicle Type Selector */}
            <div className="form-group">
              <label className="form-label">Vehicle Type *</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {vehicleTypes.map(vt => (
                  <button key={vt.value} type="button"
                    onClick={() => setFormData({ ...formData, vehicle_type: vt.value })}
                    style={{
                      flex: 1, minWidth: 80, padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                      border: formData.vehicle_type === vt.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: formData.vehicle_type === vt.value ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                      color: formData.vehicle_type === vt.value ? 'var(--accent)' : 'var(--text-subtle)',
                      fontFamily: 'inherit', transition: 'var(--transition)', textAlign: 'center',
                    }}>
                    <div style={{ fontSize: 22 }}>{vt.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{vt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">License Plate</label>
              <input id="checkin-plate" className="form-input" type="text" placeholder="BA 12 BA 1234"
                value={formData.license_plate}
                onChange={e => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, background: darkMode ? '#2a2a2a' : '', color: darkMode ? '#fff' : '' }} />
              <p className="form-hint" style={{ color: darkMode ? '#888' : '' }}>Leave empty for guest vehicles without registration</p>
              {fieldErrors.license_plate && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.license_plate}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Customer Code</label>
              <input id="checkin-customer" className="form-input" type="text" placeholder="CUST-001 (optional)"
                value={formData.customer_code}
                onChange={e => setFormData({ ...formData, customer_code: e.target.value.toUpperCase() })}
                style={{ background: darkMode ? '#2a2a2a' : '', color: darkMode ? '#fff' : '' }} />
              <p className="form-hint" style={{ color: darkMode ? '#888' : '' }}>Registered customers get their discount applied automatically</p>
              {fieldErrors.customer_code && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.customer_code}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea id="checkin-notes" className="form-textarea" placeholder="Any additional notes..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                style={{ minHeight: 80, background: darkMode ? '#2a2a2a' : '', color: darkMode ? '#fff' : '' }} />
              {fieldErrors.notes && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.notes}</p>}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
              <button id="checkin-submit" type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? <><span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing…</> : '🚗 Check In Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
