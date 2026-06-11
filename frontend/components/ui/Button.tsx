'use client'

import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  icon?: ReactNode
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  icon,
}: ButtonProps) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: size === 'sm' ? '8px 16px' : size === 'lg' ? '14px 28px' : '10px 20px',
    borderRadius: 'var(--radius-sm)',
    fontSize: size === 'sm' ? '13px' : size === 'lg' ? '16px' : '14px',
    fontWeight: size === 'lg' ? 600 : 500,
    fontFamily: 'inherit',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
    textDecoration: 'none',
    width: fullWidth ? '100%' : 'auto',
  }

  const variantStyles = {
    primary: {
      background: 'var(--accent-primary)',
      color: '#fff',
      boxShadow: disabled || loading ? 'none' : '0 8px 24px rgba(99,102,241,0.35)',
      opacity: disabled || loading ? 0.5 : 1,
    },
    secondary: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
      opacity: disabled || loading ? 0.5 : 1,
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border)',
      opacity: disabled || loading ? 0.5 : 1,
    },
  }

  const hoverStyles = !disabled && !loading ? {
    primary: {
      transform: 'translateY(-1px)',
    },
    secondary: {
      background: 'var(--bg-card)',
      color: 'var(--text-primary)',
    },
    ghost: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
    },
  } : {}

  const activeStyles = !disabled && !loading ? {
    transform: 'translateY(0)',
  } : {}

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, hoverStyles[variant])
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = ''
          if (variant === 'secondary' || variant === 'ghost') {
            e.currentTarget.style.background = variantStyles[variant].background
            e.currentTarget.style.color = variantStyles[variant].color
          }
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
    >
      {loading ? (
        <>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 0.7s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span style={{ display: 'flex' }}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
}
