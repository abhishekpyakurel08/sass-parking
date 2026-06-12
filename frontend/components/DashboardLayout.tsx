'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useStore, type UserRole } from '../store/useStore'
import { authService } from '../lib/auth'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

const NAV_ICONS: Record<string, string> = {
  dashboard: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
}

interface NavItem { href: string; label: string; icon: string }

const ICON_CAR = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2l2-4h8l2 4h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
  </svg>
)
const ICON_GRID = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)
const ICON_USERS = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const ICON_TAG = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)
const ICON_CHART = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const ICON_BUILDING = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="2"/>
    <path d="M9 7h6M9 12h6M9 17h6"/>
  </svg>
)
const ICON_LOG = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)
const ICON_HARD_HAT = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/>
    <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3"/>
  </svg>
)
const ICON_PALETTE = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="17" r="2"/><circle cx="6" cy="12" r="3"/><circle cx="12" cy="19" r="2"/>
    <path d="M10.59 13.41a2 2 0 0 0 2.83 0l4.24-4.24a2 2 0 0 0 0-2.83l-4.24 4.24a2 2 0 0 0 0 2.83z"/>
  </svg>
)

const ICON_LOGOUT = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const ICON_CHEVRON = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const NavIcon = ({ name }: { name: string }) => {
  const icons: Record<string, JSX.Element> = {
    dashboard: <ICON_GRID />, parking: <ICON_CAR />, customers: <ICON_USERS />,
    rates: <ICON_TAG />, analytics: <ICON_CHART />, tenants: <ICON_BUILDING />,
    'audit-logs': <ICON_LOG />, staff: <ICON_HARD_HAT />, branding: <ICON_PALETTE />,
  }
  return icons[name] || <ICON_GRID />
}

const navItems = (role?: UserRole) => {
  const common: NavItem[] = [
    { href: '/dashboard', label: 'Overview', icon: 'dashboard' },
    { href: '/dashboard/parking', label: 'Parking', icon: 'parking' },
    { href: '/dashboard/customers', label: 'Customers', icon: 'customers' },
    { href: '/dashboard/rates', label: 'Rates', icon: 'rates' },
  ]
  const owner: NavItem[] = [
    { href: '/dashboard/analytics', label: 'Analytics', icon: 'analytics' },
    { href: '/dashboard/staff', label: 'Operators', icon: 'staff' },
    { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: 'audit-logs' },
    { href: '/dashboard/branding', label: 'Branding', icon: 'branding' },
  ]
  const admin: NavItem[] = [
    { href: '/dashboard/tenants', label: 'Tenants', icon: 'tenants' },
  ]
  if (role === 'SUPER_ADMIN') return [...common, ...owner, ...admin]
  if (role === 'TENANT_OWNER') return [...common, ...owner]
  return common
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useStore((s) => s.user)
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const darkMode = useStore((s) => s.darkMode)
  const toggleDarkMode = useStore((s) => s.toggleDarkMode)
  const clearUser = useStore((s) => s.clearUser)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null // don't flash dashboard content
  }

  const handleLogout = async () => {
    try { await authService.logout() } catch {}
    clearUser()
    router.push('/login')
  }

  const items = navItems(user?.role)
  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin', TENANT_OWNER: 'Tenant Owner', GATE_STAFF: 'Gate Staff'
  }

  const sidebarW = collapsed ? 72 : 260

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: darkMode ? '#0f0f0f' : 'var(--bg)' }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarW, minWidth: sidebarW, background: darkMode ? '#1a1a1a' : 'var(--bg-card)',
        borderRight: darkMode ? '1px solid #333' : '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>

        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 24px',
          borderBottom: darkMode ? '1px solid #333' : '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 72,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {user?.tenant_branding?.logoUrl ? (
                <img 
                  src={user.tenant_branding.logoUrl} 
                  alt="Logo" 
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    objectFit: 'contain', flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>{(user?.tenant_name || user?.name || 'P').charAt(0).toUpperCase()}</div>
              )}
              <span style={{ fontSize: 18, fontWeight: 700, color: darkMode ? '#fff' : 'var(--text)', display: 'flex', flexDirection: 'column' }}>
                <span>{user?.tenant_branding?.senderName || user?.tenant_name || 'ParkSaaS'}</span>
                {user?.tenant_branding?.tagline && (
                  <span style={{ fontSize: 12, fontWeight: 500, color: darkMode ? '#888' : 'var(--text-muted)' }}>
                    {user.tenant_branding.tagline}
                  </span>
                )}
              </span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: darkMode ? '#2a2a2a' : 'var(--bg-elevated)', border: darkMode ? '1px solid #333' : '1px solid var(--border)',
            borderRadius: 8, color: darkMode ? '#888' : 'var(--text-muted)', cursor: 'pointer',
            padding: '6px 8px', display: 'flex', alignItems: 'center',
            transition: 'var(--transition)',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = darkMode ? '#fff' : 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = darkMode ? '#888' : 'var(--text-muted)')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {collapsed
                ? <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
                : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {items.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 12,
                padding: collapsed ? '12px 0' : '11px 20px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                margin: '2px 8px', borderRadius: 8,
                color: active ? '#fff' : darkMode ? '#888' : 'var(--text-muted)',
                textDecoration: 'none',
                background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                boxShadow: active ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                transition: 'var(--transition)', fontWeight: active ? 600 : 400,
                fontSize: 14, whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = darkMode ? '#2a2a2a' : 'var(--bg-elevated)', e.currentTarget.style.color = darkMode ? '#fff' : 'var(--text)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = darkMode ? '#888' : 'var(--text-muted)' }}
                title={collapsed ? item.label : undefined}>
                <span style={{ flexShrink: 0 }}><NavIcon name={item.icon} /></span>
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ borderTop: darkMode ? '1px solid #333' : '1px solid var(--border)', padding: collapsed ? '16px 0' : '16px 20px' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#fff',
              }}>{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: darkMode ? '#888' : 'var(--text-muted)' }}>{roleLabel[user?.role || ''] || user?.role}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{
            width: '100%', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? 0 : 8,
          }}>
            <ICON_LOGOUT />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: sidebarW, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)', background: darkMode ? '#0f0f0f' : 'transparent' }}>

        {/* Topbar */}
        {(title || subtitle) && (
          <header style={{
            background: darkMode ? '#1a1a1a' : 'var(--bg-card)', borderBottom: darkMode ? '1px solid #333' : '1px solid var(--border)',
            padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              {title && <h1 style={{ fontSize: 22, fontWeight: 700, color: darkMode ? '#fff' : 'var(--text)', margin: 0 }}>{title}</h1>}
              {subtitle && <p style={{ fontSize: 13, color: darkMode ? '#888' : 'var(--text-muted)', marginTop: 4 }}>{subtitle}</p>}
            </div>
            <button
              onClick={toggleDarkMode}
              style={{
                background: darkMode ? '#2a2a2a' : 'var(--bg-elevated)',
                border: darkMode ? '1px solid #333' : '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: darkMode ? '#fff' : 'var(--text)',
              }}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </header>
        )}

        {/* Content */}
        <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
