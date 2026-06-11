'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/login')
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, marginBottom: 24,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, fontWeight: 800, color: '#fff',
        animation: 'pulse 1.5s infinite'
      }}>P</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 500 }}>
        Redirecting to ParkSaaS...
      </div>
    </div>
  )
}
