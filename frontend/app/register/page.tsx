'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '../../lib/auth'
import { useStore } from '../../store/useStore'
import AuthLayout from '../../components/AuthLayout'
import GlassCard from '../../components/ui/GlassCard'
import TextField from '../../components/ui/TextField'
import PasswordField from '../../components/ui/PasswordField'
import Button from '../../components/ui/Button'

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useStore((s) => s.setUser)
  const [form, setForm] = useState({ name: '', tenantName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }

    setLoading(true)
    try {
      const response = await authService.register(form)
      const slug = response.data?.tenant_slug || ''
      router.push(`/login?registered=true&email=${encodeURIComponent(form.email)}&slug=${encodeURIComponent(slug)}`)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      brandTitle="Join 200+ Growing Businesses"
      brandSubtitle="Start your parking management journey with ParkSaaS. Multi-tenant support, real-time analytics, and seamless operations."
      showStats={false}
    >
      <GlassCard
        title="Create Account"
        subtitle="Register your parking business and start managing operations"
      >
        <form onSubmit={handleSubmit}>
          <div className="animate-stagger-1">
            <TextField
              label="Business Name"
              placeholder="ABC Parking Pvt. Ltd."
              value={form.tenantName}
              onChange={(value) => setForm({ ...form, tenantName: value })}
              required
              icon={
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                  <line x1="9" y1="22" x2="9" y2="2" />
                  <path d="M9 7h6" />
                  <path d="M9 12h6" />
                  <path d="M9 17h6" />
                </svg>
              }
            />
          </div>

          <div className="animate-stagger-2">
            <TextField
              label="Owner Name"
              placeholder="Ram Sharma"
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
              required
              icon={
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
          </div>

          <div className="animate-stagger-3">
            <TextField
              label="Email Address"
              type="email"
              placeholder="owner@abc.com"
              value={form.email}
              onChange={(value) => setForm({ ...form, email: value })}
              required
              icon={
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
            />
          </div>

          <div className="animate-stagger-4">
            <PasswordField
              label="Password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(value) => setForm({ ...form, password: value })}
              showStrength={true}
              required
            />
          </div>

          <div className="animate-stagger-5">
            <PasswordField
              label="Confirm Password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(value) => setForm({ ...form, confirmPassword: value })}
              required
            />
          </div>

          <div className="animate-stagger-6" style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: '13px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{
                  marginTop: 2,
                  width: 16,
                  height: 16,
                  cursor: 'pointer',
                }}
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
            icon={
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            }
          >
            Create Account
          </Button>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Sign In
            </Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              ← Back to Home
            </Link>
          </div>
        </form>
      </GlassCard>
    </AuthLayout>
  )
}
