<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { toast } from 'vue3-toastify';
import { TrendingUp, TrendingDown, DollarSign, Car, Clock, Loader2, Calendar } from 'lucide-vue-next';
import { analyticsEndpoints } from '../../utils/endpoints';

interface AnalyticsData {
  total_revenue: number;
  total_tickets: number;
  active_vehicles: number;
  average_duration: number;
  revenue_by_date: { date: string; revenue: number }[];
  tickets_by_status: { status: string; count: number }[];
  peak_hours: { hour: number; count: number }[];
}

const filter = ref<'today' | 'weekly' | 'monthly'>('today');
const isLoading = ref(false);
const analytics = ref<AnalyticsData | null>(null);

const fetchAnalytics = async () => {
  isLoading.value = true;
  try {
    const data = await analyticsEndpoints.getTenant(filter.value);
    analytics.value = data.data;
  } catch (error: any) {
    toast.error(error.message || 'Failed to fetch analytics');
  } finally {
    isLoading.value = false;
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const revenueChange = computed(() => {
  if (!analytics.value || analytics.value.revenue_by_date.length < 2) return 0;
  const latest = analytics.value.revenue_by_date[analytics.value.revenue_by_date.length - 1]?.revenue ?? 0;
  const previous = analytics.value.revenue_by_date[analytics.value.revenue_by_date.length - 2]?.revenue ?? 0;
  if (previous === 0) return 0;
  return ((latest - previous) / previous) * 100;
});

onMounted(() => {
  fetchAnalytics();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h2>
        <p class="text-slate-500 dark:text-slate-400">Track your parking facility performance</p>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
        <button @click="filter = 'today'; fetchAnalytics()"
                :class="filter === 'today' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'"
                class="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
          Today
        </button>
        <button @click="filter = 'weekly'; fetchAnalytics()"
                :class="filter === 'weekly' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'"
                class="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
          Weekly
        </button>
        <button @click="filter = 'monthly'; fetchAnalytics()"
                :class="filter === 'monthly' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'"
                class="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
          Monthly
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <Loader2 class="w-6 h-6 text-emerald-600 animate-spin mr-2" />
      <span class="text-slate-500 dark:text-slate-400">Loading analytics...</span>
    </div>

    <!-- Analytics Content -->
    <div v-else-if="analytics" class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Revenue Card -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <DollarSign class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div :class="revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'" class="flex items-center gap-1 text-sm font-medium">
              <TrendingUp v-if="revenueChange >= 0" class="w-4 h-4" />
              <TrendingDown v-else class="w-4 h-4" />
              {{ Math.abs(revenueChange).toFixed(1) }}%
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ formatCurrency(analytics.total_revenue) }}
          </div>
          <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">Total Revenue</div>
        </div>

        <!-- Tickets Card -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Car class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ analytics.total_tickets }}
          </div>
          <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">Total Tickets</div>
        </div>

        <!-- Active Vehicles Card -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Car class="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ analytics.active_vehicles }}
          </div>
          <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">Active Vehicles</div>
        </div>

        <!-- Average Duration Card -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Clock class="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ formatDuration(analytics.average_duration) }}
          </div>
          <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">Avg Duration</div>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Revenue Over Time</h3>
        <div class="h-64 flex items-end gap-1 sm:gap-2 overflow-x-auto pb-2">
          <div v-for="(item, index) in analytics.revenue_by_date" :key="index"
               class="flex-1 min-w-[40px] sm:min-w-[60px] flex flex-col items-center gap-2">
            <div class="w-full bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                 :style="{ height: `${(item.revenue / Math.max(...analytics.revenue_by_date.map(r => r.revenue))) * 100}%` }">
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {{ new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Tickets by Status -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Tickets by Status</h3>
        <div class="space-y-4">
          <div v-for="item in analytics.tickets_by_status" :key="item.status"
               class="flex items-center gap-4">
            <div class="flex-1">
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ item.status }}</span>
                <span class="text-sm text-slate-500 dark:text-slate-400">{{ item.count }}</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div class="bg-emerald-500 h-2 rounded-full transition-all"
                     :style="{ width: `${(item.count / analytics.total_tickets) * 100}%` }">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Peak Hours -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Peak Hours</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div v-for="item in analytics.peak_hours" :key="item.hour"
               class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ item.hour }}:00</div>
            <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ item.count }} vehicles</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
