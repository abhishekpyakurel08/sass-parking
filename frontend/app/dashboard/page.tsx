'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../components/DashboardLayout'
import { useStore } from '../../store/useStore'

export default function DashboardPage() {
  const router = useRouter()
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const user = useStore((s) => s.user)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const stats = [
    { label: 'Active Vehicles', value: '24', icon: '🚗', color: '#3b82f6' },
    { label: 'Today\'s Revenue', value: 'Rs. 12,450', icon: '💰', color: '#10b981' },
    { label: 'Total Customers', value: '156', icon: '👥', color: '#8b5cf6' },
    { label: 'Staff On Duty', value: '4', icon: '👔', color: '#f59e0b' },
  ]

  return (
    <DashboardLayout>
      <div>
        <h2 style={{ fontSize: '28px', marginBottom: '24px', color: '#1a1a2e' }}>
          Overview
        </h2>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${stat.color}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e' }}>
                    {stat.value}
                  </div>
                </div>
                <div style={{ fontSize: '40px' }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#1a1a2e' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🚗 Vehicle Check-In
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              💳 Process Payment
            </button>
            <button
              onClick={() => router.push('/dashboard/customers')}
              style={{
                padding: '12px 24px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              👥 Add Customer
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#1a1a2e' }}>
            Recent Activity
          </h3>
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
                    Activity
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    Time
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e' }}>
                    Vehicle Check-In - BA 12345
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                    2 minutes ago
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      background: '#d1fae5',
                      color: '#065f46',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Completed
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e' }}>
                    Payment Processed - Rs. 150
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                    15 minutes ago
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      background: '#d1fae5',
                      color: '#065f46',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Completed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#1a1a2e' }}>
                    Customer Added - John Doe
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                    1 hour ago
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      background: '#d1fae5',
                      color: '#065f46',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Completed
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
