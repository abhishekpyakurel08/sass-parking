import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { useAuthStore } from './auth';
import { toast } from 'vue3-toastify';

// Absolute backend URL — prefer explicit VITE_API_URL. In dev, if unset,
// use the Vite proxy by using an empty base so `/api/...` is a same-origin request.
const VITE_API_URL: string | undefined = (import.meta as any).env?.VITE_API_URL;
const MODE: string = (import.meta as any).env?.MODE ?? 'development';
const BASE_URL: string = VITE_API_URL ?? (MODE === 'development' ? '' : 'https://parking-backend.tecobit.cloud');

export const useTenantStore = defineStore('tenant', () => {
  const authStore = useAuthStore();

  const activeTab = ref<'overview' | 'tickets' | 'staff' | 'rates' | 'profile' | 'terminal'>('overview');
  const isLoading = ref(false);

  const revenueAnalytics = ref<{
    today: number; oneMonth: number; threeMonths: number;
    sixMonths: number; active_tickets: number;
  } | null>(null);

  const ticketHistory = ref<any[]>([]);
  const ticketPagination = ref({ page: 1, totalPages: 1, total: 0 });
  const ticketFilter = ref<'ALL' | 'ACTIVE' | 'PENDING_PAYMENT' | 'PAID' | 'EXPIRED'>('ALL');
  const analyticsFilter = ref<'today' | 'weekly' | 'monthly'>('today');

  const staffList = ref<any[]>([]);
  const rates = ref<any[]>([]);

  const profile = reactive({
    companyName: '',
    ownerName: '',
    email: '',
    contactNumber: '',
    address: '',
    subscriptionStatus: '',
    subscriptionPlan: '',
  });

  const authHeaders = () => ({
    Authorization: `Bearer ${authStore.token}`,
    'Content-Type': 'application/json',
    ...(authStore.user?.tenantId ? { 'X-Tenant-ID': authStore.user.tenantId } : {}),
  });

  // ── Profile ──────────────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    isLoading.value = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/tenants/me`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          profile.companyName = data.data.name || '';
          profile.email = data.data.corporate_email || '';
          profile.ownerName = data.data.ownerName || '';
          profile.contactNumber = data.data.contactNumber || '';
          profile.address = data.data.address || '';
          profile.subscriptionStatus = data.data.status || 'ACTIVE';
          profile.subscriptionPlan = data.data.subscriptionPlan || 'BASIC';
        }
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to load profile');
      }
    } catch { toast.error('Network error loading profile'); }
    finally { isLoading.value = false; }
  };

  const updateProfile = async () => {
    isLoading.value = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/tenants/me`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: profile.companyName, ownerName: profile.ownerName, contactNumber: profile.contactNumber, address: profile.address }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Update failed'); }
      toast.success('✅ Company profile updated!');
    } finally { isLoading.value = false; }
  };

  // ── Analytics ─────────────────────────────────────────────────────────────────
  const fetchRevenueAnalytics = async (filter?: string) => {
    isLoading.value = true;
    try {
      const activeFilter = filter || analyticsFilter.value;
      const res = await fetch(`${BASE_URL}/api/v1/analytics/tenant?filter=${activeFilter}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        revenueAnalytics.value = data.data;
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to load analytics');
      }
    } catch { toast.error('Network error loading analytics'); }
    finally { isLoading.value = false; }
  };

  // ── Tickets ───────────────────────────────────────────────────────────────────
  const fetchTicketHistory = async (page = 1, status?: string) => {
    isLoading.value = true;
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      const s = status ?? ticketFilter.value;
      if (s && s !== 'ALL') params.set('status', s);
      const res = await fetch(`${BASE_URL}/api/v1/parking/tickets?${params.toString()}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        ticketHistory.value = data.data;
        ticketPagination.value = data.pagination || { page: 1, totalPages: 1, total: data.data.length };
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to load tickets');
      }
    } catch { toast.error('Network error loading tickets'); }
    finally { isLoading.value = false; }
  };

  // ── Staff ─────────────────────────────────────────────────────────────────────
  const fetchStaff = async () => {
    isLoading.value = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/tenants/staff`, { headers: authHeaders() });
      if (res.ok) { const data = await res.json(); staffList.value = data.data; }
      else { const err = await res.json(); toast.error(err.message || 'Failed to load staff'); }
    } catch { toast.error('Network error loading staff'); }
    finally { isLoading.value = false; }
  };

  const createStaff = async (staffData: { name: string; email: string; password: string; gate_assignment?: string; ticket_prefix?: string }) => {
    isLoading.value = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/tenants/staff`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(staffData),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Failed to create staff'); }
      toast.success('🎉 Operator account created!');
      await fetchStaff();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create staff');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // ── Rates ─────────────────────────────────────────────────────────────────────
  const fetchRates = async () => {
    isLoading.value = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/rates`, { headers: authHeaders() });
      if (res.ok) { const data = await res.json(); rates.value = data.data; }
      else { const err = await res.json(); toast.error(err.message || 'Failed to load rates'); }
    } catch { toast.error('Network error loading rates'); }
    finally { isLoading.value = false; }
  };

  const upsertRate = async (vehicleType: string, payload: {
    rate_per_hour: number; grace_period_minutes?: number; lost_ticket_penalty?: number;
  }) => {
    isLoading.value = true;
    try {
      const vType = vehicleType.toUpperCase();
      // Try PATCH first (update), then POST (create)
      let res = await fetch(`${BASE_URL}/api/v1/rates/${vType}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.status === 404) {
        res = await fetch(`${BASE_URL}/api/v1/rates`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ vehicle_type: vType, ...payload }),
        });
      }
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Failed to save rate'); }
      toast.success(`✅ ${vehicleType} rate saved!`);
      await fetchRates();
      return true;
    } catch (err: any) { toast.error(err.message); return false; }
    finally { isLoading.value = false; }
  };

  // ── Terminal / Operations ───────────────────────────────────────────────────
  const checkInVehicle = async (payload: { license_plate?: string, vehicle_type: string, customer_code?: string }) => {
    isLoading.value = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/operator/check-in`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Check-in failed'); }
      const data = await res.json();
      toast.success(`✅ Vehicle checked in! Ticket: ${data.ticketNumber || data.ticket?.ticket_number}`);
      await fetchTicketHistory(1, 'ACTIVE');
      return data;
    } catch (err: any) { toast.error(err.message); return null; }
    finally { isLoading.value = false; }
  };

  const checkOutVehicle = async (ticketId: string) => {
    isLoading.value = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/parking/check-out`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ticket_id: ticketId })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Checkout calculation failed'); }
      const data = await res.json();
      toast.success(`✅ Checkout initiated! Fare: Rs. ${data.summary.total_amount}`);
      await fetchTicketHistory(1);
      return data.summary;
    } catch (err: any) { toast.error(err.message); return null; }
    finally { isLoading.value = false; }
  };

  const lostTicketVehicle = async (payload: { vehicle_type: string; license_plate: string; assumed_duration_hours: number }) => {
    isLoading.value = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/parking/lost-ticket`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Lost ticket failed'); }
      const data = await res.json();
      toast.success(`⚠️ Lost ticket processed. Total: Rs. ${data.summary.total_amount}`);
      await fetchTicketHistory(1);
      // Return a checkout-summary-shaped object so TerminalTab can proceed to payment
      return {
        ticket_id: data.summary.ticket_id,
        ticket_number: data.summary.ticket_number,
        license_plate: data.summary.license_plate,
        vehicle_type: data.summary.vehicle_type,
        check_in_time: new Date(Date.now() - payload.assumed_duration_hours * 3600000).toISOString(),
        check_out_time: new Date().toISOString(),
        duration_minutes: payload.assumed_duration_hours * 60,
        duration_display: `${payload.assumed_duration_hours}h 0m`,
        breakdown: [{ label: 'Lost Ticket Penalty', amount: data.summary.lost_ticket_penalty }],
        subtotal: data.summary.base_amount,
        discount: 0,
        total_amount: data.summary.total_amount,
        audit_alert: payload.assumed_duration_hours > 48,
        status: 'PENDING_PAYMENT',
      };
    } catch (err: any) { toast.error(err.message); return null; }
    finally { isLoading.value = false; }
  };

  const processPayment = async (payload: { ticket_id: string, payment_method: string, amount_received?: number }) => {
    isLoading.value = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/parking/process-payment`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Payment failed'); }
      const data = await res.json();
      toast.success('✅ Payment successful!');
      await fetchTicketHistory(1);
      return data;
    } catch (err: any) { toast.error(err.message); return null; }
    finally { isLoading.value = false; }
  };

  const exportReport = async (filter?: string) => {
    isLoading.value = true;
    try {
      const activeFilter = filter || analyticsFilter.value;
      const res = await fetch(`${BASE_URL}/api/v1/parking/export?filter=${activeFilter}`, {
        method: 'GET',
        headers: authHeaders()
      });
      if (!res.ok) { throw new Error('Failed to export CSV report'); }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parking_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('✅ CSV Report downloaded successfully!');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to download report');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const updateStaff = async (id: string, payload: { name?: string; email?: string; password?: string; gate_assignment?: string; ticket_prefix?: string }) => {
    isLoading.value = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/tenants/staff/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Failed to update staff'); }
      toast.success('✅ Staff member updated!');
      await fetchStaff();
      return true;
    } catch (err: any) { toast.error(err.message); return false; }
    finally { isLoading.value = false; }
  };

  const deleteStaff = async (id: string) => {
    isLoading.value = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/tenants/staff/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Failed to delete staff'); }
      toast.success('🗑️ Staff member removed.');
      await fetchStaff();
      return true;
    } catch (err: any) { toast.error(err.message); return false; }
    finally { isLoading.value = false; }
  };

  return {
    activeTab, isLoading,
    profile, fetchProfile, updateProfile,
    revenueAnalytics, analyticsFilter, fetchRevenueAnalytics,
    ticketHistory, ticketPagination, ticketFilter, fetchTicketHistory,
    staffList, fetchStaff, createStaff, updateStaff, deleteStaff,
    rates, fetchRates, upsertRate,
    checkInVehicle, checkOutVehicle, lostTicketVehicle, processPayment, exportReport
  };
});
