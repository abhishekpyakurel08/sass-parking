<script setup lang="ts">
import { onMounted } from "vue";
import { useTenantStore } from "../../stores/tenant";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";
import {
  Search, Bell, HelpCircle, LayoutDashboard, Building2,
  ParkingSquare, Banknote, Users, BarChart2, Settings, LogOut,
  Download, ScanLine, MapPin, TrendingUp,
  TrendingDown, Car, MoreHorizontal, PenLine, RefreshCcw,
} from "lucide-vue-next";

const store = useTenantStore();
const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await Promise.all([
    store.fetchProfile(),
    store.fetchRevenueAnalytics(),
    store.fetchTicketHistory(),
    store.fetchRates(),
  ]);
});

const handleLogout = async () => {
  await authStore.logout();
  router.push("/");
};

const chartBars = [
  { label: "06:00", height: "30%", dark: false },
  { label: "", height: "25%", dark: false },
  { label: "09:00", height: "35%", dark: false },
  { label: "", height: "28%", dark: false },
  { label: "12:00", height: "50%", dark: false },
  { label: "", height: "70%", dark: true },
  { label: "15:00", height: "90%", dark: true },
  { label: "", height: "100%", dark: true },
  { label: "18:00", height: "78%", dark: true },
  { label: "", height: "55%", dark: false },
  { label: "21:00", height: "45%", dark: false },
  { label: "00:00", height: "32%", dark: false },
];

</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-[#dbeafe] flex flex-col flex-shrink-0 border-r border-blue-200">
      <div class="p-6">
        <h1 class="font-black text-2xl text-slate-900 tracking-tight">ParkSaaS</h1>
        <p class="text-xs font-bold text-slate-600 mt-0.5">Enterprise Console</p>
      </div>
      <nav class="flex-1 px-4 space-y-1.5 overflow-y-auto mt-4">
        <button class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold bg-blue-600 text-white shadow-md">
          <LayoutDashboard class="w-5 h-5" /> Dashboard
        </button>
        <button class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-slate-700 hover:bg-blue-200/50">
          <Building2 class="w-5 h-5" /> Tenants
        </button>
        <button class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-slate-700 hover:bg-blue-200/50">
          <ParkingSquare class="w-5 h-5" /> Parking Lots
        </button>
        <button class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-slate-700 hover:bg-blue-200/50">
          <Banknote class="w-5 h-5" /> Revenue
        </button>
        <button class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-slate-700 hover:bg-blue-200/50">
          <Users class="w-5 h-5" /> Users
        </button>
        <button class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-slate-700 hover:bg-blue-200/50">
          <BarChart2 class="w-5 h-5" /> Reports
        </button>
      </nav>
      <div class="p-4 space-y-2 mb-4">
        <button class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-slate-700 hover:bg-blue-200/50">
          <Settings class="w-5 h-5" /> Settings
        </button>
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-slate-700 hover:bg-blue-200/50">
          <LogOut class="w-5 h-5" /> Log Out
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      <!-- Header -->
      <header class="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
        <div class="flex-1 max-w-md relative">
          <Search class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search Metropolis Parking..."
            class="w-full bg-slate-100 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="flex items-center gap-5">
          <button class="text-slate-600 hover:text-slate-900"><Bell class="w-5 h-5" /></button>
          <button class="text-slate-600 hover:text-slate-900"><HelpCircle class="w-5 h-5" /></button>
          <div class="flex items-center gap-3 border-l pl-5">
            <div class="text-right">
              <p class="text-sm font-bold text-slate-900 leading-none">{{ authStore.user?.name || 'Tenant Owner' }}</p>
              <p class="text-[10px] font-medium text-slate-500 mt-1">Tenant Owner</p>
            </div>
            <div class="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
              <img src="https://i.pravatar.cc/150?img=11" alt="Owner" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-8">
        <div v-if="store.isLoading && !store.revenueAnalytics" class="flex items-center justify-center py-24">
          <RefreshCcw class="w-6 h-6 text-blue-500 animate-spin mr-3" />
          <span class="text-slate-500 font-medium">Loading dashboard…</span>
        </div>

        <div v-else class="max-w-7xl mx-auto space-y-6">
          <!-- Page Header -->
          <div class="flex justify-between items-end">
            <div>
              <h2 class="text-3xl font-bold text-slate-900 tracking-tight">
                {{ store.profile.companyName || 'Metropolis Central Lot' }}
              </h2>
              <div class="flex items-center gap-2 mt-2 text-slate-500 text-sm">
                <MapPin class="w-4 h-4" />
                <span>{{ store.profile.address || '452 Industrial Way, Sector 7' }}</span>
                <span class="px-1">•</span>
                <span class="flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-wider">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span> ACTIVE OPERATIONS
                </span>
              </div>
            </div>
            <div class="flex gap-3">
              <button class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Download class="w-4 h-4" /> Export Report
              </button>
              <button class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700">
                <ScanLine class="w-4 h-4" /> Quick Scan
              </button>
            </div>
          </div>

          <!-- Occupancy + Chart -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Occupancy -->
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">REAL-TIME OCCUPANCY</p>
                  <h3 class="text-4xl font-black text-slate-900">
                    {{ store.revenueAnalytics?.active_tickets ?? '—' }}
                    <span class="text-lg font-semibold text-slate-400 ml-1">active</span>
                  </h3>
                </div>
                <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100">
                  <BarChart2 class="w-5 h-5" />
                </div>
              </div>
              <div class="mt-6 h-3 w-full bg-blue-100 rounded-full overflow-hidden">
                <div class="h-full bg-blue-600 rounded-full" style="width: 78%"></div>
              </div>
              <div class="grid grid-cols-2 gap-4 mt-6">
                <div class="bg-slate-50 border border-slate-100 rounded-lg p-4">
                  <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">TODAY'S REVENUE</p>
                  <p class="text-lg font-bold text-slate-900">
                    ${{ store.revenueAnalytics?.today?.toFixed(2) ?? '0.00' }}
                  </p>
                </div>
                <div class="bg-slate-50 border border-slate-100 rounded-lg p-4">
                  <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">MONTHLY REVENUE</p>
                  <p class="text-lg font-bold text-slate-900">
                    ${{ store.revenueAnalytics?.oneMonth?.toFixed(2) ?? '0.00' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center justify-between mt-6 pt-5 border-t border-slate-100 text-sm">
                <span class="flex items-center gap-1.5 text-red-600 font-bold text-xs">
                  <TrendingDown class="w-4 h-4" /> High Demand Zone
                </span>
                <span class="text-slate-400 text-xs font-medium">Live data</span>
              </div>
            </div>

            <!-- Revenue Chart -->
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold text-lg text-slate-900">Daily Revenue Flow</h3>
                <div class="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <button class="px-3 py-1 bg-white shadow-sm rounded-md text-xs font-bold text-slate-900">Hourly</button>
                  <button class="px-3 py-1 text-xs font-bold text-slate-500">Heatmap</button>
                </div>
              </div>
              <div class="h-52 flex items-end justify-between gap-1.5 mt-4 px-1">
                <div v-for="(bar, i) in chartBars" :key="i" class="flex-1 flex flex-col items-center">
                  <div class="w-full rounded-sm"
                    :class="bar.dark ? 'bg-[#0052cc]' : 'bg-[#dae4f5]'"
                    :style="{ height: bar.height }"></div>
                  <div class="h-5 mt-2 flex items-center justify-center">
                    <span v-if="bar.label" class="text-[9px] font-bold text-slate-500">{{ bar.label }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- KPI Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">TODAY'S REVENUE</p>
              <div class="flex items-baseline gap-3">
                <h3 class="text-2xl font-black text-slate-900">${{ store.revenueAnalytics?.today?.toFixed(2) ?? '0.00' }}</h3>
                <span class="text-xs font-bold text-green-600 flex items-center gap-0.5"><TrendingUp class="w-3 h-3" /> Live</span>
              </div>
            </div>
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">3-MONTH REVENUE</p>
              <div class="flex items-baseline gap-3">
                <h3 class="text-2xl font-black text-slate-900">${{ store.revenueAnalytics?.threeMonths?.toFixed(0) ?? '0' }}</h3>
                <span class="text-xs font-medium text-slate-500">last 90 days</span>
              </div>
            </div>
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">ACTIVE TICKETS</p>
              <div class="flex items-baseline gap-3">
                <h3 class="text-2xl font-black text-slate-900">{{ store.revenueAnalytics?.active_tickets ?? 0 }}</h3>
                <span class="text-xs font-medium text-slate-500">vehicles parked</span>
              </div>
            </div>
          </div>

          <!-- Tickets Table + Rate Config -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Active Vehicles -->
            <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 class="font-bold text-lg text-slate-900">Active Vehicles</h3>
                <span class="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100 uppercase tracking-wider">LIVE FEED</span>
              </div>
              <div v-if="store.isLoading" class="py-10 text-center text-slate-400">
                <RefreshCcw class="w-5 h-5 animate-spin inline-block mr-2" /> Loading…
              </div>
              <div v-else-if="store.ticketHistory.length === 0" class="py-10 text-center text-slate-400 font-medium">
                No active vehicles found.
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th class="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">VEHICLE / LICENSE</th>
                      <th class="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">TYPE</th>
                      <th class="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">CHECK-IN</th>
                      <th class="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">STATUS</th>
                      <th class="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ACTION</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr v-for="ticket in store.ticketHistory.slice(0, 8)" :key="ticket._id" class="hover:bg-slate-50/50">
                      <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                            <Car class="w-4 h-4" />
                          </div>
                          <div>
                            <p class="font-bold text-sm text-slate-900">{{ ticket.license_plate || '—' }}</p>
                            <p class="text-[10px] text-slate-500">{{ ticket.ticket_number?.slice(0, 12) || ticket._id?.slice(-8) }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-5 py-4 text-sm text-slate-600">{{ ticket.vehicle_type || '—' }}</td>
                      <td class="px-5 py-4 text-sm text-slate-600">
                        {{ ticket.check_in_time ? new Date(ticket.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' }}
                      </td>
                      <td class="px-5 py-4">
                        <span class="px-2 py-1 border rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max"
                          :class="ticket.status === 'PAID' ? 'text-green-600 bg-green-50 border-green-200' : 'text-blue-600 bg-blue-50 border-blue-200'">
                          <span class="w-1.5 h-1.5 rounded-full" :class="ticket.status === 'PAID' ? 'bg-green-500' : 'bg-blue-600'"></span>
                          {{ ticket.status }}
                        </span>
                      </td>
                      <td class="px-5 py-4">
                        <button class="text-slate-400 hover:text-slate-600"><MoreHorizontal class="w-5 h-5" /></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Rate Config -->
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold text-lg text-slate-900">Rate Config</h3>
                <button class="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md">
                  <PenLine class="w-5 h-5" />
                </button>
              </div>

              <div v-if="store.isLoading" class="text-center py-6 text-slate-400">
                <RefreshCcw class="w-5 h-5 animate-spin inline-block" />
              </div>
              <div v-else-if="store.rates.length === 0" class="text-center py-6 text-slate-400 text-sm font-medium">
                No rates configured yet.
              </div>
              <div v-else class="space-y-3">
                <div v-for="rate in store.rates.slice(0, 3)" :key="rate._id || rate.vehicle_type"
                  class="border border-dashed border-slate-300 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p class="text-sm font-bold text-slate-900 capitalize">{{ rate.vehicle_type || 'Rate' }}</p>
                    <p class="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      PER {{ rate.billing_unit || 'HOUR' }}
                    </p>
                  </div>
                  <span class="text-lg font-black text-slate-900">${{ rate.rate_per_hour ?? rate.amount ?? '—' }}</span>
                </div>
              </div>

              <hr class="my-5 border-slate-100" />
              <div>
                <div class="flex justify-between items-center mb-3">
                  <p class="text-sm font-bold text-slate-900">Dynamic Pricing</p>
                  <div class="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div class="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                  </div>
                </div>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Rates increase by 15% when occupancy exceeds 90% capacity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
