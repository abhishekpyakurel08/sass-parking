'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { customerService, type Customer } from '../../../lib/customer'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [formData, setFormData] = useState({
    name: '',
    customer_code: '',
    email: '',
    phone_number: '',
    discount_percentage: 0,
  })

  useEffect(() => {
    loadCustomers()
  }, [page])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const data = await customerService.getCustomers(page, 20)
      setCustomers(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error('Failed to load customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await customerService.createCustomer(formData)
      setShowModal(false)
      setFormData({ name: '', customer_code: '', email: '', phone_number: '', discount_percentage: 0 })
      loadCustomers()
    } catch (err) {
      console.error('Failed to create customer:', err)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return
    try {
      await customerService.updateCustomer(editingCustomer._id, formData)
      setShowModal(false)
      setEditingCustomer(null)
      setFormData({ name: '', customer_code: '', email: '', phone_number: '', discount_percentage: 0 })
      loadCustomers()
    } catch (err) {
      console.error('Failed to update customer:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      await customerService.deleteCustomer(id)
      loadCustomers()
    } catch (err) {
      console.error('Failed to delete customer:', err)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      customer_code: customer.customer_code,
      email: customer.email || '',
      phone_number: customer.phone_number || '',
      discount_percentage: customer.discount_percentage,
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setEditingCustomer(null)
    setFormData({ name: '', customer_code: '', email: '', phone_number: '', discount_percentage: 0 })
    setShowModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10b981'
      case 'SUSPENDED':
        return '#f59e0b'
      case 'EXPIRED':
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
            Customers
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
            Add Customer
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Loading customers...
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
                      Customer Code
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Name
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Email
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Phone
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Discount
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Total Savings
                    </th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e', fontWeight: '600' }}>
                        {customer.customer_code}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e' }}>
                        {customer.name}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                        {customer.email || '-'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                        {customer.phone_number || '-'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e', fontWeight: '600' }}>
                        {customer.discount_percentage}%
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: `${getStatusColor(customer.status)}20`,
                          color: getStatusColor(customer.status),
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {customer.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e', fontWeight: '600' }}>
                        Rs. {customer.total_savings.toFixed(2)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleEdit(customer)}
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
                          onClick={() => handleDelete(customer._id)}
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
                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
              </h3>

              <form onSubmit={editingCustomer ? handleUpdate : handleCreate}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                    Name *
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
                    Customer Code *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_code}
                    onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
                    required
                    disabled={!!editingCustomer}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      background: editingCustomer ? '#f3f4f6' : 'white'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
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
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
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
                    {editingCustomer ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingCustomer(null)
                      setFormData({ name: '', customer_code: '', email: '', phone_number: '', discount_percentage: 0 })
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
