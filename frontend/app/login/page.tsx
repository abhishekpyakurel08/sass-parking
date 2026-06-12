'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '../../store/useStore'
import { loginSchema } from '../../lib/validation.schemas'
import AuthLayout from '../../components/AuthLayout'
import GlassCard from '../../components/ui/GlassCard'
import TextField from '../../components/ui/TextField'
import PasswordField from '../../components/ui/PasswordField'
import Button from '../../components/ui/Button'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const darkMode = useStore((s) => s.darkMode)
  const toggleDarkMode = useStore((s) => s.toggleDarkMode)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Pre-fill email from URL parameters
  useEffect(() => {
    const emailFromUrl = searchParams.get('email')
    if (emailFromUrl) {
      setFormData(f => ({ ...f, email: emailFromUrl }))
    }
  }, [searchParams])

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Validate with Zod
    const validationResult = loginSchema.safeParse({
      email: formData.email,
      password: formData.password,
    })

    if (!validationResult.success) {
      const errors: Record<string, string> = {}
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message
        }
      })
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    const form = new FormData(e.currentTarget)

    // Backend expects JSON body with email and password
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email") as string,
        password: form.get("password") as string,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.message ?? "Login failed")
      setLoading(false)
      return
    }

    const data = await res.json()
    // Backend returns: { success, message, data: { access_token, user: { slug, ... }, ... } }

    // Store access token
    localStorage.setItem("access_token", data.data.access_token)
    // Refresh token is stored in httpOnly cookie by backend

    // Redirect to tenant subdomain
    const isDev = process.env.NODE_ENV === "development"
    const baseHost = isDev ? "localhost:3000" : "buddhadental.com"
    const tenantSlug = data.data.user.slug
    const redirectUrl = `http://${tenantSlug}.${baseHost}/dashboard`

    window.location.href = redirectUrl   // hard navigate — crosses subdomain boundary
  }

  return (
    <AuthLayout
      brandTitle="Smart Parking Management"
      brandSubtitle="Multi-tenant SaaS platform for modern parking businesses. Real-time tracking, analytics, and multi-payment support."
      showStats={true}
      darkMode={darkMode}
    >
      <GlassCard
        title="Welcome back"
        subtitle="Sign in to your ParkSaaS account"
        darkMode={darkMode}
      >
        <button
          onClick={toggleDarkMode}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: darkMode ? '#2a2a2a' : 'rgba(255,255,255,0.8)',
            border: darkMode ? '1px solid #333' : '1px solid rgba(255,255,255,0.3)',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: darkMode ? '#fff' : '#333',
            fontSize: 13,
            fontWeight: 500,
            backdropFilter: 'blur(10px)',
          }}
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        {searchParams.get('registered') === 'true' && (
          <div className="alert alert-success animate-fade-in" style={{ marginBottom: '20px' }}>
            Registration successful! Please check your email to verify your account, and sign in below.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="animate-stagger-1">
            <TextField
              name="email"
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              required
              error={fieldErrors.email}
              icon={
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
            />
          </div>

          <div className="animate-stagger-2">
            <PasswordField
              name="password"
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              required
              error={fieldErrors.password}
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
