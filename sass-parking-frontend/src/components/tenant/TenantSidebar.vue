<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';
import { useTenantStore } from '../../stores/tenant';
import {
  LayoutDashboard, ParkingSquare, Users, Settings,
  LogOut, Terminal, Ticket as TicketIcon,
  ChevronLeft, ChevronRight
} from 'lucide-vue-next';

const props = defineProps<{ activeTab: string; sidebarOpen: boolean; isCollapsed: boolean }>();
const emit = defineEmits<{
  navigate: [tab: string];
  close: [];
  'toggle-collapse': [];
}>();

const authStore = useAuthStore();
const store = useTenantStore();

const navItems = [
  { tab: 'overview',  label: 'Dashboard',       icon: LayoutDashboard },
  { tab: 'lots',      label: 'Parking Rates',   icon: ParkingSquare },
  { tab: 'tickets',   label: 'Parking Tickets', icon: TicketIcon },
  { tab: 'staff',     label: 'Staff',            icon: Users },
];
</script>

<template>
  <!-- Mobile Overlay -->
  <Transition name="fade">
    <div v-if="sidebarOpen" @click="emit('close')"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" />
  </Transition>

  <!-- Sidebar Panel -->
  <aside :class="[
    'fixed lg:static inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out',
    isCollapsed ? 'w-20' : 'w-64',
    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
  ]">

    <!-- Logo -->
    <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800" :class="isCollapsed ? 'justify-center px-4' : ''">
      <div v-if="!isCollapsed">
        <h1 class="font-black text-xl text-slate-900 dark:text-slate-100 tracking-tight">ParkSaaS</h1>
        <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">Tenant Console</p>
      </div>
      <div v-else>
        <span class="font-black text-2xl text-blue-600 tracking-wider">P.</span>
      </div>
      <button @click="emit('close')" class="lg:hidden text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    <!-- Profile mini removed -->

    <!-- Main Nav -->
    <nav class="flex-1 px-3 space-y-1.5 overflow-y-auto py-4" :class="isCollapsed ? 'px-2' : ''">
      <button
        v-for="item in navItems" :key="item.tab"
        @click="emit('navigate', item.tab)"
        :title="isCollapsed ? item.label : undefined"
        :class="[
          'flex items-center rounded-xl text-sm font-semibold transition-all outline-none',
          isCollapsed ? 'justify-center p-2.5 mx-auto w-11 h-11' : 'w-full gap-3 px-3 py-2.5',
          activeTab === item.tab
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        ]">
        <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
        <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Bottom: Settings + Logout + Collapse -->
    <div class="px-3 pb-4 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3" :class="isCollapsed ? 'px-2' : ''">
      <button @click="emit('navigate', 'settings')"
        :title="isCollapsed ? 'Settings' : undefined"
        :class="[
          'flex items-center rounded-xl text-sm font-semibold transition-all outline-none',
          isCollapsed ? 'justify-center p-2.5 mx-auto w-11 h-11' : 'w-full gap-3 px-3 py-2.5',
          activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        ]">
        <Settings class="w-4 h-4 flex-shrink-0" /> 
        <span v-if="!isCollapsed">Settings</span>
      </button>
      <button @click="emit('navigate', '__logout__')"
        :title="isCollapsed ? 'Log Out' : undefined"
        :class="[
          'flex items-center rounded-xl text-sm font-semibold transition-all outline-none',
          isCollapsed ? 'justify-center p-2.5 mx-auto w-11 h-11 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'w-full gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
        ]">
        <LogOut class="w-4 h-4 flex-shrink-0" /> 
        <span v-if="!isCollapsed">Log Out</span>
      </button>

      <!-- Desktop Collapse Button -->
      <button @click="emit('toggle-collapse')"
        class="hidden lg:flex items-center rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all outline-none"
        :class="isCollapsed ? 'justify-center p-2.5 mx-auto w-11 h-11' : 'w-full gap-3 px-3 py-2.5'">
        <component :is="isCollapsed ? ChevronRight : ChevronLeft" class="w-4 h-4 flex-shrink-0" />
        <span v-if="!isCollapsed">Collapse Sidebar</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
