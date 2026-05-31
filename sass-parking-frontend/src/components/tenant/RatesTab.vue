<script setup lang="ts">
import { ref } from 'vue';
import { useTenantStore } from '../../stores/tenant';
import { PenLine, RefreshCcw, Save, ParkingSquare } from 'lucide-vue-next';

const store = useTenantStore();

// Tooltip state
const rateTooltip = ref<{ x: number; y: number; rate: any } | null>(null);

const editingRate = ref<string | null>(null);
const rateForm = ref({ rate_per_hour: 0, grace_period_minutes: 5, lost_ticket_penalty: 0 });

const vehicleEmoji: Record<string, string> = {
  CAR: '🚗', BIKE: '🏍️', TRUCK: '🚛', BUS: '🚌', SUV: '🚙',
};

const startEditRate = (rate: any) => {
  editingRate.value = rate.vehicle_type;
  rateForm.value = {
    rate_per_hour: rate.rate_per_hour ?? rate.amount ?? 0,
    grace_period_minutes: rate.grace_period_minutes ?? 5,
    lost_ticket_penalty: rate.lost_ticket_penalty ?? 0,
  };
};

const saveRate = async () => {
  if (!editingRate.value) return;
  const ok = await store.upsertRate(editingRate.value, rateForm.value);
  if (ok) editingRate.value = null;
};

const initializeRates = async () => {
  // Business Rule v1: 2-Wheeler = NPR 40/hr, 4-Wheeler = NPR 80/hr
  await store.upsertRate('CAR',   { rate_per_hour: 80, grace_period_minutes: 15, lost_ticket_penalty: 200 });
  await store.upsertRate('BIKE',  { rate_per_hour: 40, grace_period_minutes: 15, lost_ticket_penalty: 200 });
  await store.upsertRate('TRUCK', { rate_per_hour: 100, grace_period_minutes: 15, lost_ticket_penalty: 200 });
  await store.upsertRate('SUV',   { rate_per_hour: 80, grace_period_minutes: 15, lost_ticket_penalty: 200 });
  await store.upsertRate('BUS',   { rate_per_hour: 100, grace_period_minutes: 15, lost_ticket_penalty: 200 });
};

// Hover event handlers
const handleRateHover = (event: MouseEvent, rate: any) => {
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  rateTooltip.value = {
    x: rect.left + rect.width / 2,
    y: rect.top,
    rate
  };
};

const handleRateLeave = () => {
  rateTooltip.value = null;
};
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Parking Rates</h2>
        <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">Billing Rule v1 · 2-Wheeler: Rs.40/hr · 4-Wheeler: Rs.80/hr · 15 min grace FREE</p>
      </div>
      <button v-if="store.rates.length === 0" @click="initializeRates" :disabled="store.isLoading"
        class="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 rounded-lg text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors self-start sm:self-auto">
        <RefreshCcw class="w-4 h-4" :class="store.isLoading ? 'animate-spin' : ''" /> Initialize Rates
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="py-10 sm:py-12 text-center text-slate-400">
      <RefreshCcw class="w-4 h-4 sm:w-5 sm:h-5 animate-spin inline-block mr-2" /> Loading rates…
    </div>

    <!-- Empty State -->
    <div v-else-if="store.rates.length === 0"
      class="bg-white dark:bg-slate-800 rounded-xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
      <ParkingSquare class="w-10 h-10 sm:w-12 sm:h-12 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
      <p class="font-bold text-slate-700 dark:text-slate-300 mb-1 text-sm sm:text-base">No rates configured yet</p>
      <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6">Initialize standard pricing to start collecting fares.</p>
      <button @click="initializeRates"
        class="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 inline-flex items-center gap-2">
        <RefreshCcw class="w-4 h-4" /> Initialize Default Rates
      </button>
    </div>

    <!-- Rate Cards -->
    <div v-else class="space-y-3 sm:space-y-4">
      <div v-for="rate in store.rates" :key="rate._id || rate.vehicle_type"
        class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
        @mouseenter="(e) => handleRateHover(e, rate)"
        @mouseleave="handleRateLeave">

        <!-- Rate Header -->
        <div class="p-4 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div class="flex items-center gap-2 sm:gap-3">
              <span class="text-xl sm:text-2xl">{{ vehicleEmoji[rate.vehicle_type] || '🚘' }}</span>
              <div>
                <p class="font-bold text-slate-900 dark:text-slate-100 capitalize text-base sm:text-lg">{{ rate.vehicle_type?.toLowerCase() }}</p>
                <p class="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Per {{ rate.billing_unit || 'HOUR' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
              <span class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">Rs. {{ rate.rate_per_hour ?? rate.amount ?? '—' }}</span>
              <button @click="startEditRate(rate)"
                class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800 transition-colors">
                <PenLine class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Summary pills -->
          <div v-if="editingRate !== rate.vehicle_type" class="mt-3 sm:mt-4 flex gap-2 sm:gap-3 flex-wrap">
            <span class="px-2 sm:px-2.5 py-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">
              Grace: {{ rate.grace_period_minutes ?? 5 }} min
            </span>
            <span class="px-2 sm:px-2.5 py-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">
              Lost ticket penalty: Rs. {{ rate.lost_ticket_penalty ?? 0 }}
            </span>
          </div>
        </div>

        <!-- Inline Edit Form -->
        <Transition name="slide-down">
          <div v-if="editingRate === rate.vehicle_type"
            class="border-t border-slate-100 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/80 px-4 sm:px-6 py-4 sm:py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            <div class="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl p-3 sm:p-4 shadow-sm">
              <label class="text-[9px] sm:text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider mb-2 block">Rate / Hour (Rs.)</label>
              <input v-model.number="rateForm.rate_per_hour" type="number" min="0"
                class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div class="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 sm:p-4 shadow-sm">
              <label class="text-[9px] sm:text-[10px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-wider mb-2 block">Grace Period (min)</label>
              <input v-model.number="rateForm.grace_period_minutes" type="number" min="0"
                class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div class="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 rounded-2xl p-3 sm:p-4 shadow-sm">
              <label class="text-[9px] sm:text-[10px] font-bold text-red-400 dark:text-red-500 uppercase tracking-wider mb-2 block">Lost Ticket Penalty (Rs.)</label>
              <input v-model.number="rateForm.lost_ticket_penalty" type="number" min="0"
                class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div class="sm:col-span-2 md:col-span-3 flex gap-3 pt-2">
              <button @click="saveRate" :disabled="store.isLoading"
                class="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-lg shadow-blue-300/50 transition-all">
                <Save class="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Save Rate
              </button>
              <button @click="editingRate = null"
                class="px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Cancel</button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Rate Tooltip -->
    <teleport to="body">
      <transition name="tooltip-fade">
        <div v-if="rateTooltip"
          class="fixed z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-12px] border border-slate-700 min-w-[200px]"
          :style="{ left: rateTooltip.x + 'px', top: rateTooltip.y + 'px' }">
          <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
            <span class="text-lg">{{ vehicleEmoji[rateTooltip.rate.vehicle_type] || '🚘' }}</span>
            <div class="text-slate-400 text-[10px] uppercase tracking-wider">{{ rateTooltip.rate.vehicle_type?.toLowerCase() }}</div>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-400">Rate:</span>
              <span class="font-bold text-emerald-400">Rs. {{ rateTooltip.rate.rate_per_hour ?? rateTooltip.rate.amount ?? '—' }}/hr</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Grace:</span>
              <span class="font-bold">{{ rateTooltip.rate.grace_period_minutes ?? 5 }} min</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Lost Penalty:</span>
              <span class="font-bold text-red-400">Rs. {{ rateTooltip.rate.lost_ticket_penalty ?? 0 }}</span>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
