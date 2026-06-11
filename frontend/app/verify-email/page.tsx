'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authService } from '../../lib/auth'
import AuthLayout from '../../components/AuthLayout'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid or missing verification token.')
      return
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token)
        setStatus('success')
        setMessage('Your email has been successfully verified. You can now sign in to your account.')
      } catch (err: any) {
        setStatus('error')
        setMessage(err.message || 'Failed to verify email. The link might be expired or invalid.')
      }
    }

    verify()
  }, [token])

  return (
    <AuthLayout
      brandTitle="Verify Your Email"
      brandSubtitle="Secure your account and start managing your parking business."
      showStats={false}
    >
      <GlassCard
        title={status === 'loading' ? 'Verifying Email' : status === 'success' ? 'Email Verified' : 'Verification Failed'}
        subtitle={status === 'loading' ? 'Please wait while we verify your email address...' : message}
      >
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          {status === 'loading' && (
            <div className="flex justify-center">
              <svg className="animate-spin h-10 w-10 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {status === 'success' && (
            <div className="w-full animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center border border-green-500/20">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <Button
                onClick={() => router.push('/login')}
                fullWidth
                size="lg"
                icon={
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                }
              >
                Sign In Now
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="w-full animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <Button
                onClick={() => router.push('/login')}
                fullWidth
                size="lg"
                variant="secondary"
              >
                Return to Login
              </Button>
            </div>
          )}
        </div>
      </GlassCard>
    </AuthLayout>
  )
}
