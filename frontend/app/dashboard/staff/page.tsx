'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { staffService, type Staff, type CreateStaffData } from '../../../lib/staff'

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')

  const emptyForm: CreateStaffData = { name: '', email: '', password: '', gate_assignment: 'BOTH', ticket_prefix: '' }
  const [form, setForm] = useState<any>(emptyForm)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data: any = await staffService.getStaff()
      setStaff(Array.isArray(data) ? data : (data?.data || []))
    } catch { } finally { setLoading(false) }
  }

  const openCreate = () => { setEditingStaff(null); setForm(emptyForm); setFormError(''); setNewApiKey(''); setShowModal(true) }
  const openEdit = (s: Staff) => { setEditingStaff(s); setForm({ name: s.name, email: s.email, gate_assignment: s.gate_assignment, ticket_prefix: s.ticket_prefix }); setFormError(''); setNewApiKey(''); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setFormLoading(true); setNewApiKey('')
    try {
      if (editingStaff) await staffService.updateStaff(editingStaff._id, { name: form.name, gate_assignment: form.gate_assignment, ticket_prefix: form.ticket_prefix })
      else {
        const res: any = await staffService.createStaff(form)
        if (res.api_key?.raw_key) setNewApiKey(res.api_key.raw_key)
      }
      if (editingStaff) setShowModal(false) // Keep modal open on create to show API key
      load()
    } catch (err: any) { setFormError(err.message || 'Operation failed') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this staff member?')) return
    try { await staffService.deleteStaff(id); load() } catch {}
  }

  const handleRegenerateKey = async (id: string) => {
    if (!confirm('Regenerate API key? The old key will immediately stop working.')) return
    try {
      setFormLoading(true)
      const res: any = await staffService.regenerateApiKey(id)
      if (res.api_key?.raw_key) {
        setNewApiKey(res.api_key.raw_key)
        setShowModal(true) // Show modal just to display the key
        setEditingStaff(staff.find(s => s._id === id) || null)
      }
    } catch (err: any) { alert(err.message) }
    finally { setFormLoading(false) }
  }

  return (
    <DashboardLayout title="Operators & Staff" subtitle="Manage gate operators and API access keys">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ flex: 1 }}></div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Operator
        </button>
      </div>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : staff.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👷</div>
          <div className="empty-title">No operators found</div>
          <p style={{ fontSize: 13, marginTop: 8 }}>Add your first gate staff member to start processing vehicles</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>Add Operator</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Operator Name</th>
                <th>Gate Assignment</th>
                <th>Ticket Prefix</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 18, flexShrink: 0,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                      }}>👷</div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-blue`}>{s.gate_assignment}</span>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{s.ticket_prefix || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-warning btn-sm" onClick={() => handleRegenerateKey(s._id)}>Reset API Key</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !newApiKey) setShowModal(false) }}>
          <div className="modal">
            {newApiKey ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔑</div>
                <h3 className="modal-title" style={{ marginBottom: 8 }}>Save API Key & Password</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                  Please save this API key securely. It will <strong style={{ color: 'var(--red)' }}>never be shown again</strong>.
                  The operator will need this key to configure their hardware POS device.
                </p>
                <div style={{ 
                  background: 'var(--bg-elevated)', padding: 16, borderRadius: 8, 
                  border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 16,
                  color: 'var(--accent)', wordBreak: 'break-all', marginBottom: 24, userSelect: 'all'
                }}>
                  {newApiKey}
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setNewApiKey(''); setShowModal(false) }}>
                  I have saved the API key
                </button>
              </div>
            ) : (
              <>
                <h3 className="modal-title">{editingStaff ? `Edit Operator` : 'Add New Operator'}</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input className="form-input" required placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" required placeholder="john@example.com" value={form.email} disabled={!!editingStaff} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  {!editingStaff && (
                    <div className="form-group">
                      <label className="form-label">Initial Password *</label>
                      <input className="form-input" type="password" required minLength={8} placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Gate Assignment</label>
                    <select className="form-input" value={form.gate_assignment} onChange={e => setForm({ ...form, gate_assignment: e.target.value })}>
                      <option value="BOTH">Both (Entry & Exit)</option>
                      <option value="ENTRY">Entry Only</option>
                      <option value="EXIT">Exit Only</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ticket Prefix</label>
                    <input className="form-input" placeholder="e.g. N1" maxLength={3} value={form.ticket_prefix} onChange={e => setForm({ ...form, ticket_prefix: e.target.value.toUpperCase() })} />
                    <p className="form-hint">A short prefix added to tickets generated by this operator (e.g. N1-10023)</p>
                  </div>
                  {formError && <div className="alert alert-error">{formError}</div>}
                  <div className="modal-actions">
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" disabled={formLoading} className="btn btn-primary" style={{ flex: 2 }}>
                      {formLoading ? 'Saving…' : editingStaff ? 'Update Operator' : 'Create Operator'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
