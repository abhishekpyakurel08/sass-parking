'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { tenantService, type Tenant } from '../../../lib/tenant'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [search, setSearch] = useState('')

  const emptyForm = { name: '', slug: '', corporate_email: '', owner_name: '', owner_email: '', password: '', contactNumber: '', address: '' }
  const [form, setForm] = useState<any>(emptyForm)

  useEffect(() => { load() }, [page])

  const load = async () => {
    try {
      setLoading(true)
      const data: any = await tenantService.getTenants(page, 15)
      setTenants(data?.data || [])
      setTotalPages(data?.pagination?.totalPages || 1)
      setTotal(data?.pagination?.total || 0)
    } catch { } finally { setLoading(false) }
  }

  const openCreate = () => { setEditingTenant(null); setForm(emptyForm); setFormError(''); setShowModal(true) }
  const openEdit = (t: Tenant) => { setEditingTenant(t); setForm({ name: t.name, slug: t.slug, corporate_email: t.corporate_email, owner_name: t.ownerName, owner_email: '', password: '', contactNumber: t.contactNumber || '', address: t.address || '' }); setFormError(''); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setFormLoading(true)
    try {
      if (editingTenant) await tenantService.updateTenant(editingTenant._id, { name: form.name, contactNumber: form.contactNumber, address: form.address })
      else await tenantService.createTenant(form)
      setShowModal(false); load()
    } catch (err: any) { setFormError(err.message || 'Operation failed') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tenant and ALL associated data? This cannot be undone.')) return
    try { await tenantService.deleteTenant(id); load() } catch {}
  }

  const handleSuspend = async (t: Tenant) => {
    if (!confirm(`Suspend ${t.name}? They will lose access.`)) return
    try { await tenantService.suspendTenant(t._id); load() } catch {}
  }

  const handleActivate = async (id: string) => {
    try { await tenantService.activateTenant(id); load() } catch {}
  }

  const filtered = tenants.filter(t =>
    search === '' || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase())
  )

  return (
    <DashboardLayout title="Tenant Management" subtitle={`${total} registered parking businesses`}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', width: 280 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="form-input" style={{ paddingLeft: 38 }} placeholder="Search tenants…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button id="add-tenant-btn" className="btn btn-primary" onClick={openCreate}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Tenant
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <div className="empty-title">{search ? 'No matches found' : 'No tenants yet'}</div>
            <p style={{ fontSize: 13, marginTop: 8 }}>Create the first parking business tenant</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Slug</th>
                <th>Owner</th>
                <th>Contact</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: `hsl(${t.name.charCodeAt(0) * 7 % 360}, 60%, 20%)`,
                        border: `1px solid hsl(${t.name.charCodeAt(0) * 7 % 360}, 60%, 35%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: `hsl(${t.name.charCodeAt(0) * 7 % 360}, 80%, 70%)`,
                      }}>{t.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.corporate_email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 13 }}>{t.slug}</td>
                  <td style={{ color: 'var(--text-subtle)' }}>{t.ownerName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{t.contactNumber || '—'}</td>
                  <td>
                    <span className={`badge ${t.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{t.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>Edit</button>
                      {t.status === 'ACTIVE'
                        ? <button className="btn btn-warning btn-sm" onClick={() => handleSuspend(t)}>Suspend</button>
                        : <button className="btn btn-success btn-sm" onClick={() => handleActivate(t._id)}>Activate</button>}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)}>Delete</button>
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
            <h3 className="modal-title">{editingTenant ? `Edit — ${editingTenant.name}` : 'Register New Tenant'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Business Name *</label>
                <input className="form-input" required placeholder="ABC Parking Pvt. Ltd." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              {!editingTenant && (
                <>
                  <div className="form-group">
                    <label className="form-label">Slug (URL identifier)</label>
                    <input className="form-input" placeholder="abc-parking (auto-generated if blank)" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Corporate Email *</label>
                    <input className="form-input" type="email" required placeholder="info@abcparking.com" value={form.corporate_email} onChange={e => setForm({ ...form, corporate_email: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Owner Name *</label>
                      <input className="form-input" required placeholder="Ram Sharma" value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Owner Email *</label>
                      <input className="form-input" type="email" required placeholder="owner@abc.com" value={form.owner_email} onChange={e => setForm({ ...form, owner_email: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input className="form-input" type="password" required minLength={8} placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input className="form-input" type="tel" placeholder="+977 1-XXXXXXX" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-textarea" placeholder="Kathmandu, Nepal" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ minHeight: 72 }} />
              </div>
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary" style={{ flex: 2 }}>
                  {formLoading ? 'Saving…' : editingTenant ? 'Update Tenant' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
