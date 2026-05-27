<script setup lang="ts">
import { ref } from 'vue';
import { useTenantStore } from '../../stores/tenant';
import { PenLine, RefreshCcw, Save, ParkingSquare } from 'lucide-vue-next';

const store = useTenantStore();

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
  await store.upsertRate('CAR',   { rate_per_hour: 50, grace_period_minutes: 5, lost_ticket_penalty: 500 });
  await store.upsertRate('BIKE',  { rate_per_hour: 20, grace_period_minutes: 5, lost_ticket_penalty: 200 });
  await store.upsertRate('TRUCK', { rate_per_hour: 100, grace_period_minutes: 5, lost_ticket_penalty: 1000 });
};
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Parking Rates</h2>
        <p class="text-slate-500 text-sm mt-1">Configure fare rates per vehicle type.</p>
      </div>
      <button v-if="store.rates.length === 0" @click="initializeRates" :disabled="store.isLoading"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
        <RefreshCcw class="w-4 h-4" :class="store.isLoading ? 'animate-spin' : ''" /> Initialize Rates
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="py-12 text-center text-slate-400">
      <RefreshCcw class="w-5 h-5 animate-spin inline-block mr-2" /> Loading rates…
    </div>

    <!-- Empty State -->
    <div v-else-if="store.rates.length === 0"
      class="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
      <ParkingSquare class="w-12 h-12 text-slate-200 mx-auto mb-4" />
      <p class="font-bold text-slate-700 mb-1">No rates configured yet</p>
      <p class="text-slate-500 text-sm mb-6">Initialize standard pricing to start collecting fares.</p>
      <button @click="initializeRates"
        class="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 inline-flex items-center gap-2">
        <RefreshCcw class="w-4 h-4" /> Initialize Default Rates
      </button>
    </div>

    <!-- Rate Cards -->
    <div v-else class="space-y-4">
      <div v-for="rate in store.rates" :key="rate._id || rate.vehicle_type"
        class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        <!-- Rate Header -->
        <div class="p-6">
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ vehicleEmoji[rate.vehicle_type] || '🚘' }}</span>
              <div>
                <p class="font-bold text-slate-900 capitalize text-lg">{{ rate.vehicle_type?.toLowerCase() }}</p>
                <p class="text-xs text-slate-500 uppercase tracking-wider mt-0.5">Per {{ rate.billing_unit || 'HOUR' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-2xl font-black text-slate-900">Rs. {{ rate.rate_per_hour ?? rate.amount ?? '—' }}</span>
              <button @click="startEditRate(rate)"
                class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors">
                <PenLine class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Summary pills -->
          <div v-if="editingRate !== rate.vehicle_type" class="mt-4 flex gap-3 flex-wrap">
            <span class="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
              Grace: {{ rate.grace_period_minutes ?? 5 }} min
            </span>
            <span class="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
              Lost ticket penalty: Rs. {{ rate.lost_ticket_penalty ?? 0 }}
            </span>
          </div>
        </div>

        <!-- Inline Edit Form -->
        <Transition name="slide-down">
          <div v-if="editingRate === rate.vehicle_type"
            class="border-t border-slate-100 bg-slate-50 px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-500 mb-1.5 block">Rate / Hour (Rs.)</label>
              <input v-model.number="rateForm.rate_per_hour" type="number" min="0"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500 mb-1.5 block">Grace Period (min)</label>
              <input v-model.number="rateForm.grace_period_minutes" type="number" min="0"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500 mb-1.5 block">Lost Ticket Penalty (Rs.)</label>
              <input v-model.number="rateForm.lost_ticket_penalty" type="number" min="0"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
            <div class="md:col-span-3 flex gap-3 pt-1">
              <button @click="saveRate" :disabled="store.isLoading"
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Save class="w-4 h-4" /> Save Rate
              </button>
              <button @click="editingRate = null"
                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
