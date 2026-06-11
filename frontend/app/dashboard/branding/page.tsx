'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import { brandingService, type BrandingSettings, type EmailTemplate } from '../../../lib/branding'
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
}

const DEFAULT_TEMPLATES = {
  welcome: { subject: '', title: '', message: '', buttonText: '' },
  verification: { subject: '', title: '', message: '', buttonText: '' },
  passwordReset: { subject: '', title: '', message: '', buttonText: '' },
}

export default function BrandingPage() {
  const router = useRouter()
  const user = useStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<'branding' | 'templates'>('branding')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Tenant selector state (for SUPER_ADMIN)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantsLoading, setTenantsLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  // Branding state
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING)
  const [emailTemplates, setEmailTemplates] = useState(DEFAULT_TEMPLATES)
  const [previewTemplate, setPreviewTemplate] = useState<{ subject: string; html: string } | null>(null)
  const [previewType, setPreviewType] = useState('welcome')

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  // Role guard
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
    }
  }, [user, router])

  // Load tenant list
  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') return
    const fetchTenants = async () => {
      setTenantsLoading(true)
      try {
        const data = await tenantService.getTenants(1, 100)
        const list: Tenant[] = Array.isArray(data) ? data : ((data as any)?.tenants ?? [])
        setTenants(list)
      } catch {
        showMessage('error', 'Failed to load tenants')
      } finally {
        setTenantsLoading(false)
      }
    }
    fetchTenants()
  }, [user])

  const loadBranding = useCallback(async (slug: string) => {
    setLoading(true)
    setBranding(DEFAULT_BRANDING)
    setEmailTemplates(DEFAULT_TEMPLATES)
    try {
      const data = await brandingService.getBranding(slug)
      if (data.branding) setBranding({ ...DEFAULT_BRANDING, ...data.branding })
      if (data.emailTemplates) setEmailTemplates({ ...DEFAULT_TEMPLATES, ...(data.emailTemplates as any) })
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
    } catch {
      showMessage('error', 'Failed to update branding')
    } finally {
      setSaving(false)
    }
  }

  const handleTemplateSave = async (type: string, template: EmailTemplate) => {
    if (!selectedTenant) return
    setSaving(true)
    try {
      await brandingService.updateEmailTemplate(type, template, selectedTenant.slug)
      showMessage('success', `${type} template updated successfully!`)
    } catch {
      showMessage('error', 'Failed to update template')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async (type: string) => {
    if (!selectedTenant) return
    setSaving(true)
    try {
      const preview = await brandingService.previewEmailTemplate(
        type,
        { userName: 'John Doe', url: 'https://yourdomain.com/dashboard' },
        selectedTenant.slug
      )
      setPreviewTemplate(preview)
      setPreviewType(type)
    } catch {
      showMessage('error', 'Failed to preview template')
    } finally {
      setSaving(false)
    }
  }

  const handleResetTemplate = async (type: string) => {
    if (!selectedTenant) return
    if (!confirm('Reset this template to default?')) return
    setSaving(true)
    try {
      await brandingService.resetEmailTemplate(type, selectedTenant.slug)
      await loadBranding(selectedTenant.slug)
      showMessage('success', `${type} template reset to default`)
    } catch {
      showMessage('error', 'Failed to reset template')
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
    <DashboardLayout>
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
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Branding Management</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
              Customize branding &amp; email templates for any tenant
            </p>
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
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: selectedTenant ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-elevated)',
            border: '2px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: selectedTenant ? '#fff' : 'var(--text-muted)',
          }}>1</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 14 }}>
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
                    : 'var(--bg-elevated)',
                  border: selectedTenant?._id === t._id
                    ? '2px solid #6366f1'
                    : '2px solid var(--border)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>@{t.slug}</div>
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
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No tenants found</p>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Branding Editor (only when tenant selected) */}
      {selectedTenant && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
            {(['branding', 'templates'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px',
                  background: activeTab === tab ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 7,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'all 0.15s ease',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'branding' ? '🎨 Branding' : '📧 Email Templates'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="card" style={{ padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div className="loading-spinner" />
              <span style={{ color: 'var(--text-muted)' }}>Loading {selectedTenant.name} branding...</span>
            </div>
          ) : (
            <>
              {/* Branding Tab */}
              {activeTab === 'branding' && (
                <div className="card" style={{ padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <div style={{ width: 4, height: 24, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)', borderRadius: 2 }} />
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                      Visual Branding — <span style={{ color: '#6366f1' }}>{selectedTenant.name}</span>
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Logo URL</label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://yourdomain.com/logo.png"
                          value={branding.logoUrl || ''}
                          onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                          style={{ flex: 1 }}
                        />
                        {branding.logoUrl && (
                          <img
                            src={branding.logoUrl}
                            alt="Logo preview"
                            style={{ height: 38, width: 38, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8, background: '#fff', padding: 4 }}
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        )}
                      </div>
                      <p className="form-hint">URL of the tenant's company logo</p>
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

                    <div>
                      <label className="form-label">Custom Domain</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="yourdomain.com"
                        value={branding.customDomain || ''}
                        onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })}
                      />
                      <p className="form-hint">Custom domain for this tenant's subdomain routing</p>
                    </div>

                    <div>
                      <label className="form-label">Sender Email</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="noreply@tenant.com"
                        value={branding.senderEmail || ''}
                        onChange={(e) => setBranding({ ...branding, senderEmail: e.target.value })}
                      />
                      <p className="form-hint">Email address used for outgoing notifications</p>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Sender Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Company Team"
                        value={branding.senderName || ''}
                        onChange={(e) => setBranding({ ...branding, senderName: e.target.value })}
                      />
                      <p className="form-hint">Display name shown in outgoing email headers</p>
                    </div>
                  </div>

                  {/* Color Preview */}
                  {(branding.primaryColor || branding.accentColor) && (
                    <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>COLOR PREVIEW</p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {[
                          { label: 'Primary', color: branding.primaryColor },
                          { label: 'Secondary', color: branding.secondaryColor },
                          { label: 'Accent', color: branding.accentColor },
                        ].map(({ label, color }) => color ? (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: color, border: '2px solid var(--border)' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
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
              )}

              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Object.entries(emailTemplates).map(([type, template]) => (
                    <div key={type} className="card" style={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: type === 'welcome' ? 'rgba(99,102,241,0.15)' : type === 'verification' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                            color: type === 'welcome' ? '#6366f1' : type === 'verification' ? '#10b981' : '#f59e0b',
                          }}>
                            {type === 'welcome' ? '👋' : type === 'verification' ? '✉️' : '🔐'} {type.charAt(0).toUpperCase() + type.slice(1)}
                          </div>
                          <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                            Email Template
                          </h4>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handlePreview(type)} disabled={saving} className="btn btn-ghost btn-sm">
                            👁 Preview
                          </button>
                          <button onClick={() => handleResetTemplate(type)} disabled={saving} className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }}>
                            ↺ Reset
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                          <label className="form-label">Email Subject</label>
                          <input
                            type="text"
                            className="form-input"
                            value={template.subject || ''}
                            onChange={(e) => setEmailTemplates({ ...emailTemplates, [type]: { ...template, subject: e.target.value } })}
                            placeholder="e.g. Welcome to {{company}}!"
                          />
                        </div>
                        <div>
                          <label className="form-label">Button Text</label>
                          <input
                            type="text"
                            className="form-input"
                            value={template.buttonText || ''}
                            onChange={(e) => setEmailTemplates({ ...emailTemplates, [type]: { ...template, buttonText: e.target.value } })}
                            placeholder="e.g. Get Started"
                          />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Heading Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={template.title || ''}
                            onChange={(e) => setEmailTemplates({ ...emailTemplates, [type]: { ...template, title: e.target.value } })}
                            placeholder="e.g. Welcome aboard, {{name}}!"
                          />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Body Message</label>
                          <textarea
                            className="form-input"
                            rows={3}
                            value={template.message || ''}
                            onChange={(e) => setEmailTemplates({ ...emailTemplates, [type]: { ...template, message: e.target.value } })}
                            placeholder="Email body text. Use {{name}}, {{company}}, {{url}} as variables."
                            style={{ resize: 'vertical' }}
                          />
                          <p className="form-hint">Supports variables: {'{{name}}'}, {'{{company}}'}, {'{{url}}'}</p>
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <button
                          onClick={() => handleTemplateSave(type, template)}
                          disabled={saving}
                          className="btn btn-primary btn-sm"
                        >
                          {saving ? 'Saving...' : `Save ${type.charAt(0).toUpperCase() + type.slice(1)} Template`}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Empty state if no tenant selected */}
      {!selectedTenant && !tenantsLoading && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
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
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Select a Tenant</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Choose a tenant above to manage their branding and email templates.
          </p>
        </div>
      )}

      {/* Email Preview Modal */}
      {previewTemplate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 820, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                  Email Preview — <span style={{ color: '#6366f1', textTransform: 'capitalize' }}>{previewType}</span>
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  Subject: {previewTemplate.subject}
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}
              >×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f5f5f5' }}>
              <div
                style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                dangerouslySetInnerHTML={{ __html: previewTemplate.html }}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
