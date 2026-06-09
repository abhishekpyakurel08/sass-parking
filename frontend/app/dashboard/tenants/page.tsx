'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { tenantService, type Tenant } from '../../../lib/tenant'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    corporate_email: '',
    owner_name: '',
    owner_email: '',
    password: '',
    contactNumber: '',
    address: '',
  })

  useEffect(() => {
    loadTenants()
  }, [page])

  const loadTenants = async () => {
    try {
      setLoading(true)
      const data = await tenantService.getTenants(page, 20)
      setTenants(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error('Failed to load tenants:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await tenantService.createTenant(formData)
      setShowModal(false)
      setFormData({ name: '', slug: '', corporate_email: '', owner_name: '', owner_email: '', password: '', contactNumber: '', address: '' })
      loadTenants()
    } catch (err) {
      console.error('Failed to create tenant:', err)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTenant) return
    try {
      await tenantService.updateTenant(editingTenant._id, formData)
      setShowModal(false)
      setEditingTenant(null)
      setFormData({ name: '', slug: '', corporate_email: '', owner_name: '', owner_email: '', password: '', contactNumber: '', address: '' })
      loadTenants()
    } catch (err) {
      console.error('Failed to update tenant:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This will delete all associated data.')) return
    try {
      await tenantService.deleteTenant(id)
      loadTenants()
    } catch (err) {
      console.error('Failed to delete tenant:', err)
    }
  }

  const handleSuspend = async (id: string) => {
    try {
      await tenantService.suspendTenant(id)
      loadTenants()
    } catch (err) {
      console.error('Failed to suspend tenant:', err)
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await tenantService.activateTenant(id)
      loadTenants()
    } catch (err) {
      console.error('Failed to activate tenant:', err)
    }
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      corporate_email: tenant.corporate_email,
      owner_name: tenant.ownerName,
      owner_email: '',
      password: '',
      contactNumber: tenant.contactNumber,
      address: tenant.address,
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingTenant(null)
    setFormData({ name: '', slug: '', corporate_email: '', owner_name: '', owner_email: '', password: '', contactNumber: '', address: '' })
    setShowModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10b981'
      case 'SUSPENDED':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  return (
    <DashboardLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', color: '#1a1a2e' }}>
            Tenant Management
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
            Add Tenant
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Loading tenants...
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
                      Name
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Slug
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Corporate Email
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Owner
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Contact
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e', fontWeight: '600' }}>
                        {tenant.name}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                        {tenant.slug}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                        {tenant.corporate_email}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e' }}>
                        {tenant.ownerName}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                        {tenant.contactNumber || '-'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: `${getStatusColor(tenant.status)}20`,
                          color: getStatusColor(tenant.status),
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {tenant.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleEdit(tenant)}
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
                        {tenant.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleSuspend(tenant._id)}
                            style={{
                              padding: '6px 12px',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              marginRight: '8px'
                            }}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(tenant._id)}
                            style={{
                              padding: '6px 12px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              marginRight: '8px'
                            }}
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(tenant._id)}
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
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ fontSize: '24px', marginBottom: '24px', color: '#1a1a2e' }}>
                {editingTenant ? 'Edit Tenant' : 'Add Tenant'}
              </h3>

              <form onSubmit={editingTenant ? handleUpdate : handleCreate}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    disabled={!!editingTenant}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      background: editingTenant ? '#f3f4f6' : 'white'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    value={formData.corporate_email}
                    onChange={(e) => setFormData({ ...formData, corporate_email: e.target.value })}
                    required
                    disabled={!!editingTenant}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      background: editingTenant ? '#f3f4f6' : 'white'
                    }}
                  />
                </div>

                {!editingTenant && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                        Owner Name *
                      </label>
                      <input
                        type="text"
                        value={formData.owner_name}
                        onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
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

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                        Owner Email *
                      </label>
                      <input
                        type="email"
                        value={formData.owner_email}
                        onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
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

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                        Password *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={8}
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
                  </>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
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
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                    {editingTenant ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingTenant(null)
                      setFormData({ name: '', slug: '', corporate_email: '', owner_name: '', owner_email: '', password: '', contactNumber: '', address: '' })
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
