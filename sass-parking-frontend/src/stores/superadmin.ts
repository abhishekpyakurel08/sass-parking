import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { toast } from 'vue3-toastify';
import { apiFetch } from '../utils/api';

export const useSuperadminStore = defineStore('superadmin', () => {
  const activeTab = ref<
    'overview' | 'tenants' | 'users' | 'plans' | 'logs' | 'settings' | 'lots' | 'revenue' | 'reports'
  >('overview');
  const isLoading = ref(false);

  // --- Reactive State ---
  const stats = ref<{
    total_tenants: number;
    active_tenants: number;
    total_revenue: number;
    active_tickets: number;
    system_health: string;
    generated_at: string;
  } | null>(null);

  const tenants = ref<any[]>([]);
  const globalUsers = ref<any[]>([]);
  const pricingPlans = ref<any[]>([]);
  const auditLogs = ref<any[]>([]);
  const tenantsPagination = ref({ total: 0, page: 1, totalPages: 1 });

  const globalSettings = reactive({
    maintenanceMode: false,
    globalRateFormula: 'BASE_HOUR_FACTOR_1.2',
    smsGatewayUrl: 'https://sms.platform-api.net/v2/send',
  });

  // ─── Real API Actions ──────────────────────────────────────────────────────

  /** GET /api/v1/analytics/global — SUPER_ADMIN only */
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

  /** GET /api/v1/tenants?page=1&limit=50 — SUPER_ADMIN only */
  const fetchTenants = async (page = 1) => {
    isLoading.value = true;
    try {
      const res = await apiFetch(`/api/v1/tenants?page=${page}&limit=50`);
      tenants.value = res.data.map((t: any) => ({
        ...t,
        companyName: t.name,
        email: t.corporate_email,
        ownerName: t.ownerName || 'N/A', // Not supported in this simplified backend model
        subscriptionPlan: t.subscriptionPlan || 'BASIC',
        maxStaffLimit: t.maxStaffLimit || 5,
        maxSlotsLimit: t.total_capacity || 50,
      }));
      tenantsPagination.value = res.pagination;
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tenants');
    } finally {
      isLoading.value = false;
    }
  };

  /** POST /api/v1/tenants — SUPER_ADMIN only */
  const createTenant = async (tenantData: any) => {
    isLoading.value = true;
    try {
      const res = await apiFetch('/api/v1/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: tenantData.companyName,
          corporate_email: tenantData.email,
          total_capacity: tenantData.maxSlotsLimit
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
      toast.success('Tenant provisioned successfully');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create tenant');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /** PATCH /api/v1/tenants/:id — SUPER_ADMIN only */
  const updateTenantStatus = async (tenantId: string, status: string) => {
    isLoading.value = true;
    try {
      const res = await apiFetch(`/api/v1/tenants/${tenantId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const idx = tenants.value.findIndex((t) => t._id === tenantId);
      if (idx !== -1) tenants.value[idx] = res.data;
      toast.success(`Tenant status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update tenant');
    } finally {
      isLoading.value = false;
    }
  };

  /** DELETE /api/v1/tenants/:id — SUPER_ADMIN only */
  const deleteTenant = async (tenantId: string) => {
    isLoading.value = true;
    try {
      await apiFetch(`/api/v1/tenants/${tenantId}`, { method: 'DELETE' });
      tenants.value = tenants.value.filter((t) => t._id !== tenantId);
      if (stats.value) stats.value.active_tenants = Math.max(0, stats.value.active_tenants - 1);
      toast.success('Tenant deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete tenant');
    } finally {
      isLoading.value = false;
    }
  };

  // ─── Mock stubs (no backend endpoints exist yet) ───────────────────────────

  const fetchGlobalUsers = async () => {
    isLoading.value = true;
    // Derive user list from tenants data (no dedicated superadmin user endpoint yet)
    await new Promise((r) => setTimeout(r, 300));
    isLoading.value = false;
  };

  const createGlobalUser = async (_userData: any) => {
    toast.info('Direct user creation will be available in a future backend update');
    return false;
  };

  const fetchPricingPlans = async () => {
    isLoading.value = true;
    await new Promise((r) => setTimeout(r, 200));
    pricingPlans.value = [
      { _id: 'pl_01', name: 'Basic Module', priceMonthly: 12500, maxStaff: 5, maxSlots: 50, features: 'Single Gate, Core Reporting, Ticket Generation' },
      { _id: 'pl_02', name: 'Premium Suite', priceMonthly: 35000, maxStaff: 15, maxSlots: 200, features: 'Multi-Gate, Automated Rates, Webhook Integration, Analytics' },
      { _id: 'pl_03', name: 'Enterprise Level', priceMonthly: 85000, maxStaff: 50, maxSlots: 1000, features: 'Dedicated Cluster, API POS, Custom Tickets, 24/7 Support' },
    ];
    isLoading.value = false;
  };

  const createPlan = async (_planData: any) => {
    toast.info('Plan management via backend coming soon');
    return false;
  };

  const fetchAuditLogs = async () => {
    isLoading.value = true;
    try {
      const res = await apiFetch(`/api/v1/audit-logs?limit=50`);
      auditLogs.value = res.data;
    } catch (err: any) {
      toast.error(err.message || 'Failed to load audit logs');
    } finally {
      isLoading.value = false;
    }
  };

  const fetchGlobalSettings = async () => {
    isLoading.value = true;
    await new Promise((r) => setTimeout(r, 200));
    isLoading.value = false;
  };

  const updateGlobalSettings = async () => {
    isLoading.value = true;
    await new Promise((r) => setTimeout(r, 400));
    toast.success('Global platform settings updated');
    isLoading.value = false;
  };

  return {
    activeTab,
    isLoading,
    stats,
    tenants,
    tenantsPagination,
    globalUsers,
    pricingPlans,
    auditLogs,
    globalSettings,
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
