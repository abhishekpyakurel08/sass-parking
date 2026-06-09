'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '../../lib/auth'

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
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            ✓
          </div>
          <h1 style={{ 
            marginBottom: '12px',
            color: '#333',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            Check Your Email
          </h1>
          <p style={{ 
            marginBottom: '24px',
            color: '#666',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
          </p>
          <Link 
            href="/login"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '8px',
          color: '#333',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          Forgot Password?
        </h1>
        <p style={{ 
          textAlign: 'center', 
          marginBottom: '32px',
          color: '#666',
          fontSize: '14px'
        }}>
          Enter your email to receive a reset link
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              color: '#333',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your email"
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              color: '#c33',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#999' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ 
          marginTop: '24px', 
          textAlign: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          Remember your password?{' '}
          <Link 
            href="/login"
            style={{ 
              color: '#667eea', 
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
