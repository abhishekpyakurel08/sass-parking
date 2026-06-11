'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { analyticsService } from '../../../lib/analytics'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week')
  const [stats, setStats] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any>(null)
  const [vehicleData, setVehicleData] = useState<any>(null)
  const [staffData, setStaffData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [period])

  const load = async () => {
    try {
      setLoading(true)
      const [dash, rev, veh, staff] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getRevenueStats(period),
        analyticsService.getVehicleStats(period),
        analyticsService.getStaffStats(period === 'month' ? 'week' : period),
      ])
      setStats(dash); setRevenueData(rev); setVehicleData(veh); setStaffData(staff)
    } catch { } finally { setLoading(false) }
  }

  const VEHICLE_COLORS: Record<string, string> = { CAR: '#6366f1', BIKE: '#10b981', SUV: '#f59e0b', TRUCK: '#ef4444', BUS: '#8b5cf6' }

  const statCards = [
    { label: 'Active Vehicles', value: stats?.activeVehicles ?? '—', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { label: "Today's Revenue", value: `Rs. ${(stats?.todayRevenue ?? 0).toLocaleString()}`, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Total Customers', value: stats?.totalCustomers ?? '—', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Staff On Duty', value: stats?.staffOnDuty ?? '—', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  ]

  const revenueItems: any[] = revenueData?.data || revenueData || []
  const maxRevenue = Math.max(...revenueItems.map((d: any) => d.revenue || 0), 1)
  const vehicleItems: any[] = vehicleData?.data || vehicleData || []
  const staffItems: any[] = staffData?.data || staffData || []

  return (
    <DashboardLayout title="Analytics" subtitle="Performance insights and revenue metrics">
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {(['today', 'week', 'month'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>{p}</button>
        ))}
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {statCards.map(c => (
          <div key={c.label} className="stat-card">
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 500 }}>{c.label}</p>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
              {loading ? <div style={{ width: 80, height: 28, background: 'var(--bg-elevated)', borderRadius: 6, animation: 'pulse 1.5s infinite' }} /> : c.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Revenue Chart */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Revenue Overview</h3>
          {loading ? (
            <div className="loading-container" style={{ height: 200 }}><div className="loading-spinner" /></div>
          ) : revenueItems.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div style={{ fontSize: 32 }}>📊</div>
              <div className="empty-title" style={{ fontSize: 15, marginTop: 12 }}>No revenue data</div>
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '40px 0 24px' }}>
              {revenueItems.map((item: any, i: number) => {
                const h = Math.max((item.revenue / maxRevenue) * 160, 4)
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', position: 'absolute', top: -20, whiteSpace: 'nowrap' }}>
                      {item.revenue > 0 ? `Rs.${(item.revenue / 1000).toFixed(1)}k` : ''}
                    </div>
                    <div style={{
                      width: '100%', height: h, borderRadius: '4px 4px 0 0',
                      background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
                      opacity: 0.85, transition: 'var(--transition)', cursor: 'default',
                    }}
                      title={`Rs. ${item.revenue?.toLocaleString()} – ${item.tickets || 0} tickets`} />
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Vehicle Distribution */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Vehicle Mix</h3>
          {loading ? (
            <div className="loading-container" style={{ height: 200 }}><div className="loading-spinner" /></div>
          ) : vehicleItems.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}><div style={{ fontSize: 32 }}>🚗</div><div className="empty-title" style={{ fontSize: 15, marginTop: 12 }}>No data</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {vehicleItems.map((item: any) => (
                <div key={item.vehicleType}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-subtle)', fontWeight: 500 }}>{item.vehicleType}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: VEHICLE_COLORS[item.vehicleType] || 'var(--accent)' }}>{(item.percentage || 0).toFixed(0)}%</span>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${item.percentage || 0}%`,
                      background: VEHICLE_COLORS[item.vehicleType] || 'var(--accent)',
                      borderRadius: 4, transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{item.count} vehicles</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Performance */}
      {staffItems.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Staff Performance</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th style={{ textAlign: 'right' }}>Tickets Processed</th>
                <th style={{ textAlign: 'right' }}>Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {staffItems.map((s: any, i: number) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-glow)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'var(--accent)',
                      }}>{(s.staffName || s.name || 'S').charAt(0)}</div>
                      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{s.staffName || s.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text)', fontWeight: 600 }}>{s.ticketsProcessed || s.tickets || 0}</td>
                  <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 700 }}>Rs. {(s.revenueGenerated || s.revenue || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}
