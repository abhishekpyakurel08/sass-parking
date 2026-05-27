<script setup lang="ts">
import { onMounted, watch } from "vue";
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

import { useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const superadminStore = useSuperadminStore();
const authStore = useAuthStore();

const switchTab = (tab: string) => {
  router.push({ query: { tab } });
};

watch(() => route.query.tab, (newTab) => {
  const tab = newTab ? String(newTab) : "overview";
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
  if (tab === "revenue") {
    superadminStore.fetchPricingPlans();
  }
  if (tab === "reports") superadminStore.fetchAuditLogs();
  if (tab === "settings") superadminStore.fetchGlobalSettings();
}, { immediate: true });

onMounted(() => {
  if (!route.query.tab) {
    router.replace({ query: { tab: "overview" } });
  }
});

const handleLogout = async () => {
  await authStore.logout();
  router.push("/");
};

// Mobile sidebar state
import { ref } from "vue";
const sidebarOpen = ref(false);
const closeSidebar = () => { sidebarOpen.value = false; };
const navAndSwitch = (tab: string) => { switchTab(tab); closeSidebar(); };
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
    
    <!-- Mobile overlay -->
    <Transition name="fade">
      <div v-if="sidebarOpen" @click="closeSidebar"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" />
    </Transition>

    <div class="flex h-screen overflow-hidden">
      <!-- Sidebar -->
      <aside :class="[
        'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h1 class="font-black text-xl text-slate-900 tracking-tight">ParkSaaS</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Enterprise Console</p>
          </div>
          <button @click="closeSidebar" class="lg:hidden text-slate-400 hover:text-slate-700 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-4 py-3 mx-3 mt-3 rounded-xl bg-slate-50 border border-slate-100">
          <div class="flex items-center gap-3">
            <img src="https://i.pravatar.cc/150?img=11" class="w-8 h-8 rounded-full object-cover" />
            <div class="min-w-0">
              <p class="text-sm font-bold text-slate-900 truncate">{{ authStore.user?.name || 'Super Admin' }}</p>
              <p class="text-[10px] text-slate-400 font-medium">Administrator</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 px-3 space-y-1 overflow-y-auto py-4">
          <button @click="navAndSwitch('overview')"
            :class="['w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none',
              superadminStore.activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100']">
            <LayoutDashboard class="w-4 h-4 flex-shrink-0" /> Dashboard
          </button>
          <button @click="navAndSwitch('tenants')"
            :class="['w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none',
              superadminStore.activeTab === 'tenants' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100']">
            <Building2 class="w-4 h-4 flex-shrink-0" /> Tenants
          </button>
          <button @click="navAndSwitch('lots')"
            :class="['w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none',
              superadminStore.activeTab === 'lots' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100']">
            <ParkingSquare class="w-4 h-4 flex-shrink-0" /> Parking Lots
          </button>
          <button @click="navAndSwitch('revenue')"
            :class="['w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none',
              superadminStore.activeTab === 'revenue' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100']">
            <Banknote class="w-4 h-4 flex-shrink-0" /> Revenue
          </button>
          <button @click="navAndSwitch('users')"
            :class="['w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none',
              superadminStore.activeTab === 'users' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100']">
            <Users class="w-4 h-4 flex-shrink-0" /> Users
          </button>
          <button @click="navAndSwitch('reports')"
            :class="['w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none',
              superadminStore.activeTab === 'reports' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100']">
            <BarChart2 class="w-4 h-4 flex-shrink-0" /> Reports
          </button>
        </nav>

        <div class="px-3 pb-4 space-y-1 border-t border-slate-100 pt-3">
          <button @click="navAndSwitch('settings')"
            :class="['w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none',
              superadminStore.activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 transition-colors']">
            <Settings class="w-4 h-4 flex-shrink-0" /> Settings
          </button>
          <button @click="handleLogout"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
            <LogOut class="w-4 h-4 flex-shrink-0" /> Log Out
          </button>
        </div>
      </aside>

      <!-- Main Content Frame -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-4 shrink-0">
          <button @click="sidebarOpen = true"
            class="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div class="flex-1 max-w-sm relative hidden sm:block">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search Metropolis Parking..."
              class="w-full bg-slate-100 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
          </div>

          <div class="ml-auto flex items-center gap-3">
            <button class="relative text-slate-500 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell class="w-5 h-5" />
              <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
            </button>
            <button class="hidden sm:flex text-slate-500 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <HelpCircle class="w-5 h-5" />
            </button>
            <div class="flex items-center gap-2.5 border-l pl-3">
              <img src="https://i.pravatar.cc/150?img=11" class="w-8 h-8 rounded-full object-cover border-2 border-white shadow" />
              <div class="hidden md:block text-right">
                <p class="text-sm font-bold text-slate-900 leading-none">{{ authStore.user?.name || 'Super Admin' }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">System Admin</p>
              </div>
            </div>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto">
          <div class="p-4 sm:p-6 lg:p-8">
        <div class="max-w-7xl mx-auto space-y-6">
          <OverviewTab v-if="superadminStore.activeTab === 'overview'" />
          <TenantsTab v-if="superadminStore.activeTab === 'tenants' || superadminStore.activeTab === 'lots'" />
          <UsersTab v-if="superadminStore.activeTab === 'users'" />
          <BillingTab v-if="superadminStore.activeTab === 'revenue'" />
          <LogsTab v-if="superadminStore.activeTab === 'reports'" />
          <SettingsTab v-if="superadminStore.activeTab === 'settings'" />
        </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
