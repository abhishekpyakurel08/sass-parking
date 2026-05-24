import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { useAuthStore } from './auth';
import { toast } from 'vue3-toastify';

export const useTenantStore = defineStore('tenant', () => {
  const authStore = useAuthStore();

  const activeTab = ref<'overview' | 'profile' | 'staff' | 'revenue' | 'tickets'>('overview');
  const isLoading = ref(false);

  const revenueAnalytics = ref<{ today: number; oneMonth: number; threeMonths: number; sixMonths: number } | null>(null);
  const ticketHistory = ref<any[]>([]);
  const staffList = ref<any[]>([]);

  const profile = reactive({
    companyName: '',
    ownerName: '',
    email: '',
    contactNumber: '',
    address: '',
    subscriptionStatus: '',
    subscriptionPlan: '',
  });

  const fetchProfile = async () => {
    isLoading.value = true;
    try {
      const res = await fetch('/api/v1/tenants/me', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) Object.assign(profile, data.data);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to load profile');
      }
    } catch {
      toast.error('Network error loading profile');
    } finally {
      isLoading.value = false;
    }
  };

  const updateProfile = async () => {
    isLoading.value = true;
    try {
      const res = await fetch('/api/v1/tenants/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
        body: JSON.stringify({
          companyName: profile.companyName,
          contactNumber: profile.contactNumber,
          address: profile.address,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Update failed');
      }
      toast.success('✅ Company profile updated!');
    } finally {
      isLoading.value = false;
    }
  };

  const fetchRevenueAnalytics = async () => {
    isLoading.value = true;
    try {
      const res = await fetch('/api/v1/analytics/tenant', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        revenueAnalytics.value = data.data;
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to load revenue analytics');
      }
    } catch {
      toast.error('Network error loading analytics');
    } finally {
      isLoading.value = false;
    }
  };

  const fetchTicketHistory = async () => {
    isLoading.value = true;
    try {
      const res = await fetch('/api/v1/parking/tickets?limit=20', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        ticketHistory.value = data.data;
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to load ticket history');
      }
    } catch {
      toast.error('Network error loading history');
    } finally {
      isLoading.value = false;
    }
  };

  const fetchStaff = async () => {
    isLoading.value = true;
    try {
      const res = await fetch('/api/v1/tenants/staff', {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        staffList.value = data.data;
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to load staff');
      }
    } catch {
      toast.error('Network error loading staff');
    } finally {
      isLoading.value = false;
    }
  };

  const createStaff = async (staffData: any) => {
    isLoading.value = true;
    try {
      const res = await fetch('/api/v1/tenants/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
        body: JSON.stringify(staffData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create operator');
      }
      toast.success('✅ Operator created successfully!');
      await fetchStaff(); // Refresh list
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  return { 
    activeTab, isLoading, profile, revenueAnalytics, ticketHistory, staffList,
    fetchProfile, updateProfile, fetchRevenueAnalytics, fetchTicketHistory, fetchStaff, createStaff
  };
});
