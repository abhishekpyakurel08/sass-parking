'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { customerService, type Customer, type CreateCustomerData, type UpdateCustomerData } from '../../../lib/customer'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const emptyForm: CreateCustomerData = { name: '', customer_code: '', email: '', phone_number: '', discount_percentage: 0 }
  const [form, setForm] = useState<any>(emptyForm)

  useEffect(() => { load() }, [page])

  const load = async () => {
    try {
      setLoading(true)
      const data: any = await customerService.getCustomers(page, 15)
      setCustomers(data?.data || [])
      setTotalPages(data?.pagination?.totalPages || 1)
      setTotal(data?.pagination?.total || 0)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const openCreate = () => { setEditingCustomer(null); setForm(emptyForm); setFormError(''); setShowModal(true) }
  const openEdit = (c: Customer) => { setEditingCustomer(c); setForm({ name: c.name, customer_code: c.customer_code, email: c.email || '', phone_number: c.phone_number || '', discount_percentage: c.discount_percentage, status: c.status }); setFormError(''); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setFormLoading(true)
    try {
      if (editingCustomer) await customerService.updateCustomer(editingCustomer._id, form)
      else await customerService.createCustomer(form)
      setShowModal(false); load()
    } catch (err: any) { setFormError(err.message || 'Operation failed') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return
    try { await customerService.deleteCustomer(id); load() } catch {}
  }

  const handleRegenQR = async (id: string) => {
    try { await customerService.regenerateQrCode(id); load() } catch {}
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { ACTIVE: 'badge-green', SUSPENDED: 'badge-red', EXPIRED: 'badge-yellow' }
    return <span className={`badge ${map[s] || 'badge-blue'}`}>{s}</span>
  }

  return (
    <DashboardLayout title="Customers" subtitle={`${total} registered customers`}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div />
        <button id="add-customer-btn" className="btn btn-primary" onClick={openCreate}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Customer
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /></div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No customers yet</div>
            <p style={{ fontSize: 13, marginTop: 8 }}>Add your first registered customer</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Code</th>
                <th>Contact</th>
                <th>Discount</th>
                <th>Savings</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#fff',
                      }}>{c.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>{c.customer_code}</td>
                  <td>{c.phone_number || '—'}</td>
                  <td>
                    {c.discount_percentage > 0
                      ? <span className="badge badge-purple">{c.discount_percentage}% off</span>
                      : <span style={{ color: 'var(--text-muted)' }}>None</span>}
                  </td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>Rs. {(c.total_savings || 0).toLocaleString()}</td>
                  <td>{statusBadge(c.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRegenQR(c._id)} title="Regenerate QR">♻️</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>Del</button>
                    </div>
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

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <h3 className="modal-title">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" required placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              {!editingCustomer && (
                <div className="form-group">
                  <label className="form-label">Customer Code *</label>
                  <input className="form-input" required placeholder="CUST-001" value={form.customer_code} onChange={e => setForm({ ...form, customer_code: e.target.value.toUpperCase() })} style={{ textTransform: 'uppercase' }} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="john@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" placeholder="+977 98XXXXXXXX" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Discount Percentage (%)</label>
                <input className="form-input" type="number" min={0} max={100} placeholder="0" value={form.discount_percentage} onChange={e => setForm({ ...form, discount_percentage: parseFloat(e.target.value) || 0 })} />
              </div>
              {editingCustomer && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              )}
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary" style={{ flex: 2 }}>
                  {formLoading ? 'Saving…' : editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
