<script setup lang="ts">
import { onMounted, watch, ref } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import { useAuthStore } from "../../stores/auth";
import { useRouter, useRoute } from "vue-router";
import {
  LayoutDashboard, Building2, Banknote, Users,
  BarChart2, Settings, LogOut, Bell, ChevronRight,
  Activity, Moon, Sun, X, Menu,
} from "lucide-vue-next";

import OverviewTab from "./overviewtab.vue";
import TenantsTab from "./tenentstab.vue";
import UsersTab from "./userstab.vue";
import BillingTab from "./billingtab.vue";
import LogsTab from "./activitylogs.vue";
import SettingsTab from "./settingstab.vue";

const router = useRouter();
const route  = useRoute();
const store  = useSuperadminStore();
const auth   = useAuthStore();

const sidebarOpen = ref(false);
const isDark      = ref(false);

const toggleDark = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
};

const switchTab = (tab: string) => {
  router.push({ query: { tab } });
  sidebarOpen.value = false;
};

watch(
  () => route.query.tab,
  (newTab) => {
    const tab = newTab ? String(newTab) : "overview";
    store.activeTab = tab as any;
    if (tab === "overview")  { store.fetchPlatformStats(); store.fetchTenants(); }
    if (tab === "tenants")   store.fetchTenants();
    if (tab === "users")     { store.fetchTenants(); store.fetchGlobalUsers(); }
    if (tab === "revenue")   store.fetchTenants();
    if (tab === "reports")   { store.fetchTenants(); store.fetchAuditLogs(); }
    if (tab === "settings")  store.fetchGlobalSettings();
  },
  { immediate: true }
);

onMounted(() => {
  if (!route.query.tab) router.replace({ query: { tab: "overview" } });
  
  if (localStorage.getItem("theme") === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    isDark.value = true;
    document.documentElement.classList.add("dark");
  } else {
    isDark.value = false;
    document.documentElement.classList.remove("dark");
  }
});

const handleLogout = async () => {
  await auth.logout();
  router.push("/");
};

const navItems = [
  { tab: "overview", icon: LayoutDashboard, label: "Dashboard" },
  { tab: "tenants",  icon: Building2,       label: "Tenants" },
  { tab: "revenue",  icon: Banknote,         label: "Revenue" },
  { tab: "users",    icon: Users,            label: "Users" },
  { tab: "reports",  icon: Activity,         label: "Audit Logs" },
];

const tabTitle: Record<string, string> = {
  overview: "System Overview",
  tenants:  "Tenant Management",
  revenue:  "Revenue & Billing",
  users:    "User Directory",
  reports:  "Audit Logs",
  settings: "Global Settings",
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans" :class="isDark ? 'dark bg-zinc-950' : ''">
    <!-- Mobile overlay -->
    <Transition name="fade">
      <div v-if="sidebarOpen" @click="sidebarOpen = false"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" />
    </Transition>

    <div class="flex h-screen overflow-hidden">
      <!-- ── Sidebar ─────────────────────────────────────────────────── -->
      <aside :class="[
        'fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out border-r',
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]">
        <!-- Logo -->
        <div class="flex items-center justify-between px-5 py-5 border-b" :class="isDark ? 'border-zinc-800' : 'border-slate-100'">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">P</div>
            <div>
              <h1 class="font-black text-base tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">ParkSaaS</h1>
              <p class="text-[9px] font-bold uppercase tracking-widest" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">Super Admin</p>
            </div>
          </div>
          <button @click="sidebarOpen = false" class="lg:hidden p-1 rounded-lg" :class="isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Admin badge -->
        <div class="px-3 py-3 mx-3 mt-3 rounded-xl border" :class="isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-100'">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
              {{ auth.user?.name?.charAt(0)?.toUpperCase() || 'A' }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold truncate" :class="isDark ? 'text-white' : 'text-slate-900'">{{ auth.user?.name || 'Super Admin' }}</p>
              <p class="text-[10px] font-medium" :class="isDark ? 'text-zinc-400' : 'text-slate-500'">System Administrator</p>
            </div>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 px-3 space-y-0.5 overflow-y-auto py-4">
          <button v-for="item in navItems" :key="item.tab"
            @click="switchTab(item.tab)"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none',
              store.activeTab === item.tab
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            ]">
            <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
            {{ item.label }}
            <ChevronRight v-if="store.activeTab === item.tab" class="w-3.5 h-3.5 ml-auto opacity-70" />
          </button>
        </nav>

        <!-- Bottom -->
        <div class="px-3 pb-4 space-y-0.5 border-t pt-3" :class="isDark ? 'border-zinc-800' : 'border-slate-100'">
          <button @click="switchTab('settings')"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none',
              store.activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'
            ]">
            <Settings class="w-4 h-4 flex-shrink-0" /> Settings
          </button>
          <button @click="handleLogout"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <LogOut class="w-4 h-4 flex-shrink-0" /> Log Out
          </button>
        </div>
      </aside>

      <!-- ── Main Content ─────────────────────────────────────────────── -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Topbar -->
        <header class="sticky top-0 z-20 border-b shrink-0 px-4 sm:px-6 py-3 flex items-center gap-4"
          :class="isDark ? 'bg-zinc-900/90 border-zinc-800 backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md'">
          <button @click="sidebarOpen = true" class="lg:hidden p-1.5 rounded-lg transition-colors"
            :class="isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100'">
            <Menu class="w-5 h-5" />
          </button>

          <div class="flex-1">
            <h2 class="text-base font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
              {{ tabTitle[store.activeTab] || 'Dashboard' }}
            </h2>
          </div>

          <div class="flex items-center gap-2">
            <!-- Dark Mode Toggle -->
            <button @click="toggleDark" class="p-2 rounded-lg transition-colors"
              :class="isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-yellow-400' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'">
              <Moon v-if="!isDark" class="w-4 h-4" />
              <Sun v-else class="w-4 h-4" />
            </button>

            <!-- Notifications -->
            <button class="relative p-2 rounded-lg transition-colors"
              :class="isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'">
              <Bell class="w-4 h-4" />
              <span class="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            </button>

            <!-- Avatar -->
            <div class="flex items-center gap-2 pl-2 border-l" :class="isDark ? 'border-zinc-700' : 'border-slate-200'">
              <div class="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                {{ auth.user?.name?.charAt(0)?.toUpperCase() || 'A' }}
              </div>
              <div class="hidden md:block text-right">
                <p class="text-xs font-bold leading-none" :class="isDark ? 'text-white' : 'text-slate-900'">
                  {{ auth.user?.name || 'Super Admin' }}
                </p>
                <p class="text-[10px] mt-0.5" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <!-- Tab Content -->
        <div class="flex-1 overflow-y-auto" :class="isDark ? 'bg-zinc-950' : 'bg-slate-50'">
          <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <OverviewTab v-if="store.activeTab === 'overview'" />
            <TenantsTab  v-if="store.activeTab === 'tenants' || store.activeTab === 'lots'" />
            <UsersTab    v-if="store.activeTab === 'users'" />
            <BillingTab  v-if="store.activeTab === 'revenue'" />
            <LogsTab     v-if="store.activeTab === 'reports'" />
            <SettingsTab v-if="store.activeTab === 'settings'" />
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
