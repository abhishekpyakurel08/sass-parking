<script setup lang="ts">
import { computed } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import {
  Calendar,
  Download,
  TrendingUp,
  Landmark,
  Users,
  ArrowRight,
  Filter,
  Plus,
  RefreshCcw,
} from "lucide-vue-next";

const store = useSuperadminStore();

const weeklyBars = [
  { day: "MON", value: 50 },
  { day: "TUE", value: 45 },
  { day: "WED", value: 85, active: true, label: "Rs.28k" },
  { day: "THU", value: 60 },
  { day: "FRI", value: 55 },
  { day: "SAT", value: 72 },
  { day: "SUN", value: 65 },
];

const mrr = computed(() =>
  store.stats?.total_revenue != null
    ? `Rs. ${Number(store.stats.total_revenue).toLocaleString("en-US", { minimumFractionDigits: 0 })}`
    : "—"
);
const activeTenants = computed(() => store.stats?.active_tenants ?? "—");
const totalTenants = computed(() => store.stats?.total_tenants ?? "—");
const activeTickets = computed(() => store.stats?.active_tickets ?? "—");

const pendingTenants = computed(() =>
  (store.stats?.total_tenants ?? 0) - (store.stats?.active_tenants ?? 0)
);

const healthPct = computed(() =>
  store.stats?.total_tenants
    ? Math.round(((store.stats.active_tenants ?? 0) / store.stats.total_tenants) * 100)
    : 0
);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h2>
        <p class="text-slate-500 mt-1">Monitoring global performance and multi-tenant health.</p>
      </div>
      <div class="flex gap-3">
        <button class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Calendar class="w-4 h-4" /> Last 30 Days
        </button>
        <button
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700"
          @click="store.fetchPlatformStats()"
        >
          <Download class="w-4 h-4" /> Export Audit
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.isLoading && !store.stats" class="flex items-center justify-center py-16">
      <RefreshCcw class="w-6 h-6 text-blue-500 animate-spin mr-3" />
      <span class="text-slate-500 font-medium">Loading platform data…</span>
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Total Monthly Recurring Revenue
              </p>
              <h3 class="text-3xl font-black text-slate-900">{{ mrr }}</h3>
              <p class="text-sm font-bold text-blue-600 mt-2 flex items-center gap-1">
                <TrendingUp class="w-4 h-4" /> +12.4% vs last month
              </p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Landmark class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Total Parking Lots
              </p>
              <h3 class="text-3xl font-black text-slate-900">{{ totalTenants }}</h3>
              <p class="text-sm font-bold text-blue-600 mt-2 flex items-center gap-1">
                <span class="text-base leading-none">+</span> {{ activeTenants }} active tenants
              </p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-black text-2xl">
              P
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Active Users Across Tenants
              </p>
              <h3 class="text-3xl font-black text-slate-900">{{ activeTickets }}</h3>
              <p class="text-sm font-bold text-slate-500 mt-2 flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full border-2 border-slate-400 inline-block"></span>
                Active tickets live
              </p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Users class="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Bar Chart -->
        <div class="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3 class="font-bold text-lg text-slate-900">Global Revenue Analytics</h3>
              <p class="text-sm text-slate-500 mt-1">Daily consolidated revenue streams across all regions.</p>
            </div>
            <div class="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
              <button class="px-4 py-1.5 bg-white shadow-sm rounded-md text-sm font-bold text-slate-900">Revenue</button>
              <button class="px-4 py-1.5 text-sm font-bold text-slate-500 hover:text-slate-900">Transactions</button>
            </div>
          </div>
          <div class="h-64 flex items-end justify-between gap-4 px-2">
            <div
              v-for="bar in weeklyBars"
              :key="bar.day"
              class="flex-1 flex flex-col items-center relative"
            >
              <div
                v-if="bar.active"
                class="absolute -top-8 bg-black text-white text-xs font-bold px-2 py-1 rounded pointer-events-none"
              >
                {{ bar.label }}
                <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
              </div>
              <div
                class="w-full rounded-t-sm transition-all"
                :class="bar.active ? 'bg-blue-600' : 'bg-blue-100'"
                :style="{ height: `${bar.value}%` }"
              ></div>
              <span class="text-xs font-bold text-slate-500 mt-4">{{ bar.day }}</span>
            </div>
          </div>
        </div>

        <!-- Tenant Health Panel -->
        <div class="bg-[#1e2330] rounded-xl p-6 text-white shadow-sm flex flex-col">
          <div>
            <h3 class="font-bold text-lg">Tenant Health</h3>
            <p class="text-slate-400 text-sm mt-1">Ecosystem status summary.</p>
          </div>
          <div class="mt-8 space-y-6">
            <div>
              <div class="flex justify-between items-center mb-3">
                <span class="flex items-center gap-2 text-sm font-medium">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Active Tenants
                </span>
                <span class="text-xl font-bold">{{ activeTenants }}</span>
              </div>
              <div class="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-blue-600 rounded-full transition-all" :style="{ width: `${healthPct}%` }"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between items-center mb-3">
                <span class="flex items-center gap-2 text-sm font-medium">
                  <span class="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Pending Setup
                </span>
                <span class="text-xl font-bold">{{ pendingTenants }}</span>
              </div>
              <div class="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-orange-400 rounded-full transition-all"
                  :style="{ width: `${100 - healthPct}%` }"
                ></div>
              </div>
            </div>
          </div>
          <div class="mt-8 pt-6 border-t border-slate-700/50">
            <button
              class="flex items-center justify-between w-full text-xs font-bold tracking-wider hover:text-blue-400 transition-colors"
              @click="store.activeTab = 'tenants'"
            >
              VIEW DETAILED BREAKDOWN <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Tenants Table -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 class="font-bold text-lg text-slate-900">Recent Tenant Onboarding</h3>
          <button
            class="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50"
            @click="store.fetchTenants()"
          >
            <Filter class="w-4 h-4" /> Refresh
          </button>
        </div>
        <div v-if="store.isLoading" class="py-12 text-center text-slate-400 font-medium">
          <RefreshCcw class="w-5 h-5 animate-spin inline-block mr-2" /> Loading tenants…
        </div>
        <div v-else-if="store.tenants.length === 0" class="py-12 text-center text-slate-400 font-medium">
          No tenants found. Create your first tenant above.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Business Name</th>
                <th class="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th class="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Capacity</th>
                <th class="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="t in store.tenants.slice(0, 8)" :key="t._id" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded bg-blue-100 text-blue-600 font-black flex items-center justify-center text-sm">
                      {{ (t.name || t.companyName || '?').charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-bold text-sm text-slate-900">{{ t.name || t.companyName }}</p>
                      <p class="text-[10px] font-medium text-slate-500 mt-0.5">ID: {{ t._id?.slice(-6) }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">{{ t.corporate_email || t.email || '—' }}</td>
                <td class="px-6 py-4 text-sm text-slate-600">{{ t.total_capacity ?? '—' }}</td>
                <td class="px-6 py-4">
                  <span
                    class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider w-max"
                    :class="t.status === 'ACTIVE' ? 'text-blue-600' : 'text-orange-500'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="t.status === 'ACTIVE' ? 'bg-blue-600' : 'bg-orange-400'"></span>
                    {{ t.status || 'ACTIVE' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <button
                    class="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800"
                    @click="store.updateTenantStatus(t._id, t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')"
                    :title="t.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'"
                  >
                    <Plus class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
