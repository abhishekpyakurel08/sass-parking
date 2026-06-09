'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { ratesService, type HourlyRate, type VehicleType } from '../../../lib/rates'

export default function RatesPage() {
  const [rates, setRates] = useState<HourlyRate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRate, setEditingRate] = useState<HourlyRate | null>(null)

  const [formData, setFormData] = useState({
    vehicle_type: 'CAR' as VehicleType,
    rate_per_hour: 0,
    lost_ticket_penalty: 0,
    grace_period_minutes: 0,
  })

  useEffect(() => {
    loadRates()
  }, [])

  const loadRates = async () => {
    try {
      setLoading(true)
      const data = await ratesService.getRates()
      setRates(data.data || [])
    } catch (err) {
      console.error('Failed to load rates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await ratesService.createRate(formData)
      setShowModal(false)
      setFormData({ vehicle_type: 'CAR', rate_per_hour: 0, lost_ticket_penalty: 0, grace_period_minutes: 0 })
      loadRates()
    } catch (err) {
      console.error('Failed to create rate:', err)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRate) return
    try {
      await ratesService.updateRate(editingRate._id, formData)
      setShowModal(false)
      setEditingRate(null)
      setFormData({ vehicle_type: 'CAR', rate_per_hour: 0, lost_ticket_penalty: 0, grace_period_minutes: 0 })
      loadRates()
    } catch (err) {
      console.error('Failed to update rate:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate?')) return
    try {
      await ratesService.deleteRate(id)
      loadRates()
    } catch (err) {
      console.error('Failed to delete rate:', err)
    }
  }

  const handleEdit = (rate: HourlyRate) => {
    setEditingRate(rate)
    setFormData({
      vehicle_type: rate.vehicle_type,
      rate_per_hour: rate.rate_per_hour,
      lost_ticket_penalty: rate.lost_ticket_penalty,
      grace_period_minutes: rate.grace_period_minutes,
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingRate(null)
    setFormData({ vehicle_type: 'CAR', rate_per_hour: 0, lost_ticket_penalty: 0, grace_period_minutes: 0 })
    setShowModal(true)
  }

  return (
    <DashboardLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', color: '#1a1a2e' }}>
            Hourly Rates
          </h2>
          <button
            onClick={openCreateModal}
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
            Add Rate
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Loading rates...
          </div>
        ) : (
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
                    Vehicle Type
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    Rate per Hour
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    Lost Ticket Penalty
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    Grace Period
                  </th>
                  <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e', fontWeight: '600' }}>
                      {rate.vehicle_type}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e', fontWeight: '600' }}>
                      Rs. {rate.rate_per_hour.toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e' }}>
                      Rs. {rate.lost_ticket_penalty.toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                      {rate.grace_period_minutes} minutes
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleEdit(rate)}
                        style={{
                          padding: '6px 12px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          marginRight: '8px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rate._id)}
                        style={{
                          padding: '6px 12px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px'
            }}>
              <h3 style={{ fontSize: '24px', marginBottom: '24px', color: '#1a1a2e' }}>
                {editingRate ? 'Edit Rate' : 'Add Rate'}
              </h3>

              <form onSubmit={editingRate ? handleUpdate : handleCreate}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                    Vehicle Type *
                  </label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as VehicleType })}
                    required
                    disabled={!!editingRate}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      background: editingRate ? '#f3f4f6' : 'white'
                    }}
                  >
                    <option value="CAR">Car</option>
                    <option value="BIKE">Bike</option>
                    <option value="SUV">SUV</option>
                    <option value="TRUCK">Truck</option>
                    <option value="BUS">Bus</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                    Rate per Hour (Rs.) *
                  </label>
                  <input
                    type="number"
                    value={formData.rate_per_hour}
                    onChange={(e) => setFormData({ ...formData, rate_per_hour: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
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

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                    Lost Ticket Penalty (Rs.)
                  </label>
                  <input
                    type="number"
                    value={formData.lost_ticket_penalty}
                    onChange={(e) => setFormData({ ...formData, lost_ticket_penalty: parseFloat(e.target.value) || 0 })}
                    min="0"
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

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                    Grace Period (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.grace_period_minutes}
                    onChange={(e) => setFormData({ ...formData, grace_period_minutes: parseInt(e.target.value) || 0 })}
                    min="0"
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

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {editingRate ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingRate(null)
                      setFormData({ vehicle_type: 'CAR', rate_per_hour: 0, lost_ticket_penalty: 0, grace_period_minutes: 0 })
                    }}
                    style={{
                      padding: '12px 24px',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
