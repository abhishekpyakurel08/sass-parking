<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import { useRouter } from "vue-router";
import {
  Building2,
  Users,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  ShieldAlert,
  Settings,
  SquareActivity,
  Server,
  CreditCard,
  Sun,
  Moon,
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

// --- Improved Theme System ---
// Uses a reactive ref that watches the DOM directly via MutationObserver
// This ensures sync across all components without prop drilling
const isDark = ref(false);

const updateThemeState = () => {
  const root = document.documentElement;
  const hasDark = root.classList.contains("dark");
  isDark.value = hasDark;
  // Also update meta theme-color for mobile browsers
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", hasDark ? "#09090b" : "#ffffff");
  }
};

const toggleTheme = () => {
  const root = document.documentElement;
  const goingDark = !root.classList.contains("dark");

  if (goingDark) {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }

  // Dispatch custom event so other components can react
  window.dispatchEvent(
    new CustomEvent("themechange", {
      detail: { isDark: goingDark },
    }),
  );

  updateThemeState();
};

// Watch for system preference changes
let mediaQuery: MediaQueryList | null = null;

const handleSystemThemeChange = (e: MediaQueryListEvent) => {
  const savedTheme = localStorage.getItem("theme");
  // Only auto-switch if user hasn't manually set a preference
  if (!savedTheme) {
    const root = document.documentElement;
    if (e.matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    updateThemeState();
  }
};

// Observe DOM changes to keep reactive state in sync (e.g. if another tab changes it)
let observer: MutationObserver | null = null;

onMounted(() => {
  superadminStore.fetchPlatformStats();
  superadminStore.fetchTenants();

  // Initialize theme
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const root = document.documentElement;

  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  updateThemeState();

  // Listen for system preference changes
  mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", handleSystemThemeChange);

  // Observe class changes on html element
  observer = new MutationObserver(() => updateThemeState());
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
});

const handleLogout = () => {
  router.push("/");
};

const switchTab = (
  tab: "overview" | "tenants" | "users" | "plans" | "logs" | "settings",
) => {
  superadminStore.activeTab = tab;
  if (tab === "overview") superadminStore.fetchPlatformStats();
  if (tab === "tenants") superadminStore.fetchTenants();
  if (tab === "users") {
    superadminStore.fetchTenants();
    superadminStore.fetchGlobalUsers();
  }
  if (tab === "plans") {
    superadminStore.fetchTenants();
    superadminStore.fetchPlatformStats();
    if (typeof superadminStore.fetchPricingPlans === "function") {
      superadminStore.fetchPricingPlans();
    }
  }
  if (tab === "logs") superadminStore.fetchAuditLogs();
  if (tab === "settings") superadminStore.fetchGlobalSettings();
};
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 flex font-sans transition-colors duration-300"
  >
    <!-- Sidebar -->
    <aside
      class="w-72 dark:bg-zinc-950 text-zinc-300 flex flex-col flex-shrink-0 z-20 shadow-2xl relative border-r border-white/5 transition-colors duration-300"
    >
      <div
        class="absolute inset-0 dark:bg-gradient-to-b from-zinc-900/50 to-transparent pointer-events-none transition-opacity duration-300"
      ></div>

      <div class="p-6 pb-6 border-b border-white/5 relative z-10">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center shadow-lg shadow-black/40"
          >
            <ShieldAlert class="text-white w-6 h-6" />
          </div>
          <span
            class="font-bold text-xl tracking-tight text-slate-900 dark:text-white"
          >
            Platform<span class="text-slate-700 dark:text-zinc-400">Hub</span>
          </span>
        </div>
        <p
          class="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-wide"
        >
          Admin Panel
        </p>
      </div>

      <nav class="flex-1 p-4 space-y-1 relative z-10 overflow-y-auto">
        <p
          class="text-xs font-bold text-zinc-600 uppercase tracking-widest px-4 pt-2 pb-1"
        >
          Management Menu
        </p>
        <button
          v-for="item in [
            {
              id: 'overview',
              icon: LayoutDashboard,
              label: 'Overview Dashboard',
            },
            { id: 'tenants', icon: Building2, label: 'Partner Accounts' },
            { id: 'users', icon: Users, label: 'System Users' },
            { id: 'plans', icon: CreditCard, label: 'Billing & Subscriptions' },
            { id: 'logs', icon: Activity, label: 'Activity Logs' },
            { id: 'settings', icon: Settings, label: 'Global Settings' },
          ]"
          :key="item.id"
          @click="switchTab(item.id as any)"
          :class="[
            'w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all outline-none',
            superadminStore.activeTab === item.id
              ? 'bg-zinc-800 text-white shadow-lg shadow-zinc-950/40'
              : 'text-zinc-500 hover:bg-white/5 hover:text-white',
          ]"
        >
          <div class="flex items-center gap-3">
            <component :is="item.icon" class="w-5 h-5" />
            {{ item.label }}
          </div>
          <ChevronRight
            v-if="superadminStore.activeTab === item.id"
            class="w-4 h-4 opacity-70"
          />
        </button>
      </nav>

      <!-- Bottom controls -->
      <div class="p-4 border-t border-white/5 relative z-10">
        <!-- <div
          class="flex items-center gap-2 px-4 py-3 bg-zinc-900/40 rounded-xl border border-white/5 mb-2"
        >
          <span
            class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
          ></span>
          <p class="text-xs font-bold text-zinc-400">All Systems Online</p>
        </div> -->
        <button
          @click="handleLogout"
          class="w-full bg-red-500 rounded-2xl flex items-center gap-3 px-4 py-3 text-zinc-100 hover:text-white hover:bg-white/5 rounded-xl font-semibold transition-colors outline-none"
        >
          <LogOut class="w-5 h-5" /> Sign Out
        </button>
      </div>
    </aside>

    <!-- Main Content Frame -->
    <main
      class="flex-1 flex flex-col h-screen overflow-hidden bg-[#f4f7f9] dark:bg-zinc-950 transition-colors duration-300"
    >
      <header
        class="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-8 py-5 flex justify-between items-center shrink-0 shadow-sm relative z-10 transition-colors duration-300"
      >
        <div>
          <h1
            class="text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tight"
          >
            {{ superadminStore.activeTab.replace("-", " ") }}
          </h1>
          <p class="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage registered companies, system users, and global configuration
            values.
          </p>
        </div>
        <div class="flex items-center gap-4">
          <!-- Improved Dark/Light Theme Toggle with animation -->
          <button
            @click="toggleTheme"
            aria-label="Toggle theme"
            class="relative p-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl border border-slate-200 dark:border-zinc-700 transition-all duration-300 overflow-hidden group"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <div class="relative w-5 h-5">
              <Sun
                class="w-5 h-5 text-amber-500 absolute inset-0 transition-all duration-500 rotate-0 opacity-100 dark:rotate-90 dark:opacity-0 dark:scale-50"
              />
              <Moon
                class="w-5 h-5 text-indigo-400 absolute inset-0 transition-all duration-500 -rotate-90 opacity-0 scale-50 dark:rotate-0 dark:opacity-100 dark:scale-100"
              />
            </div>
          </button>

          <div
            class="px-4 py-1.5 bg-zinc-900 dark:bg-zinc-800 text-white font-bold text-sm rounded-full border border-zinc-800 flex items-center gap-2 transition-colors duration-300"
          >
            <Server class="w-4 h-4" />
            System Administrator
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-8">
        <div class="max-w-full mx-auto space-y-6">
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
