'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../../components/DashboardLayout'
import { parkingService, type PaymentMethod } from '../../../../lib/parking'

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
  const [step, setStep] = useState<'scan' | 'payment' | 'done'>('scan')
  const [scanCode, setScanCode] = useState('')
  const [ticketData, setTicketData] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [amountReceived, setAmountReceived] = useState('')
  const [txRef, setTxRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [receiptData, setReceiptData] = useState<any>(null)

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data: any = await parkingService.scanTicket(scanCode)
      if (data?.ticket) {
        // ticket found via scan
        const coData: any = await parkingService.checkOut({ ticket_id: data.ticket._id })
        setTicketData(coData)
        setStep('payment')
      }
    } catch (err: any) { setError(err.message || 'Ticket not found') }
    finally { setLoading(false) }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketData?.ticket?._id) return
    setError('')
    setLoading(true)
    try {
      const payload: any = { ticket_id: ticketData.ticket._id, payment_method: paymentMethod }
      if (paymentMethod === 'CASH' && amountReceived) payload.amount_received = parseFloat(amountReceived)
      if (txRef) payload.transaction_reference = txRef
      const receipt = await parkingService.processPayment(payload)
      setReceiptData(receipt)
      setStep('done')
    } catch (err: any) { setError(err.message || 'Payment failed') }
    finally { setLoading(false) }
  }

  const fare = ticketData?.ticket
    ? ((ticketData.ticket.fare_amount || 0) + (ticketData.ticket.penalty_amount || 0) - (ticketData.ticket.discount_amount || 0))
    : 0
  const change = paymentMethod === 'CASH' && amountReceived ? Math.max(0, parseFloat(amountReceived) - fare) : 0

  return (
    <DashboardLayout title="Vehicle Check-Out" subtitle="Process vehicle exit and collect payment">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'var(--bg-card)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
          {[{ key: 'scan', label: '1. Scan Ticket' }, { key: 'payment', label: '2. Payment' }, { key: 'done', label: '3. Done' }].map(s => (
            <div key={s.key} style={{
              flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: step === s.key ? 'var(--accent)' : 'transparent',
              color: step === s.key ? '#fff' : 'var(--text-muted)',
              transition: 'var(--transition)',
            }}>{s.label}</div>
          ))}
        </div>

        {/* Step 1: Scan */}
        {step === 'scan' && (
          <div className="card">
            <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Enter Ticket or License Plate</h3>
            <form onSubmit={handleScan}>
              <div className="form-group">
                <label className="form-label">Ticket Number / License Plate / QR Code</label>
                <input id="checkout-scan" className="form-input" type="text" autoFocus
                  placeholder="e.g. TKT-001 or BA 12 BA 1234"
                  value={scanCode} onChange={e => setScanCode(e.target.value)} required
                  style={{ fontSize: 16, letterSpacing: 1, fontWeight: 600 }} />
                <p className="form-hint">Scan QR code from physical ticket or enter the number manually</p>
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
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Ticket Summary</h3>
              {[
                ['Ticket #', ticketData.ticket?.ticket_number, true],
                ['License Plate', ticketData.ticket?.license_plate || 'Guest'],
                ['Vehicle', ticketData.ticket?.vehicle_type],
                ['Duration', ticketData.duration_display || '—'],
                ['Fare', `Rs. ${(ticketData.ticket?.fare_amount || 0).toFixed(0)}`],
                ticketData.ticket?.penalty_amount > 0 ? ['Penalty', `Rs. ${ticketData.ticket.penalty_amount}`] : null,
                ticketData.ticket?.discount_amount > 0 ? ['Discount', `- Rs. ${ticketData.ticket.discount_amount}`] : null,
              ].filter(Boolean).map(([k, v, accent]: any) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{k}</span>
                  <span style={{ fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text)', fontFamily: accent ? 'monospace' : undefined }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--green)' }}>Rs. {fare.toFixed(0)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="card">
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
                    value={amountReceived} onChange={e => setAmountReceived(e.target.value)} />
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
                    value={txRef} onChange={e => setTxRef(e.target.value)} />
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
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--green)' }}>
              <svg width="36" height="36" fill="none" stroke="var(--green)" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Payment Complete!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Vehicle has been checked out successfully.</p>
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
