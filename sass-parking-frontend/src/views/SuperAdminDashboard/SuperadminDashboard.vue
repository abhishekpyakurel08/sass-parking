<script setup lang="ts">
import { onMounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";
import {
  Search,
  Bell,
  HelpCircle,
  LayoutDashboard,
  Building2,
  ParkingSquare,
  Banknote,
  Users,
  BarChart2,
  ScanLine,
  Settings,
  LogOut,
} from "lucide-vue-next";

// Import Modular Components
import OverviewTab from "./overviewtab.vue";
import TenantsTab from "./tenentstab.vue";
import UsersTab from "./userstab.vue";
import BillingTab from "./billingtab.vue";
import LogsTab from "./activitylogs.vue";
import SettingsTab from "./settingstab.vue";

const router = useRouter();
const superadminStore = useSuperadminStore();
const authStore = useAuthStore();

onMounted(() => {
  superadminStore.fetchPlatformStats();
  superadminStore.fetchTenants();
});

const handleLogout = async () => {
  await authStore.logout();
  router.push("/");
};

const switchTab = (
  tab: "overview" | "tenants" | "lots" | "revenue" | "users" | "reports" | "settings",
) => {
  superadminStore.activeTab = tab as any;
  if (tab === "overview") {
    superadminStore.fetchPlatformStats();
    superadminStore.fetchTenants();
  }
  if (tab === "tenants") superadminStore.fetchTenants();
  if (tab === "users") {
    superadminStore.fetchTenants();
    superadminStore.fetchGlobalUsers();
  }
  if (tab === "plans" as any) {
    superadminStore.fetchPricingPlans();
  }
  if (tab === "logs" as any) superadminStore.fetchAuditLogs();
  if (tab === "settings" as any) superadminStore.fetchGlobalSettings();
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-[#dbeafe] flex flex-col flex-shrink-0 z-20 border-r border-blue-200">
      <div class="p-6">
        <h1 class="font-black text-2xl text-slate-900 tracking-tight">ParkSaaS</h1>
        <p class="text-xs font-bold text-slate-600 mt-0.5">Enterprise Console</p>
      </div>

      <nav class="flex-1 px-4 space-y-1.5 overflow-y-auto mt-4">
        <button
          @click="switchTab('overview')"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all outline-none',
            superadminStore.activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-blue-200/50',
          ]"
        >
          <LayoutDashboard class="w-5 h-5" />
          Dashboard
        </button>
        <button
          @click="switchTab('tenants')"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all outline-none',
            superadminStore.activeTab === 'tenants'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-blue-200/50',
          ]"
        >
          <Building2 class="w-5 h-5" />
          Tenants
        </button>
        <button
          @click="switchTab('lots')"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all outline-none',
            superadminStore.activeTab === 'lots'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-blue-200/50',
          ]"
        >
          <ParkingSquare class="w-5 h-5" />
          Parking Lots
        </button>
        <button
          @click="switchTab('revenue')"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all outline-none',
            superadminStore.activeTab === 'revenue'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-blue-200/50',
          ]"
        >
          <Banknote class="w-5 h-5" />
          Revenue
        </button>
        <button
          @click="switchTab('users')"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all outline-none',
            superadminStore.activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-blue-200/50',
          ]"
        >
          <Users class="w-5 h-5" />
          Users
        </button>
        <button
          @click="switchTab('reports')"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all outline-none',
            superadminStore.activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-blue-200/50',
          ]"
        >
          <BarChart2 class="w-5 h-5" />
          Reports
        </button>
      </nav>

      <!-- Bottom controls -->
      <div class="p-4 space-y-2 mb-4">
        <button
          @click="switchTab('settings')"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-slate-700 hover:bg-blue-200/50 transition-colors"
        >
          <Settings class="w-5 h-5" /> Settings
        </button>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-slate-700 hover:bg-blue-200/50 transition-colors"
        >
          <LogOut class="w-5 h-5" /> Log Out
        </button>
      </div>
    </aside>

    <!-- Main Content Frame -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      <header class="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
        <div class="flex-1 max-w-md relative">
          <Search class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search Metropolis Parking..." 
            class="w-full bg-slate-100 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex items-center gap-5">
          <button class="text-slate-600 hover:text-slate-900">
            <Bell class="w-5 h-5" />
          </button>
          <button class="text-slate-600 hover:text-slate-900">
            <HelpCircle class="w-5 h-5" />
          </button>
          <div class="flex items-center gap-3 border-l pl-5">
            <div class="text-right">
              <p class="text-sm font-bold text-slate-900 leading-none">Alex Mercer</p>
              <p class="text-[10px] font-medium text-slate-500 mt-1">Tenant Owner</p>
            </div>
            <div class="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
              <img src="https://i.pravatar.cc/150?img=11" alt="Admin" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-8">
        <div class="max-w-7xl mx-auto space-y-6">
          <OverviewTab v-if="superadminStore.activeTab === 'overview'" />
          <TenantsTab v-if="superadminStore.activeTab === 'tenants'" />
          <UsersTab v-if="superadminStore.activeTab === 'users'" />
          <BillingTab v-if="superadminStore.activeTab === 'plans'" />
          <LogsTab v-if="superadminStore.activeTab === 'logs'" />
          <SettingsTab v-if="superadminStore.activeTab === 'settings'" />
        </div>
      </div>
    </main>
  </div>
</template>
