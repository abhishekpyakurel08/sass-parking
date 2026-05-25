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
      toast.success('✅ Vehicle checked in successfully!');
      return json;
    } finally {
      isLoading.value = false;
    }
  };

  const checkOut = async (data: { vehiclePlateNumber: string }) => {
    isLoading.value = true;
    try {
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
