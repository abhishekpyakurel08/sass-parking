'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '../../../../store/useStore'
import DashboardLayout from '../../../../components/DashboardLayout'
import { parkingService, type PaymentMethod } from '../../../../lib/parking'
import { scanSchema, processPaymentSchema } from '../../../../lib/validation.schemas'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'CASH', label: 'Cash', icon: '💵' },
  { value: 'CARD', label: 'Card', icon: '💳' },
  { value: 'ESEWA', label: 'eSewa', icon: '🟢' },
  { value: 'KHALTI', label: 'Khalti', icon: '🟣' },
  { value: 'IMEPAY', label: 'IMEPay', icon: '🔵' },
  { value: 'CONNECTIPS', label: 'ConnectIPS', icon: '🏦' },
]

export default function CheckOutPage() {
  const router = useRouter()
  const darkMode = useStore((s) => s.darkMode)
  const [step, setStep] = useState<'scan' | 'payment' | 'done'>('scan')
  const [scanCode, setScanCode] = useState('')
  const [ticketData, setTicketData] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [amountReceived, setAmountReceived] = useState('')
  const [txRef, setTxRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [receiptData, setReceiptData] = useState<any>(null)

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Validate with Zod
    const validationResult = scanSchema.safeParse({ code: scanCode })
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
    try {
      console.log('Scanning ticket with code:', scanCode)
      const data: any = await parkingService.scanTicket(scanCode)
      console.log('Scan response:', data)
      console.log('Response structure:', JSON.stringify(data, null, 2))
      
      // Handle different response structures - the backend returns { success: true, ticket: {...} }
      let foundTicket = null
      let ticketId = null
      
      if (data?.ticket) {
        foundTicket = data.ticket
        ticketId = foundTicket.ticket_id || foundTicket._id
      } else if (data?.data?.ticket) {
        foundTicket = data.data.ticket
        ticketId = foundTicket.ticket_id || foundTicket._id
      } else if (data?.success && data?.ticket) {
        foundTicket = data.ticket
        ticketId = foundTicket.ticket_id || foundTicket._id
      } else if (data?._id) {
        foundTicket = data
        ticketId = data._id
      }
      
      console.log('Found ticket:', foundTicket)
      console.log('Extracted ticket_id:', ticketId)
      
      if (foundTicket && ticketId) {
        // ticket found via scan - proceed to check-out
        const coData: any = await parkingService.checkOut({ ticket_id: ticketId })
        console.log('Check-out response:', coData)
        setTicketData(coData)
        setStep('payment')
      } else {
        console.error('No ticket found in response or no ticket_id')
        // Fetch available tickets to help user
        try {
          const ticketsData: any = await parkingService.getTickets(1, 10, 'ACTIVE')
          const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData?.data || [])
          console.log('Available active tickets:', tickets.map((t: any) => t.ticket_number || t.ticketNumber))
          if (tickets.length > 0) {
            const ticketNumbers = tickets.map((t: any) => t.ticket_number || t.ticketNumber).join(', ')
            setError(`Ticket not found. Available active tickets: ${ticketNumbers}`)
          } else {
            setError('Ticket not found. No active tickets exist. Please check-in a vehicle first.')
          }
        } catch (fetchErr) {
          console.error('Error fetching available tickets:', fetchErr)
          setError('Ticket not found. Please check the ticket number or license plate.')
        }
      }
    } catch (err: any) {
      console.error('Scan error:', err)
      console.error('Error response:', err.response?.data)
      setError(err.response?.data?.message || err.message || 'Ticket not found')
    }
    finally { setLoading(false) }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const tData = ticketData?.ticket || ticketData?.summary || ticketData;
    if (!tData || (!tData._id && !tData.ticket_id)) return
    
    setError('')
    setFieldErrors({})

    // Validate with Zod
    const payload: any = { 
      ticket_id: tData.ticket_id || tData._id, 
      payment_method: paymentMethod 
    }
    if (paymentMethod === 'CASH' && amountReceived) payload.amount_received = parseFloat(amountReceived)
    if (txRef) payload.transaction_reference = txRef

    const validationResult = processPaymentSchema.safeParse(payload)
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
    try {
      console.log('Payment payload:', payload)
      const receipt = await parkingService.processPayment(payload)
      console.log('Payment response:', receipt)
      setReceiptData(receipt)
      setStep('done')
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.response?.data?.message || err.message || 'Payment failed')
    }
    finally { setLoading(false) }
  }

  const tObj = ticketData?.ticket || ticketData?.summary || ticketData || {};
  const fare = ((tObj.fare_amount || tObj.fareAmount || tObj.subtotal || 0) + (tObj.penalty_amount || tObj.penaltyAmount || 0) - (tObj.discount_amount || tObj.discountAmount || tObj.discount || 0))
  const change = paymentMethod === 'CASH' && amountReceived ? Math.max(0, parseFloat(amountReceived) - fare) : 0

  return (
    <DashboardLayout title="Vehicle Check-Out" subtitle="Process vehicle exit and collect payment">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: darkMode ? '#2a2a2a' : 'var(--bg-card)', borderRadius: 12, padding: 4, border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
          {[{ key: 'scan', label: '1. Scan Ticket' }, { key: 'payment', label: '2. Payment' }, { key: 'done', label: '3. Done' }].map(s => (
            <div key={s.key} style={{
              flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: step === s.key ? 'var(--accent)' : 'transparent',
              color: step === s.key ? '#fff' : (darkMode ? '#888' : 'var(--text-muted)'),
              transition: 'var(--transition)',
            }}>{s.label}</div>
          ))}
        </div>

        {/* Step 1: Scan */}
        {step === 'scan' && (
          <div className="card" style={{ background: darkMode ? '#1a1a1a' : 'var(--bg-card)', border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)', marginBottom: 20 }}>Enter Ticket or License Plate</h3>
            <form onSubmit={handleScan}>
              <div className="form-group">
                <label className="form-label">Ticket Number / License Plate / QR Code</label>
                <input id="checkout-scan" className="form-input" type="text" autoFocus
                  placeholder="e.g. TKT-001 or BA 12 BA 1234"
                  value={scanCode} onChange={e => setScanCode(e.target.value)} required
                  style={{ fontSize: 16, letterSpacing: 1, fontWeight: 600, background: darkMode ? '#2a2a2a' : '', color: darkMode ? '#fff' : '' }} />
                <p className="form-hint" style={{ color: darkMode ? '#888' : '' }}>Scan QR code from physical ticket or enter the number manually</p>
                {fieldErrors.code && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.code}</p>}
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button type="submit" disabled={loading || !scanCode.trim()} className="btn btn-primary btn-full btn-lg">
                {loading ? <><span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Searching…</> : '🔍 Find Ticket'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 'payment' && ticketData && (
          <form onSubmit={handlePayment}>
            {/* Ticket summary */}
            <div className="card" style={{ marginBottom: 16, background: darkMode ? '#1a1a1a' : 'var(--bg-card)', border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)', marginBottom: 16 }}>Ticket Summary</h3>
              {[
                ['Ticket #', tObj.ticket_number || '—', true],
                ['License Plate', tObj.license_plate || tObj.vehiclePlateNumber || 'Guest'],
                ['Vehicle', tObj.vehicle_type || tObj.vehicleType || '—'],
                ['Duration', ticketData.duration_display || ticketData.summary?.duration_display || '—'],
                ['Fare', `Rs. ${(tObj.fare_amount || tObj.fareAmount || tObj.subtotal || 0).toFixed(0)}`],
                (tObj.penalty_amount || tObj.penaltyAmount || 0) > 0 ? ['Penalty', `Rs. ${(tObj.penalty_amount || tObj.penaltyAmount || 0).toFixed(0)}`] : null,
                (tObj.discount_amount || tObj.discountAmount || tObj.discount || 0) > 0 ? ['Discount', `- Rs. ${(tObj.discount_amount || tObj.discountAmount || tObj.discount || 0).toFixed(0)}`] : null,
              ].filter(Boolean).map(([k, v, accent]: any) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
                  <span style={{ color: darkMode ? '#888' : 'var(--text-muted)', fontSize: 13 }}>{k}</span>
                  <span style={{ fontWeight: 600, color: accent ? 'var(--accent)' : (darkMode ? '#fff' : 'var(--text)'), fontFamily: accent ? 'monospace' : undefined }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: darkMode ? '#fff' : 'var(--text)' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--green)' }}>Rs. {fare.toFixed(0)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="card" style={{ background: darkMode ? '#1a1a1a' : 'var(--bg-card)', border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {PAYMENT_METHODS.map(pm => (
                    <button key={pm.value} type="button" onClick={() => setPaymentMethod(pm.value)}
                      style={{
                        padding: '10px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                        border: paymentMethod === pm.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: paymentMethod === pm.value ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                        color: paymentMethod === pm.value ? 'var(--accent)' : 'var(--text-subtle)',
                        fontFamily: 'inherit', transition: 'var(--transition)',
                      }}>
                      <div style={{ fontSize: 20 }}>{pm.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{pm.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="form-group">
                  <label className="form-label">Amount Received (Rs.)</label>
                  <input className="form-input" type="number" min={fare} step="any"
                    placeholder={`Min: ${fare.toFixed(0)}`}
                    value={amountReceived} onChange={e => setAmountReceived(e.target.value)}
                    style={{ background: darkMode ? '#2a2a2a' : '', color: darkMode ? '#fff' : '' }} />
                  {fieldErrors.amount_received && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.amount_received}</p>}
                  {change > 0 && (
                    <div className="alert alert-success" style={{ marginTop: 10, marginBottom: 0 }}>
                      💰 Change to return: <strong>Rs. {change.toFixed(0)}</strong>
                    </div>
                  )}
                </div>
              )}

              {['ESEWA', 'KHALTI', 'IMEPAY', 'CONNECTIPS', 'CARD'].includes(paymentMethod) && (
                <div className="form-group">
                  <label className="form-label">Transaction Reference</label>
                  <input className="form-input" type="text" placeholder="Transaction ID or reference number"
                    value={txRef} onChange={e => setTxRef(e.target.value)}
                    style={{ background: darkMode ? '#2a2a2a' : '', color: darkMode ? '#fff' : '' }} />
                  {fieldErrors.transaction_reference && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldErrors.transaction_reference}</p>}
                </div>
              )}

              {error && <div className="alert alert-error">{error}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep('scan')}>← Back</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {loading ? <><span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing…</> : `✅ Collect Rs. ${fare.toFixed(0)}`}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="card" style={{ textAlign: 'center', padding: 40, background: darkMode ? '#1a1a1a' : 'var(--bg-card)', border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--green)' }}>
              <svg width="36" height="36" fill="none" stroke="var(--green)" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: darkMode ? '#fff' : 'var(--text)', marginBottom: 8 }}>Payment Complete!</h2>
            <p style={{ color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 28 }}>Vehicle has been checked out successfully.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => { setStep('scan'); setScanCode(''); setTicketData(null) }}>New Check-Out</button>
              <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>Go to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
