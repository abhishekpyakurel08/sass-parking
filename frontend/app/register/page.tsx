'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService } from '../../lib/auth'
import { useStore } from '../../store/useStore'

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useStore((s) => s.setUser)
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    corporate_email: '',
    owner_name: '',
    owner_email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authService.register(formData)
      setUser(response.user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
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
        maxWidth: '500px'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '8px',
          color: '#333',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          Register Your Business
        </h1>
        <p style={{ 
          textAlign: 'center', 
          marginBottom: '32px',
          color: '#666',
          fontSize: '14px'
        }}>
          Create your ParkSaaS tenant account
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              color: '#333',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Business Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Your business name"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              color: '#333',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Slug (optional)
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="your-business-slug"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              color: '#333',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Corporate Email *
            </label>
            <input
              type="email"
              name="corporate_email"
              value={formData.corporate_email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="business@company.com"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              color: '#333',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Owner Name *
            </label>
            <input
              type="text"
              name="owner_name"
              value={formData.owner_name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Owner's full name"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              color: '#333',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Owner Email *
            </label>
            <input
              type="email"
              name="owner_email"
              value={formData.owner_email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="owner@email.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px',
              color: '#333',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Min 8 characters"
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ 
          marginTop: '24px', 
          textAlign: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          Already have an account?{' '}
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
