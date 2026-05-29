<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import {
  TrendingUp, Landmark, Users, RefreshCcw, ArrowUpRight,
  Building2, Ticket, Activity, Calendar, Download, Plus,
  CheckCircle2, AlertTriangle,
} from "lucide-vue-next";

const store = useSuperadminStore();

const isDark = ref(document.documentElement.classList.contains("dark"));
let observer: MutationObserver | null = null;
onMounted(() => {
  observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains("dark");
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
});
onUnmounted(() => observer?.disconnect());

const fmtCurrency = (n: number) =>
  n >= 1_000_000 ? `Rs. ${(n / 1_000_000).toFixed(1)}M`
  : n >= 1000    ? `Rs. ${(n / 1000).toFixed(1)}k`
  : `Rs. ${n.toFixed(0)}`;

const mrr            = computed(() => fmtCurrency(store.stats?.total_revenue ?? 0));
const activeTenants  = computed(() => store.stats?.active_tenants ?? "—");
const totalTenants   = computed(() => store.stats?.total_tenants ?? "—");
const activeTickets  = computed(() => store.stats?.active_tickets ?? "—");
const healthPct      = computed(() =>
  store.stats?.total_tenants ? Math.round(((store.stats.active_tenants ?? 0) / store.stats.total_tenants) * 100) : 0
);
const pendingTenants = computed(() => (store.stats?.total_tenants ?? 0) - (store.stats?.active_tenants ?? 0));

const kpis = computed(() => [
  {
    label: "Monthly Recurring Revenue",
    value: store.stats ? mrr.value : "—",
    sub: "+12.4% vs last month",
    subColor: "text-emerald-500",
    icon: Landmark,
    accent: "bg-blue-500",
    iconBg: "bg-blue-50 text-blue-600",
    iconBgDark: "bg-blue-950/40 text-blue-400",
  },
  {
    label: "Total Parking Tenants",
    value: store.stats ? String(totalTenants.value) : "—",
    sub: `${activeTenants.value} currently active`,
    subColor: "text-slate-500",
    icon: Building2,
    accent: "bg-violet-500",
    iconBg: "bg-violet-50 text-violet-600",
    iconBgDark: "bg-violet-950/40 text-violet-400",
  },
  {
    label: "Live Active Tickets",
    value: store.stats ? String(activeTickets.value) : "—",
    sub: "Vehicles currently parked",
    subColor: "text-slate-500",
    icon: Ticket,
    accent: "bg-orange-500",
    iconBg: "bg-orange-50 text-orange-600",
    iconBgDark: "bg-orange-950/40 text-orange-400",
  },
]);

// Static weekly sparkline
const weekBars = [
  { day: "M", h: 55 }, { day: "T", h: 42 }, { day: "W", h: 78, active: true },
  { day: "T", h: 63 }, { day: "F", h: 50 }, { day: "S", h: 70 }, { day: "S", h: 60 },
];
</script>

<template>
  <div class="space-y-6">
    <!-- Header Row -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">System Overview</h2>
        <p class="text-sm mt-1" :class="isDark ? 'text-zinc-400' : 'text-slate-500'">
          Real-time platform health and performance metrics.
          <span v-if="store.stats?.generated_at" class="ml-2 text-[11px] opacity-60">
            Last updated: {{ new Date(store.stats.generated_at).toLocaleTimeString() }}
          </span>
        </p>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button class="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-semibold transition-colors"
          :class="isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'">
          <Calendar class="w-4 h-4" /> Last 30 Days
        </button>
        <button @click="store.fetchPlatformStats()" class="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
          <RefreshCcw class="w-4 h-4" :class="store.isLoading ? 'animate-spin' : ''" />
          Refresh
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="(kpi, i) in kpis" :key="i"
        class="rounded-2xl p-5 border relative overflow-hidden transition-colors duration-300"
        :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">
        <!-- Accent bar -->
        <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" :class="kpi.accent"></div>
        <div class="flex justify-between items-start">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider mb-2" :class="isDark ? 'text-zinc-500' : 'text-slate-500'">{{ kpi.label }}</p>
            <div v-if="store.isLoading && !store.stats" class="h-8 w-24 rounded-md animate-pulse" :class="isDark ? 'bg-zinc-800' : 'bg-slate-100'"></div>
            <h3 v-else class="text-3xl font-black" :class="isDark ? 'text-white' : 'text-slate-900'">{{ kpi.value }}</h3>
            <p class="text-xs mt-1.5 font-medium" :class="kpi.subColor">{{ kpi.sub }}</p>
          </div>
          <div class="w-11 h-11 rounded-xl flex items-center justify-center" :class="isDark ? kpi.iconBgDark : kpi.iconBg">
            <component :is="kpi.icon" class="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Weekly Revenue Sparkline -->
      <div class="lg:col-span-2 rounded-2xl border p-5 transition-colors duration-300"
        :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="font-bold text-sm" :class="isDark ? 'text-white' : 'text-slate-900'">Weekly Revenue Trend</h3>
            <p class="text-xs mt-0.5" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">Daily consolidated revenue across all tenants</p>
          </div>
          <div class="flex items-center gap-1 text-xs font-bold text-emerald-500">
            <TrendingUp class="w-3.5 h-3.5" /> +12.4%
          </div>
        </div>
        <div class="h-40 flex items-end gap-2">
          <div v-for="(bar, i) in weekBars" :key="i" class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full rounded-t-lg transition-all relative"
              :class="bar.active ? 'bg-blue-600' : isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-slate-100 hover:bg-slate-200'"
              :style="{ height: `${bar.h}%` }">
              <div v-if="bar.active" class="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                Rs.28k
                <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-600"></div>
              </div>
            </div>
            <span class="text-[9px] font-bold" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">{{ bar.day }}</span>
          </div>
        </div>
      </div>

      <!-- Health Panel -->
      <div class="rounded-2xl p-5 text-white bg-[#0f172a] flex flex-col gap-4">
        <div>
          <h3 class="font-bold text-sm">Tenant Health</h3>
          <p class="text-slate-400 text-xs mt-0.5">Ecosystem status summary</p>
        </div>
        <div class="space-y-4 flex-1">
          <!-- Active -->
          <div>
            <div class="flex justify-between items-center mb-1.5">
              <span class="flex items-center gap-1.5 text-xs font-medium">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" /> Active
              </span>
              <span class="font-bold text-lg">{{ activeTenants }}</span>
            </div>
            <div class="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full transition-all duration-700" :style="{ width: `${healthPct}%` }"></div>
            </div>
          </div>
          <!-- Pending -->
          <div>
            <div class="flex justify-between items-center mb-1.5">
              <span class="flex items-center gap-1.5 text-xs font-medium">
                <AlertTriangle class="w-3.5 h-3.5 text-amber-400" /> Pending
              </span>
              <span class="font-bold text-lg">{{ pendingTenants }}</span>
            </div>
            <div class="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-amber-400 rounded-full transition-all duration-700" :style="{ width: `${100 - healthPct}%` }"></div>
            </div>
          </div>
          <!-- System Health -->
          <div class="mt-auto pt-3 border-t border-slate-700/50">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400 font-medium">System Status</span>
              <span class="flex items-center gap-1.5 font-bold text-emerald-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {{ store.stats?.system_health || 'OPERATIONAL' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Tenants Table -->
    <div class="rounded-2xl border overflow-hidden transition-colors duration-300"
      :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="px-5 py-4 border-b flex justify-between items-center"
        :class="isDark ? 'border-zinc-800' : 'border-slate-100'">
        <h3 class="font-bold text-sm" :class="isDark ? 'text-white' : 'text-slate-900'">Recent Tenant Onboarding</h3>
        <button @click="store.fetchTenants()" class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border rounded-lg transition-colors"
          :class="isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'">
          <RefreshCcw class="w-3 h-3" /> Refresh
        </button>
      </div>

      <div v-if="store.isLoading && store.tenants.length === 0" class="py-10 flex items-center justify-center gap-2"
        :class="isDark ? 'text-zinc-500' : 'text-slate-400'">
        <RefreshCcw class="w-4 h-4 animate-spin" /> Loading tenants…
      </div>
      <div v-else-if="store.tenants.length === 0" class="py-10 text-center text-sm" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">
        No tenants found.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b text-[11px] font-bold uppercase tracking-wider" :class="isDark ? 'bg-zinc-800/50 text-zinc-500 border-zinc-800' : 'bg-slate-50 text-slate-400 border-slate-100'">
            <tr>
              <th class="text-left px-5 py-3">Business</th>
              <th class="text-left px-5 py-3">Email</th>
              <th class="text-left px-5 py-3">Capacity</th>
              <th class="text-left px-5 py-3">Status</th>
              <th class="text-left px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y" :class="isDark ? 'divide-zinc-800' : 'divide-slate-50'">
            <tr v-for="t in store.tenants.slice(0, 8)" :key="t._id"
              class="group transition-colors" :class="isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-50/50'">
              <td class="px-5 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-blue-600" :class="isDark ? 'bg-blue-950/40' : 'bg-blue-50'">
                    {{ (t.name || t.companyName || '?').charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ t.name || t.companyName }}</p>
                    <p class="text-[10px]" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">ID: {{ t._id?.slice(-8) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3 text-sm" :class="isDark ? 'text-zinc-400' : 'text-slate-600'">{{ t.corporate_email || t.email || '—' }}</td>
              <td class="px-5 py-3 text-sm font-mono font-bold" :class="isDark ? 'text-zinc-300' : 'text-slate-700'">{{ t.total_capacity ?? '—' }}</td>
              <td class="px-5 py-3">
                <span class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider w-max"
                  :class="t.status === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="t.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-400'"></span>
                  {{ t.status || 'ACTIVE' }}
                </span>
              </td>
              <td class="px-5 py-3">
                <button
                  @click="store.updateTenantStatus(t._id, t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')"
                  class="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 border rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  :class="t.status === 'ACTIVE'
                    ? (isDark ? 'border-red-900 text-red-400 hover:bg-red-950/20' : 'border-red-200 text-red-500 hover:bg-red-50')
                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'">
                  {{ t.status === 'ACTIVE' ? 'Suspend' : 'Activate' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="store.tenants.length > 8" class="px-5 py-3 border-t text-center" :class="isDark ? 'border-zinc-800' : 'border-slate-100'">
        <button @click="store.activeTab = 'tenants'" class="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1 mx-auto">
          View all {{ store.tenants.length }} tenants <ArrowUpRight class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>
