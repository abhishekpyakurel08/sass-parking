'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { ratesService, type HourlyRate, type CreateRateData, type UpdateRateData, type VehicleType } from '../../../lib/rates'

const VEHICLE_ICONS: Record<string, string> = { CAR: '🚗', BIKE: '🏍️', TRUCK: '🚛', SUV: '🚙', BUS: '🚌' }
const VEHICLE_TYPES: VehicleType[] = ['CAR', 'BIKE', 'SUV', 'TRUCK', 'BUS']

export default function RatesPage() {
  const [rates, setRates] = useState<HourlyRate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRate, setEditingRate] = useState<HourlyRate | null>(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const emptyForm: CreateRateData = { vehicle_type: 'CAR', rate_per_hour: 0, lost_ticket_penalty: 0, grace_period_minutes: 10 }
  const [form, setForm] = useState<any>(emptyForm)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data: any = await ratesService.getRates()
      setRates(Array.isArray(data) ? data : (data?.data || []))
    } catch { } finally { setLoading(false) }
  }

  const openCreate = () => { setEditingRate(null); setForm(emptyForm); setFormError(''); setShowModal(true) }
  const openEdit = (r: HourlyRate) => { setEditingRate(r); setForm({ vehicle_type: r.vehicle_type, rate_per_hour: r.rate_per_hour, lost_ticket_penalty: r.lost_ticket_penalty, grace_period_minutes: r.grace_period_minutes }); setFormError(''); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setFormLoading(true)
    try {
      if (editingRate) await ratesService.updateRate(editingRate.vehicle_type, { rate_per_hour: form.rate_per_hour, lost_ticket_penalty: form.lost_ticket_penalty, grace_period_minutes: form.grace_period_minutes })
      else await ratesService.createRate(form)
      setShowModal(false); load()
    } catch (err: any) { setFormError(err.message || 'Failed to save rate') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (vehicleType: VehicleType) => {
    if (!confirm(`Delete rate for ${vehicleType}?`)) return
    try { await ratesService.deleteRate(vehicleType); load() } catch {}
  }

  const coveredTypes = rates.map(r => r.vehicle_type)

  return (
    <DashboardLayout title="Parking Rates" subtitle="Configure hourly rates for each vehicle type">

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {VEHICLE_TYPES.filter(v => !coveredTypes.includes(v)).length > 0 && (
            <p style={{ fontSize: 13, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {VEHICLE_TYPES.filter(v => !coveredTypes.includes(v)).join(', ')} have no rates set
            </p>
          )}
        </div>
        <button id="add-rate-btn" className="btn btn-primary" onClick={openCreate}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Rate
        </button>
      </div>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : rates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <div className="empty-title">No rates configured</div>
          <p style={{ fontSize: 13, marginTop: 8 }}>Add rates for each vehicle type to enable fare calculation</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>Add First Rate</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {rates.map(rate => (
            <div key={rate._id} className="card" style={{ padding: 24, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 12, fontSize: 24,
                  background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border)',
                }}>{VEHICLE_ICONS[rate.vehicle_type]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{rate.vehicle_type}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Per-hour rate</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Hourly Rate</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>Rs. {rate.rate_per_hour}</span>
                </div>
                <div className="divider" style={{ margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Lost Ticket Penalty</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)' }}>Rs. {rate.lost_ticket_penalty}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Grace Period</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>{rate.grace_period_minutes} min</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(rate)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(rate.vehicle_type)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <h3 className="modal-title">{editingRate ? `Edit ${editingRate.vehicle_type} Rate` : 'Add Parking Rate'}</h3>
            <form onSubmit={handleSubmit}>
              {!editingRate && (
                <div className="form-group">
                  <label className="form-label">Vehicle Type *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                    {VEHICLE_TYPES.map(vt => (
                      <button key={vt} type="button" onClick={() => setForm({ ...form, vehicle_type: vt })}
                        style={{
                          padding: '10px 4px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                          border: form.vehicle_type === vt ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: form.vehicle_type === vt ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                          color: form.vehicle_type === vt ? 'var(--accent)' : 'var(--text-subtle)', fontFamily: 'inherit', transition: 'var(--transition)',
                        }}>
                        <div style={{ fontSize: 18 }}>{VEHICLE_ICONS[vt]}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>{vt}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Rate Per Hour (Rs.) *</label>
                <input className="form-input" type="number" min={0} step="any" required placeholder="50" value={form.rate_per_hour} onChange={e => setForm({ ...form, rate_per_hour: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Lost Ticket Penalty (Rs.)</label>
                <input className="form-input" type="number" min={0} step="any" placeholder="200" value={form.lost_ticket_penalty} onChange={e => setForm({ ...form, lost_ticket_penalty: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Grace Period (Minutes)</label>
                <input className="form-input" type="number" min={0} placeholder="10" value={form.grace_period_minutes} onChange={e => setForm({ ...form, grace_period_minutes: parseInt(e.target.value) || 0 })} />
                <p className="form-hint">Free parking within grace period after entry</p>
              </div>
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary" style={{ flex: 2 }}>
                  {formLoading ? 'Saving…' : editingRate ? 'Update Rate' : 'Create Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
