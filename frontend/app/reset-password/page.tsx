'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authService } from '../../lib/auth'
import AuthLayout from '../../components/AuthLayout'
import GlassCard from '../../components/ui/GlassCard'
import PasswordField from '../../components/ui/PasswordField'
import Button from '../../components/ui/Button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const token = searchParams.get('token')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid reset token. Please request a new password reset link.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        brandTitle="Password Reset Successful"
        brandSubtitle="Your password has been updated successfully"
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
              Password Reset Successful
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
              Your password has been updated successfully. You can now login with your new password.
            </p>
            <Link href="/login">
              <Button fullWidth size="lg">
                Go to Login
              </Button>
            </Link>
          </div>
        </GlassCard>
      </AuthLayout>
    )
  }

  if (!token) {
    return (
      <AuthLayout
        brandTitle="Invalid Reset Link"
        brandSubtitle="The password reset link is invalid or has expired"
        showStats={false}
      >
        <GlassCard>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              margin: '0 auto 24px',
              background: 'var(--error-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--error)',
            }}>
              <svg width="36" height="36" fill="none" stroke="var(--error)" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Invalid Reset Link
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
              The password reset link is invalid or has expired. Please request a new password reset link.
            </p>
            <Link href="/forgot-password">
              <Button fullWidth size="lg">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        </GlassCard>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      brandTitle="Reset Your Password"
      brandSubtitle="Create a new secure password for your ParkSaaS account"
      showStats={false}
    >
      <GlassCard
        title="Create New Password"
        subtitle="Enter your new password below"
      >
        <form onSubmit={handleSubmit}>
          <div className="animate-stagger-1">
            <PasswordField
              label="New Password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(value) => setPassword(value)}
              showStrength={true}
              required
            />
          </div>

          <div className="animate-stagger-2">
            <PasswordField
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(value) => setConfirmPassword(value)}
              required
            />
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
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
              Reset Password
            </Button>
          </div>

          <div className="animate-stagger-4" style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
            <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              ← Back to Login
            </Link>
          </div>
        </form>
      </GlassCard>
    </AuthLayout>
  )
}
