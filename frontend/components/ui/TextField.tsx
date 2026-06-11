'use client'

import { useState } from 'react'

interface TextFieldProps {
  label?: string
  placeholder?: string
  type?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  helperText?: string
  icon?: React.ReactNode
  disabled?: boolean
  required?: boolean
  name?: string
}

export default function TextField({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  icon,
  disabled = false,
  required = false,
  name,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ marginBottom: '20px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {label}
          {required && <span style={{ color: 'var(--error)', marginLeft: 4 }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: focused ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
            zIndex: 1,
          }}>
            {icon}
          </div>
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: icon ? '12px 16px 12px 44px' : '12px 16px',
            background: 'var(--bg-input)',
            border: `1px solid ${error ? 'var(--error)' : focused ? 'var(--accent)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'all 0.2s ease',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.5 : 1,
            boxShadow: focused && !error ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
          }}
        />
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: '6px',
          fontSize: '12px',
          color: 'var(--error)',
          animation: 'slideIn 0.2s ease',
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {helperText && !error && (
        <div style={{
          marginTop: '6px',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}>
          {helperText}
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
