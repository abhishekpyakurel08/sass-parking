<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useTenantStore } from '../../stores/tenant';
import { useAuthStore } from '../../stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { Search, RefreshCcw, Sun, Moon } from 'lucide-vue-next';

// Layout components
import TenantSidebar from '../../components/tenant/TenantSidebar.vue';

// Tab components
import OverviewTab  from '../../components/tenant/OverviewTab.vue';
import StaffTab     from '../../components/tenant/StaffTab.vue';
import RatesTab     from '../../components/tenant/RatesTab.vue';
import TicketsTab   from '../../components/tenant/TicketsTab.vue';
import SettingsTab  from '../../components/tenant/SettingsTab.vue';

const store     = useTenantStore();
const authStore = useAuthStore();
const router    = useRouter();
const route     = useRoute();

const activeTab        = ref('overview');
const sidebarOpen      = ref(false);
const sidebarCollapsed = ref(false);

// Tab → data loader map
const loaders: Record<string, () => Promise<void>> = {
  staff:    () => store.fetchStaff(),
  lots:     () => store.fetchRates(),
  settings: () => store.fetchProfile(),
  tickets:  () => store.fetchTicketHistory(1),
};

watch(() => route.query.tab, async (newTab) => {
  activeTab.value = newTab ? String(newTab) : 'overview';
  await loaders[activeTab.value]?.();
}, { immediate: true });

onMounted(async () => {
  await Promise.all([
    store.fetchProfile(),
    store.fetchRevenueAnalytics(),
    store.fetchTicketHistory(),
    store.fetchRates(),
  ]);
});

const navigate = async (tab: string) => {
  if (tab === '__logout__') {
    await authStore.logout();
    router.push('/');
    return;
  }
  sidebarOpen.value = false;
  router.push({ query: { tab } });
};
// Dark Mode toggle
const isDarkMode = ref(localStorage.getItem('theme') === 'dark');
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

onMounted(() => {
  if (isDarkMode.value || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true;
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
    <div class="flex h-screen overflow-hidden">

      <!-- ── Sidebar ─────────────────────────────────────────────── -->
      <TenantSidebar
        :active-tab="activeTab"
        :sidebar-open="sidebarOpen"
        :is-collapsed="sidebarCollapsed"
        @navigate="navigate"
        @close="sidebarOpen = false"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      />

      <!-- ── Main Content ────────────────────────────────────────── -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden">

        <!-- Sticky Top Header -->
        <header class="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center gap-4 shrink-0 transition-colors duration-200">
          <!-- Hamburger (mobile) -->
          <button @click="sidebarOpen = true"
            class="lg:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Search -->
          <div class="flex-1 max-w-sm relative hidden sm:block">
            <Search class="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search vehicles, tickets…"
              class="w-full bg-slate-100 dark:bg-slate-800 rounded-full pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 border border-transparent dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all" />
          </div>

          <!-- Right actions -->
          <div class="ml-auto flex items-center gap-3">
            <button @click="toggleDarkMode" class="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Sun v-if="isDarkMode" class="w-5 h-5" />
              <Moon v-else class="w-5 h-5" />
            </button>
          </div>
        </header>

        <!-- Scrollable Tab Content -->
        <div class="flex-1 overflow-y-auto">
          <div class="p-4 sm:p-6 lg:p-8">

            <!-- Global loading -->
            <div v-if="store.isLoading && !store.revenueAnalytics" class="flex items-center justify-center py-24">
              <RefreshCcw class="w-6 h-6 text-blue-500 animate-spin mr-3" />
              <span class="text-slate-500 dark:text-slate-400 font-medium">Loading dashboard…</span>
            </div>

            <!-- Tab Router -->
            <template v-else>
              <OverviewTab  v-if="activeTab === 'overview'" />
              <StaffTab     v-else-if="activeTab === 'staff'" />
              <RatesTab     v-else-if="activeTab === 'lots'" />
              <TicketsTab   v-else-if="activeTab === 'tickets'" />
              <SettingsTab  v-else-if="activeTab === 'settings'" />
              <OverviewTab  v-else />
            </template>

          </div>
        </div>
      </main>
    </div>
  </div>
</template>
