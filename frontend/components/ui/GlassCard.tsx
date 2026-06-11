'use client'

import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export default function GlassCard({ children, title, subtitle }: GlassCardProps) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 'var(--radius-xl)',
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {title && (
          <>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: subtitle ? '8px' : '24px',
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '24px',
                lineHeight: 1.5,
              }}>
                {subtitle}
              </p>
            )}
          </>
        )}
        {children}
      </div>
    </div>
  )
}
