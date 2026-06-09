'use client'

import { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore, type UserRole } from '../store/useStore'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const user = useStore((s) => s.user)
  const clearUser = useStore((s) => s.clearUser)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    clearUser()
    router.push('/login')
  }

  const getNavItems = () => {
    const role = user?.role

    const commonItems = [
      { href: '/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/dashboard/parking', label: 'Parking', icon: '🚗' },
      { href: '/dashboard/customers', label: 'Customers', icon: '👥' },
      { href: '/dashboard/rates', label: 'Rates', icon: '💰' },
    ]

    const ownerItems = [
      { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
      { href: '/dashboard/staff', label: 'Staff', icon: '👔' },
    ]

    const adminItems = [
      { href: '/dashboard/tenants', label: 'Tenants', icon: '🏢' },
      { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: '📋' },
    ]

    if (role === 'SUPER_ADMIN') {
      return [...commonItems, ...ownerItems, ...adminItems]
    }
    if (role === 'TENANT_OWNER') {
      return [...commonItems, ...ownerItems]
    }
    return commonItems
  }

  const navItems = getNavItems()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '250px' : '64px',
        background: '#1a1a2e',
        color: 'white',
        transition: 'width 0.3s',
        position: 'fixed',
        height: '100%',
        left: 0,
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center'
        }}>
          {sidebarOpen && (
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
              ParkSaaS
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav style={{ padding: '20px 0' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                color: '#a0a0a0',
                textDecoration: 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#16213e'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#a0a0a0'
              }}
            >
              <span style={{ fontSize: '20px', marginRight: sidebarOpen ? '12px' : '0' }}>
                {item.icon}
              </span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: sidebarOpen ? '250px' : '64px',
        flex: 1,
        transition: 'margin-left 0.3s',
        width: '100%'
      }}>
        {/* Header */}
        <header style={{
          background: 'white',
          padding: '16px 32px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#1a1a2e' }}>
              Dashboard
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Welcome back, {user?.name}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {user?.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
