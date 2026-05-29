<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useTenantStore } from '../../stores/tenant';
import { useAuthStore } from '../../stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { Search, Bell, HelpCircle, RefreshCcw } from 'lucide-vue-next';

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
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
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
        <header class="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-4 shrink-0">
          <!-- Hamburger (mobile) -->
          <button @click="sidebarOpen = true"
            class="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Search -->
          <div class="flex-1 max-w-sm relative hidden sm:block">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search vehicles, tickets…"
              class="w-full bg-slate-100 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
          </div>

          <!-- Right actions -->
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
                <p class="text-sm font-bold text-slate-900 leading-none">{{ authStore.user?.name || store.profile.companyName || 'Owner' }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">Tenant Admin</p>
              </div>
            </div>
          </div>
        </header>

        <!-- Scrollable Tab Content -->
        <div class="flex-1 overflow-y-auto">
          <div class="p-4 sm:p-6 lg:p-8">

            <!-- Global loading -->
            <div v-if="store.isLoading && !store.revenueAnalytics" class="flex items-center justify-center py-24">
              <RefreshCcw class="w-6 h-6 text-blue-500 animate-spin mr-3" />
              <span class="text-slate-500 font-medium">Loading dashboard…</span>
            </div>

            <!-- Tab Router -->
            <template v-else>
              <OverviewTab  v-if="activeTab === 'overview'" />
              <StaffTab     v-else-if="activeTab === 'staff'" />
              <RatesTab     v-else-if="activeTab === 'lots'" />
              <TicketsTab   v-else-if="activeTab === 'tickets'" />
              <TerminalTab  v-else-if="activeTab === 'terminal'" />
              <SettingsTab  v-else-if="activeTab === 'settings'" />
              <OverviewTab  v-else />
            </template>

          </div>
        </div>
      </main>
    </div>
  </div>
</template>
