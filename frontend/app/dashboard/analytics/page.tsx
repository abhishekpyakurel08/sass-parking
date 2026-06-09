'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import { analyticsService } from '../../../lib/analytics'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [stats, setStats] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any>(null)
  const [vehicleData, setVehicleData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [dashboardStats, revenue, vehicles] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getRevenueStats(period),
        analyticsService.getVehicleStats(period),
      ])
      setStats(dashboardStats)
      setRevenueData(revenue)
      setVehicleData(vehicles)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          Loading analytics...
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', color: '#1a1a2e' }}>
            Analytics
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '8px 16px',
                  background: period === p ? '#3b82f6' : 'white',
                  color: period === p ? 'white' : '#374151',
                  border: period === p ? 'none' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #3b82f6'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Active Vehicles
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a2e' }}>
              {stats?.activeVehicles || 0}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #10b981'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Today's Revenue
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a2e' }}>
              Rs. {(stats?.todayRevenue || 0).toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #8b5cf6'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Total Customers
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a2e' }}>
              {stats?.totalCustomers || 0}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #f59e0b'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Staff on Duty
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a2e' }}>
              {stats?.staffOnDuty || 0}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '32px'
        }}>
          <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#1a1a2e' }}>
            Revenue Overview
          </h3>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            {revenueData?.data?.map((item: any, index: number) => {
              const maxRevenue = Math.max(...(revenueData.data || []).map((d: any) => d.revenue))
              const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
              return (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    background: '#3b82f6',
                    borderRadius: '4px 4px 0 0',
                    height: `${height}%`,
                    minHeight: '4px',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    bottom: '-24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '12px',
                    color: '#6b7280',
                    whiteSpace: 'nowrap'
                  }}>
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '-24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '12px',
                    color: '#1a1a2e',
                    fontWeight: '600'
                  }}>
                    Rs. {item.revenue.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Vehicle Distribution */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#1a1a2e' }}>
            Vehicle Distribution
          </h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {vehicleData?.data?.map((item: any) => (
              <div key={item.vehicleType} style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                  {item.vehicleType}
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div
                    style={{
                      background: '#8b5cf6',
                      height: '24px',
                      width: `${item.percentage}%`,
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
                <div style={{ fontSize: '14px', color: '#1a1a2e', fontWeight: '600' }}>
                  {item.count} vehicles ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
