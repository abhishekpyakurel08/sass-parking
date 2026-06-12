'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '../../components/DashboardLayout'
import { useStore } from '../../store/useStore'
import { analyticsService } from '../../lib/analytics'
import { parkingService } from '../../lib/parking'
import RevenueBarChart from '../../components/charts/RevenueBarChart'
import VehicleBarChart from '../../components/charts/VehicleBarChart'

export default function DashboardPage() {
  const router = useRouter()
  const darkMode = useStore((s) => s.darkMode)
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const user = useStore((s) => s.user)
  const [stats, setStats] = useState<any>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [vehicleData, setVehicleData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    loadData()
  }, [isAuthenticated])

  const loadData = async () => {
    try {
      const [dashStats, ticketData, revenueStats, vehicleStats] = await Promise.all([
        analyticsService.getDashboardStats(),
        parkingService.getTickets(1, 5),
        analyticsService.getRevenueStats('week'),
        analyticsService.getVehicleStats('week'),
      ])
      setStats(dashStats)
      // Handle different response structures
      const ticketsArray = Array.isArray(ticketData) ? ticketData : (ticketData as any)?.data || []
      setTickets(ticketsArray)
      setRevenueData(Array.isArray(revenueStats) ? revenueStats : (revenueStats as any)?.data || [])
      setVehicleData(Array.isArray(vehicleStats) ? vehicleStats : (vehicleStats as any)?.data || [])
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) return null

  const statCards = [
    {
      label: 'Active Vehicles',
      value: loading ? '—' : (stats?.activeVehicles ?? 0),
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2l2-4h8l2 4h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
      color: '#6366f1', bg: 'rgba(99,102,241,0.12)', change: '+12%',
    },
    {
      label: "Today's Revenue",
      value: loading ? '—' : `Rs. ${(stats?.todayRevenue ?? 0).toLocaleString()}`,
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      color: '#10b981', bg: 'rgba(16,185,129,0.12)', change: '+8%',
    },
    {
      label: 'Total Customers',
      value: loading ? '—' : (stats?.totalCustomers ?? 0),
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', change: '+3%',
    },
    {
      label: 'Staff On Duty',
      value: loading ? '—' : (stats?.staffOnDuty ?? 0),
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', change: '0',
    },
  ]

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = { ACTIVE: 'badge-blue', PENDING_PAYMENT: 'badge-yellow', PAID: 'badge-green' }
    return <span className={`badge ${map[status] || 'badge-blue'}`}>{status.replace('_', ' ')}</span>
  }

  const quickActions = [
    { label: 'Vehicle Check-In', href: '/dashboard/parking/check-in', color: '#6366f1', icon: '🚗' },
    { label: 'Vehicle Check-Out', href: '/dashboard/parking/check-out', color: '#10b981', icon: '✅' },
    { label: 'Add Customer', href: '/dashboard/customers', color: '#8b5cf6', icon: '👤' },
    { label: 'View Analytics', href: '/dashboard/analytics', color: '#f59e0b', icon: '📊' },
  ]

  return (
    <DashboardLayout>
      {/* Welcome header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
          Here's what's happening at your parking facility today.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(card => (
          <div key={card.label} className="stat-card" style={{ cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 500 }}>{card.label}</p>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
                  {loading ? (
                    <div style={{ width: 80, height: 28, background: 'var(--bg-elevated)', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
                  ) : card.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 8, fontWeight: 500 }}>{card.change !== '0' && `↑ ${card.change} this week`}</div>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: card.bg,
                color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24, background: darkMode ? '#1a1a1a' : '', border: darkMode ? '1px solid #333' : '' }}>
          <RevenueBarChart data={revenueData} title="Weekly Revenue" />
        </div>
        <div className="card" style={{ padding: 24, background: darkMode ? '#1a1a1a' : '', border: darkMode ? '1px solid #333' : '' }}>
          <VehicleBarChart data={vehicleData} title="Vehicle Distribution" />
        </div>
      </div>

      {/* Quick Actions + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 24 }}>

        {/* Quick Actions */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickActions.map(a => (
              <Link key={a.href} href={a.href} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: 'var(--bg-elevated)', borderRadius: 10, textDecoration: 'none',
                border: '1px solid var(--border)', transition: 'var(--transition)',
                color: 'var(--text-subtle)', fontSize: 14, fontWeight: 500,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-subtle)' }}>
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                {a.label}
                <svg style={{ marginLeft: 'auto' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Recent Tickets</h3>
            <Link href="/dashboard/parking" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {loading ? (
            <div className="loading-container"><div className="loading-spinner" /></div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎟️</div>
              <div className="empty-title">No tickets yet</div>
              <p style={{ fontSize: 13, marginTop: 8, marginBottom: 16 }}>Check-in a vehicle to get started</p>
              <Link href="/dashboard/parking/check-in" className="btn btn-primary btn-sm">
                Check-In Vehicle
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Plate</th>
                  <th>Type</th>
                  <th>Check-In</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t._id || t.ticket_number}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>{t.ticket_number || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{t.license_plate || t.vehiclePlateNumber || '—'}</td>
                    <td>{t.vehicle_type || t.vehicleType || '—'}</td>
                    <td>{t.check_in_time || t.checkInTime ? new Date(t.check_in_time || t.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>{getStatusBadge(t.status || t.paymentStatus)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>
                      Rs. {((t.fare_amount || t.fareAmount || 0) + (t.penalty_amount || t.penaltyAmount || 0) - (t.discount_amount || t.discountAmount || 0)).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
