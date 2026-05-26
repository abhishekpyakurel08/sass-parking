import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';
import { toast } from 'vue3-toastify';

export const useOperatorStore = defineStore('operator', () => {
  const authStore = useAuthStore();
  const isLoading = ref(false);
  const stats = ref<{ totalVehicles: number; totalRevenue: number; completedSessions: number } | null>(null);

  const checkIn = async (data: { vehiclePlateNumber: string; vehicleType: string; floor?: string }) => {
    isLoading.value = true;
    try {
      const res = await fetch('/api/v1/operator/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
          ...(authStore.user?.tenantId ? { 'X-Tenant-ID': authStore.user.tenantId } : {}),
        },
        body: JSON.stringify({
          license_plate: data.vehiclePlateNumber,
          vehicle_type: data.vehicleType,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.errors?.[0]?.message || json.message || 'Check-in failed';
        toast.error(msg);
        throw new Error(msg);
      }
      toast.success('Vehicle checked in successfully!');
      return json;
    } finally {
      isLoading.value = false;
    }
  };

  const checkOut = async (data: { vehiclePlateNumber: string }) => {
    isLoading.value = true;
    try {
      // 1. Calculate fare and set status to PENDING_PAYMENT
      const res = await fetch('/api/v1/operator/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
          ...(authStore.user?.tenantId ? { 'X-Tenant-ID': authStore.user.tenantId } : {}),
        },
        body: JSON.stringify({
          ticket_id: data.vehiclePlateNumber,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.errors?.[0]?.message || json.message || 'Check-out failed';
        toast.error(msg);
        throw new Error(msg);
      }

      const ticketId = json.summary.ticket_id;
      const totalAmount = json.summary.total_amount;

      // 2. Automatically settle as CASH so slots are cleared and revenue is accounted
      const payRes = await fetch('/api/v1/operator/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
          ...(authStore.user?.tenantId ? { 'X-Tenant-ID': authStore.user.tenantId } : {}),
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          payment_method: 'CASH',
          amount_received: totalAmount,
        }),
      });
      const payJson = await payRes.json();
      if (!payRes.ok) {
        const msg = payJson.errors?.[0]?.message || payJson.message || 'Payment settlement failed';
        toast.error(msg);
        throw new Error(msg);
      }

      // Add duration_hours computed field for the Vue view's expectations
      if (json.summary && typeof json.summary.duration_minutes === 'number') {
        json.summary.duration_hours = json.summary.duration_minutes / 60;
      }

      toast.success('💰 Payment settled. Gate open!');
      return json;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchStats = async () => {
    isLoading.value = true;
    try {
      const res = await fetch('/api/v1/operator/stats', {
        headers: { 
          Authorization: `Bearer ${authStore.token}`,
          ...(authStore.user?.tenantId ? { 'X-Tenant-ID': authStore.user.tenantId } : {}),
        },
      });
      const json = await res.json();
      if (res.ok) {
        stats.value = json.data;
      } else {
        toast.error(json.message || 'Failed to load stats');
      }
    } catch {
      toast.error('Network error loading stats');
    } finally {
      isLoading.value = false;
    }
  };

  return { isLoading, stats, checkIn, checkOut, fetchStats };
});
