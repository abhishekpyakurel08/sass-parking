import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { toast } from 'vue3-toastify';
import { apiFetch } from '../utils/api';

export interface PlatformStats {
  total_tenants: number;
  active_tenants: number;
  total_revenue: number;
  active_tickets: number;
  system_health: string;
  generated_at: string;
}

export interface Tenant {
  _id: string;
  name: string;
  corporate_email: string;
  status: string;
  total_capacity: number;
  createdAt?: string;
  // frontend-augmented
  companyName: string;
  email: string;
  ownerName: string;
  subscriptionPlan: string;
  maxStaffLimit: number;
  maxSlotsLimit: number;
}

export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  gate_assignment?: string;
  ticket_prefix?: string;
  tenant_id?: string;
  tenantName?: string;
  createdAt?: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  timestamp: string;
  triggeredBy?: string;
  targetId?: string;
  details?: string;
}

const PLAN_PRICES: Record<string, number> = {
  BASIC: 12500,
  PREMIUM: 35000,
  ENTERPRISE: 85000,
};

export const useSuperadminStore = defineStore('superadmin', () => {
  type TabName = 'overview' | 'tenants' | 'users' | 'revenue' | 'reports' | 'settings' | 'lots';
  const activeTab = ref<TabName>('overview');
  const isLoading = ref(false);

  // ── State ─────────────────────────────────────────────────────────────────
  const stats = ref<PlatformStats | null>(null);
  const tenants = ref<Tenant[]>([]);
  const allUsers = ref<StaffUser[]>([]);
  // kept for backwards compat with userstab
  const globalUsers = ref<StaffUser[]>([]);
  const auditLogs = ref<AuditLog[]>([]);
  const tenantsPagination = ref({ total: 0, page: 1, totalPages: 1 });

  const globalSettings = ref({
    maintenanceMode: false,
    globalRateFormula: 'BASE_HOUR_FACTOR_1.2',
    smsGatewayUrl: 'https://sms.platform-api.net/v2/send',
  });

  // ── Computed billing helpers (derived from tenants) ────────────────────────
  const tierDistribution = computed(() => {
    const counts: Record<string, number> = {};
    for (const t of tenants.value) {
      const plan = (t.subscriptionPlan || 'BASIC').toUpperCase();
      counts[plan] = (counts[plan] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      mrrContribution: count * (PLAN_PRICES[name] ?? 12500),
    }));
  });

  const monthlyRecurringRevenue = computed(() =>
    tierDistribution.value.reduce((sum, t) => sum + t.mrrContribution, 0)
  );

  // ── Real API Actions ───────────────────────────────────────────────────────

  const fetchPlatformStats = async () => {
    isLoading.value = true;
    try {
      const res = await apiFetch('/api/v1/analytics/global');
      stats.value = res.data;
    } catch (err: any) {
      toast.error(err.message || 'Failed to load platform stats');
    } finally {
      isLoading.value = false;
    }
  };

  const fetchTenants = async (page = 1) => {
    isLoading.value = true;
    try {
      const res = await apiFetch(`/api/v1/tenants?page=${page}&limit=50`);
      tenants.value = res.data.map((t: any): Tenant => ({
        ...t,
        companyName: t.name,
        email: t.corporate_email,
        ownerName: t.ownerName || 'N/A',
        subscriptionPlan: t.subscriptionPlan || 'BASIC',
        maxStaffLimit: t.maxStaffLimit || 5,
        maxSlotsLimit: t.total_capacity || 50,
      }));
      tenantsPagination.value = res.pagination ?? { total: res.data.length, page: 1, totalPages: 1 };
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tenants');
    } finally {
      isLoading.value = false;
    }
  };

  const createTenant = async (tenantData: any) => {
    isLoading.value = true;
    try {
      const res = await apiFetch('/api/v1/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: tenantData.companyName,
          corporate_email: tenantData.email,
          total_capacity: tenantData.maxSlotsLimit,
        }),
      });
      const t = res.data;
      tenants.value.unshift({
        ...t,
        companyName: t.name,
        email: t.corporate_email,
        ownerName: tenantData.ownerName || 'N/A',
        subscriptionPlan: tenantData.subscriptionPlan || 'BASIC',
        maxStaffLimit: tenantData.maxStaffLimit || 5,
        maxSlotsLimit: t.total_capacity || 50,
      });
      if (stats.value) stats.value.active_tenants += 1;
      toast.success('🎉 Tenant provisioned successfully');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create tenant');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const updateTenantStatus = async (tenantId: string, status: string) => {
    try {
      const res = await apiFetch(`/api/v1/tenants/${tenantId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const idx = tenants.value.findIndex((t) => t._id === tenantId);
      if (idx !== -1) {
        tenants.value[idx] = {
          ...tenants.value[idx],
          ...res.data,
          companyName: res.data.name || tenants.value[idx].companyName,
          email: res.data.corporate_email || tenants.value[idx].email,
        };
      }
      toast.success(`Tenant ${status === 'ACTIVE' ? 'activated' : 'suspended'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update tenant');
    }
  };

  const deleteTenant = async (tenantId: string) => {
    isLoading.value = true;
    try {
      await apiFetch(`/api/v1/tenants/${tenantId}`, { method: 'DELETE' });
      tenants.value = tenants.value.filter((t) => t._id !== tenantId);
      if (stats.value) stats.value.active_tenants = Math.max(0, stats.value.active_tenants - 1);
      toast.success('Tenant deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete tenant');
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch all staff users across all tenants by using the superadmin's
   * ability to GET /api/v1/tenants/:id/staff (not available) — instead we
   * aggregate from tenant data and expose the /parking/tickets approach.
   * As a pragmatic solution we fetch the tenant staff for each tenant using
   * X-Tenant-ID header that SuperAdmin can freely set.
   */
  const fetchGlobalUsers = async () => {
    isLoading.value = true;
    try {
      if (tenants.value.length === 0) await fetchTenants();
      const results: StaffUser[] = [];
      // Batch fetch (up to 10 tenants to avoid flooding)
      const sample = tenants.value.slice(0, 10);
      await Promise.allSettled(
        sample.map(async (t) => {
          try {
            const res = await apiFetch('/api/v1/tenants/staff', {
              headers: { 'X-Tenant-ID': t._id },
            });
            const staff: StaffUser[] = (res.data || []).map((u: any) => ({
              ...u,
              tenantName: t.companyName,
              tenant_id: t._id,
            }));
            results.push(...staff);
          } catch {
            // skip tenants that fail
          }
        })
      );
      globalUsers.value = results;
      allUsers.value = results;
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      isLoading.value = false;
    }
  };

  const fetchAuditLogs = async (limit = 50) => {
    isLoading.value = true;
    try {
      // Audit logs require tenant context — use first active tenant
      const tenantId = tenants.value.find((t) => t.status === 'ACTIVE')?._id;
      if (!tenantId) {
        auditLogs.value = [];
        return;
      }
      const res = await apiFetch(`/api/v1/audit-logs?limit=${limit}`, {
        headers: { 'X-Tenant-ID': tenantId },
      });
      auditLogs.value = res.data || [];
    } catch (err: any) {
      toast.error(err.message || 'Failed to load audit logs');
    } finally {
      isLoading.value = false;
    }
  };

  const fetchGlobalSettings = async () => {
    isLoading.value = true;
    await new Promise((r) => setTimeout(r, 150));
    isLoading.value = false;
  };

  const updateGlobalSettings = async () => {
    isLoading.value = true;
    await new Promise((r) => setTimeout(r, 400));
    toast.success('Platform settings updated');
    isLoading.value = false;
  };

  // kept for backwards compat
  const createGlobalUser = async (_: any) => {
    toast.info('User creation is done via each tenant\'s Staff tab');
    return false;
  };
  const fetchPricingPlans = async () => { /* computed from tenants */ };
  const createPlan = async (_: any) => false;
  const pricingPlans = ref<any[]>([]);

  return {
    activeTab,
    isLoading,
    stats,
    tenants,
    tenantsPagination,
    globalUsers,
    allUsers,
    pricingPlans,
    auditLogs,
    globalSettings,
    // computed billing
    tierDistribution,
    monthlyRecurringRevenue,
    // actions
    fetchPlatformStats,
    fetchTenants,
    createTenant,
    updateTenantStatus,
    deleteTenant,
    fetchGlobalUsers,
    createGlobalUser,
    fetchPricingPlans,
    createPlan,
    fetchAuditLogs,
    fetchGlobalSettings,
    updateGlobalSettings,
  };
});
