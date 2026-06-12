'use client'

import { ReactNode } from 'react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: ReactNode
  brandTitle?: string
  brandSubtitle?: string
  showStats?: boolean
  darkMode?: boolean
}

export default function AuthLayout({ children, brandTitle, brandSubtitle, showStats = false, darkMode = false }: AuthLayoutProps) {
  const defaultTitle = 'Smart Parking Management'
  const defaultSubtitle = 'Multi-tenant parking management SaaS platform for modern parking businesses'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: darkMode ? '#0f0f0f' : 'var(--bg-base)' }}>
      {/* Left Panel - Brand Panel (40%) */}
      <div style={{
        width: '40%',
        background: darkMode ? '#1a1a1a' : 'radial-gradient(ellipse at 25% 15%, rgba(52,211,153,0.30), transparent 60%), radial-gradient(ellipse at 80% 85%, rgba(242,200,121,0.18), transparent 60%), #0A0E0D',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
        overflow: 'hidden',
      }}>
        {/* Animated gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(52,211,153,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(242,200,121,0.1) 0%, transparent 50%)',
          animation: 'gradientShift 8s ease-in-out infinite',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800,
              color: '#fff',
            }}>
              P
            </div>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>ParkSaaS</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 40,
            fontWeight: 700,
            color: '#fff',
            marginBottom: 16,
            lineHeight: 1.2,
          }}>
            {brandTitle || defaultTitle}
          </h1>
          <p style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 48,
            lineHeight: 1.6,
            maxWidth: 400,
          }}>
            {brandSubtitle || defaultSubtitle}
          </p>

          {/* Stats Cards */}
          {showStats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <StatCard number="200+" label="Active Tenants" highlight />
              <StatCard number="50K+" label="Daily Transactions" />
              <StatCard number="99.9%" label="Uptime" />
              <StatCard number="24/7" label="Support" />
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Form Panel (60%) */}
      <div style={{
        width: '60%',
        background: darkMode ? '#0f0f0f' : 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        position: 'relative',
      }}>
        {/* Subtle vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(52,211,153,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Form Card */}
        <div style={{
          width: '100%',
          maxWidth: 440,
          position: 'relative',
          zIndex: 1,
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function StatCard({ number, label, highlight }: { number: string; label: string; highlight?: boolean }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 16,
      padding: '20px',
      transition: 'all 0.3s ease',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'scale(1.02)'
      e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)'
      e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
    }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: highlight ? 'var(--accent-warm)' : '#fff', marginBottom: 4 }}>
        {number}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
        {label}
      </div>
    </div>
  )
}
