'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '../../lib/auth'
import AuthLayout from '../../components/AuthLayout'
import GlassCard from '../../components/ui/GlassCard'
import TextField from '../../components/ui/TextField'
import Button from '../../components/ui/Button'

export default function ForgotPasswordPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authService.forgotPassword(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        brandTitle="We'll Get You Back In"
        brandSubtitle="Secure password recovery for your ParkSaaS account"
        showStats={false}
      >
        <GlassCard>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              margin: '0 auto 24px',
              background: 'var(--success-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--success)',
            }}>
              <svg width="36" height="36" fill="none" stroke="var(--success)" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Check Your Email
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
              We've sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Please check your inbox and follow the instructions.
            </p>
            <Link href="/login">
              <Button fullWidth size="lg">
                Back to Login
              </Button>
            </Link>
          </div>
        </GlassCard>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      brandTitle="We'll Get You Back In"
      brandSubtitle="Secure password recovery for your ParkSaaS account"
      showStats={false}
    >
      <GlassCard
        title="Forgot Password"
        subtitle="Enter your email to receive a password reset link"
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            margin: '0 auto 16px',
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="animate-stagger-1">
            <TextField
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(value) => setEmail(value)}
              required
              icon={
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
            />
          </div>

          {error && (
            <div className="alert alert-error animate-stagger-2" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div className="animate-stagger-3">
            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              Send Reset Link
            </Button>
          </div>

          <div className="animate-stagger-4" style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
            <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              ← Back to Login
            </Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Back to Home
            </Link>
          </div>
        </form>
      </GlassCard>
    </AuthLayout>
  )
}
