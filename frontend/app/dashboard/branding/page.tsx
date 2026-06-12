'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import { brandingService, type BrandingSettings } from '../../../lib/branding'
import { useStore } from '../../../store/useStore'
import { tenantService, type Tenant } from '../../../lib/tenant'

const DEFAULT_BRANDING: BrandingSettings = {
  logoUrl: '',
  primaryColor: '#6366f1',
  secondaryColor: '#1e40af',
  accentColor: '#8b5cf6',
  customDomain: '',
  senderEmail: '',
  senderName: '',
  tagline: '',
  description: '',
  contactPhone: '',
  contactAddress: '',
}



export default function BrandingPage() {
  const router = useRouter()
  const user = useStore((s) => s.user)
  const darkMode = useStore((s) => s.darkMode)
  const setUser = useStore((s) => s.setUser)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Tenant selector state (for SUPER_ADMIN)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantsLoading, setTenantsLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  // Branding state
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  // Role guard
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_OWNER') {
      router.push('/dashboard')
    }
  }, [user, router])

  // Load tenant list or auto-select for TENANT_OWNER
  useEffect(() => {
    if (!user) return
    if (user.role === 'SUPER_ADMIN') {
      const fetchTenants = async () => {
        setTenantsLoading(true)
        try {
          const data = await tenantService.getTenants(1, 100)
          const list: Tenant[] = Array.isArray(data) ? data : ((data as any)?.tenants ?? ((data as any)?.data ?? []))
          setTenants(list)
        } catch {
          showMessage('error', 'Failed to load tenants')
        } finally {
          setTenantsLoading(false)
        }
      }
      fetchTenants()
    } else if (user.role === 'TENANT_OWNER' && user.slug) {
      // Auto select the tenant owner's own data
      setSelectedTenant({ _id: user.tenant_id as string, name: user.tenant_name || 'Your Business', slug: user.slug } as Tenant)
      loadBranding(user.slug)
    }
  }, [user])

  const loadBranding = useCallback(async (slug: string) => {
    setLoading(true)
    setBranding(DEFAULT_BRANDING)
    try {
      const data = await brandingService.getBranding(slug)
      if (data.branding) setBranding({ ...DEFAULT_BRANDING, ...data.branding })
    } catch {
      showMessage('error', 'Failed to load branding for this tenant')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleTenantSelect = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    loadBranding(tenant.slug)
  }

  const handleBrandingSave = async () => {
    if (!selectedTenant) return
    setSaving(true)
    try {
      await brandingService.updateBranding(branding, selectedTenant.slug)
      showMessage('success', 'Branding updated successfully!')
      // Sync the updated branding into the store so sidebar updates live
      if (user && user.role === 'TENANT_OWNER') {
        setUser({ ...user, tenant_branding: { ...user.tenant_branding, ...branding } })
      }
    } catch {
      showMessage('error', 'Failed to update branding')
    } finally {
      setSaving(false)
    }
  }



  // Color field helper
  const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={value || '#6366f1'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 46, height: 38, border: '2px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: 2, background: 'transparent' }}
        />
        <input
          type="text"
          className="form-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6366f1"
          style={{ flex: 1 }}
        />
      </div>
    </div>
  )

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  return (
    <DashboardLayout title="Branding Management" subtitle="Customize branding & email templates for any tenant">
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="17" r="2"/><circle cx="6" cy="12" r="3"/><circle cx="12" cy="19" r="2"/>
              <path d="M10.59 13.41a2 2 0 0 0 2.83 0l4.24-4.24a2 2 0 0 0 0-2.83l-4.24 4.24a2 2 0 0 0 0 2.83z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}
          style={{ marginBottom: 20 }}
        >
          {message.text}
        </div>
      )}

      {/* Step 1: Tenant Selector */}
      {isSuperAdmin && (
        <div className="card" style={{ padding: 24, marginBottom: 24, background: darkMode ? '#1a1a1a' : 'var(--bg-card)', border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: selectedTenant ? 'linear-gradient(135deg, #10b981, #059669)' : (darkMode ? '#2a2a2a' : 'var(--bg-elevated)'),
            border: darkMode ? '2px solid #333' : '2px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: selectedTenant ? '#fff' : (darkMode ? '#888' : 'var(--text-muted)'),
          }}>1</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)', margin: 0 }}>
            Select Tenant
          </h3>
          {selectedTenant && (
            <span style={{
              marginLeft: 'auto', fontSize: 12, color: '#10b981', fontWeight: 600,
              background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 20,
            }}>
              ✓ {selectedTenant.name}
            </span>
          )}
        </div>

        {tenantsLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: darkMode ? '#888' : 'var(--text-muted)', fontSize: 14 }}>
            <div className="loading-spinner" style={{ width: 18, height: 18 }} />
            Loading tenants...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {tenants.map((t) => (
              <button
                key={t._id}
                onClick={() => handleTenantSelect(t)}
                style={{
                  padding: '12px 16px',
                  background: selectedTenant?._id === t._id
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))'
                    : (darkMode ? '#2a2a2a' : 'var(--bg-elevated)'),
                  border: selectedTenant?._id === t._id
                    ? '2px solid #6366f1'
                    : (darkMode ? '1px solid #333' : '2px solid var(--border)'),
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)', marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: darkMode ? '#888' : 'var(--text-muted)', fontFamily: 'monospace' }}>@{t.slug}</div>
                <div style={{
                  display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 600, padding: '2px 7px',
                  borderRadius: 20,
                  background: t.status === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: t.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                }}>
                  {t.status}
                </div>
              </button>
            ))}
            {tenants.length === 0 && (
              <p style={{ color: darkMode ? '#888' : 'var(--text-muted)', fontSize: 14 }}>No tenants found</p>
            )}
          </div>
        )}
      </div>
      )}

      {/* Step 2: Branding Editor (only when tenant selected) */}
      {selectedTenant && (
        <>

          {loading ? (
            <div className="card" style={{ padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: darkMode ? '#1a1a1a' : 'var(--bg-card)', border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
              <div className="loading-spinner" />
              <span style={{ color: darkMode ? '#888' : 'var(--text-muted)' }}>Loading {selectedTenant.name} branding...</span>
            </div>
          ) : (
            <>
              {/* Branding Tab */}
              <div className="card" style={{ padding: 28, background: darkMode ? '#1a1a1a' : 'var(--bg-card)', border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <div style={{ width: 4, height: 24, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)', borderRadius: 2 }} />
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: darkMode ? '#fff' : 'var(--text)', margin: 0 }}>
                      Visual Branding — <span style={{ color: '#6366f1' }}>{selectedTenant.name}</span>
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Logo</label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                  setBranding({ ...branding, logoUrl: reader.result as string })
                                }
                                reader.readAsDataURL(file)
                              }
                            }}
                            style={{ marginBottom: 8 }}
                          />
                          <input
                            type="url"
                            className="form-input"
                            placeholder="https://yourdomain.com/logo.png"
                            value={branding.logoUrl || ''}
                            onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                          />
                        </div>
                        {branding.logoUrl && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <img
                              src={branding.logoUrl}
                              alt="Logo preview"
                              style={{ height: 80, width: 80, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8, background: '#fff', padding: 8 }}
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            <button
                              onClick={() => setBranding({ ...branding, logoUrl: '' })}
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: 11 }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="form-hint">Upload an image or provide a URL for the tenant's company logo</p>
                    </div>

                    <ColorField
                      label="Primary Color"
                      value={branding.primaryColor || ''}
                      onChange={(v) => setBranding({ ...branding, primaryColor: v })}
                    />
                    <ColorField
                      label="Secondary Color"
                      value={branding.secondaryColor || ''}
                      onChange={(v) => setBranding({ ...branding, secondaryColor: v })}
                    />
                    <ColorField
                      label="Accent Color"
                      value={branding.accentColor || ''}
                      onChange={(v) => setBranding({ ...branding, accentColor: v })}
                    />


                  </div>

                  {/* Color Preview */}
                  {(branding.primaryColor || branding.accentColor) && (
                    <div style={{ marginTop: 20, padding: 16, background: darkMode ? '#2a2a2a' : 'var(--bg-elevated)', borderRadius: 10, border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: darkMode ? '#888' : 'var(--text-muted)', marginBottom: 10 }}>COLOR PREVIEW</p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {[
                          { label: 'Primary', color: branding.primaryColor },
                          { label: 'Secondary', color: branding.secondaryColor },
                          { label: 'Accent', color: branding.accentColor },
                        ].map(({ label, color }) => color ? (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: color, border: darkMode ? '1px solid #333' : '2px solid var(--border)' }} />
                            <span style={{ fontSize: 12, color: darkMode ? '#888' : 'var(--text-muted)' }}>{label}</span>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleBrandingSave}
                      disabled={saving}
                      className="btn btn-primary"
                      style={{ minWidth: 140 }}
                    >
                      {saving ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="loading-spinner" style={{ width: 14, height: 14 }} /> Saving...
                        </span>
                      ) : '💾 Save Branding'}
                    </button>
                    <button
                      onClick={() => setBranding(DEFAULT_BRANDING)}
                      className="btn btn-ghost"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>
            </>
          )}
        </>
      )}

      {/* Empty state if no tenant selected */}
      {!selectedTenant && !tenantsLoading && isSuperAdmin && (
        <div className="card" style={{ padding: 48, textAlign: 'center', background: darkMode ? '#1a1a1a' : 'var(--bg-card)', border: darkMode ? '1px solid #333' : '1px solid var(--border)' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="17" r="2"/><circle cx="6" cy="12" r="3"/><circle cx="12" cy="19" r="2"/>
            </svg>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: darkMode ? '#fff' : 'var(--text)', marginBottom: 8 }}>Select a Tenant</h3>
          <p style={{ color: darkMode ? '#888' : 'var(--text-muted)', fontSize: 14 }}>
            Choose a tenant above to manage their branding.
          </p>
        </div>
      )}
    </DashboardLayout>
  )
}
