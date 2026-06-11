'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authService } from '../../lib/auth'
import { useStore } from '../../store/useStore'
import { api } from '../../lib/api'
import AuthLayout from '../../components/AuthLayout'
import GlassCard from '../../components/ui/GlassCard'
import TextField from '../../components/ui/TextField'
import PasswordField from '../../components/ui/PasswordField'
import Button from '../../components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setUser = useStore((s) => s.setUser)
  const setTenantSlug = useStore((s) => s.setTenantSlug)
  const [formData, setFormData] = useState({ email: '', password: '', slug: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Pre-fill slug from URL ?slug=xxx or subdomain
  useEffect(() => {
    const slugFromUrl = searchParams.get('slug')
    let subdomainSlug = null;
    
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host.endsWith('.localhost')) {
        subdomainSlug = host.split('.')[0];
      } else {
        const parts = host.split('.');
        if (parts.length >= 3 && parts[0] !== 'www' && !host.includes('localhost')) {
          subdomainSlug = parts[0];
        }
      }
    }
    
    if (slugFromUrl) {
      setFormData(f => ({ ...f, slug: slugFromUrl }))
    } else if (subdomainSlug && subdomainSlug !== 'www') {
      setFormData(f => ({ ...f, slug: subdomainSlug }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // Set tenant slug from URL param or form input before login request
    const slugToUse = formData.slug.trim().toLowerCase() || searchParams.get('slug')?.toLowerCase()
    if (slugToUse) {
      api.setTenantSlug(slugToUse)
    }
    try {
      const response = await authService.login({ email: formData.email, password: formData.password })
      setUser(response.data?.user || response.user as any)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      brandTitle="Smart Parking Management"
      brandSubtitle="Multi-tenant SaaS platform for modern parking businesses. Real-time tracking, analytics, and multi-payment support."
      showStats={true}
    >
      <GlassCard
        title="Welcome back"
        subtitle="Sign in to your ParkSaaS account"
      >
        <form onSubmit={handleSubmit}>
          <div className="animate-stagger-1">
            <TextField
              label="Business Slug"
              placeholder="e.g. dipika"
              value={formData.slug}
              onChange={(value) => setFormData({ ...formData, slug: value.toLowerCase().replace(/\s+/g, '-') })}
              helperText="Your parking business identifier (used in the URL)"
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
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              required
              icon={
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
            />
          </div>

          <div className="animate-stagger-3">
            <PasswordField
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              required
            />
          </div>

          {error && (
            <div className="alert alert-error animate-stagger-4" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div className="animate-stagger-5">
            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              Sign In
            </Button>
          </div>

          <div className="animate-stagger-6" style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
            <Link href="/forgot-password" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
            New parking business?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Register here
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
