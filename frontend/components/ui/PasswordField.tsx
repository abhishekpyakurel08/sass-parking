'use client'

import { useState } from 'react'

interface PasswordFieldProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  helperText?: string
  showStrength?: boolean
  required?: boolean
  name?: string
}

export default function PasswordField({
  label,
  placeholder = '••••••••',
  value,
  onChange,
  error,
  helperText,
  showStrength = false,
  required = false,
  name,
}: PasswordFieldProps) {
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)

  const strength = calculateStrength(value || '')
  const strengthColor = getStrengthColor(strength)
  const strengthText = getStrengthText(strength)

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
        {/* Lock Icon */}
        <div style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: focused ? 'var(--accent)' : 'var(--text-secondary)',
          transition: 'all 0.2s ease',
          zIndex: 1,
        }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <input
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: '12px 44px 12px 44px',
            background: 'var(--bg-input)',
            border: `1px solid ${error ? 'var(--error)' : focused ? 'var(--accent)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: focused && !error ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
          }}
        />

        {/* Eye Toggle */}
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4,
            transition: 'all 0.2s ease',
            zIndex: 1,
          }}
        >
          {visible ? (
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 0 5.06-5.94M9.9 4.24A9.12 9.12 0 0 0 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          )}
        </button>
      </div>

      {/* Password Strength Meter */}
      {showStrength && value && (
        <div style={{ marginTop: '8px' }}>
          <div style={{
            display: 'flex',
            gap: 4,
            marginBottom: 4,
          }}>
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: level <= strength ? strengthColor : 'var(--border-subtle)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
          <div style={{
            fontSize: '11px',
            color: strengthColor,
            fontWeight: 500,
          }}>
            {strengthText}
          </div>
        </div>
      )}

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

function calculateStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  return Math.min(strength, 4)
}

function getStrengthColor(strength: number): string {
  if (strength === 0) return 'var(--error)'
  if (strength === 1) return 'var(--error)'
  if (strength === 2) return 'var(--yellow)'
  if (strength === 3) return 'var(--success)'
  return 'var(--success)'
}

function getStrengthText(strength: number): string {
  if (strength === 0) return 'Very weak'
  if (strength === 1) return 'Weak'
  if (strength === 2) return 'Fair'
  if (strength === 3) return 'Good'
  return 'Strong'
}
