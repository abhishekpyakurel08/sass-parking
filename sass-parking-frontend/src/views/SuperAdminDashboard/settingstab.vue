<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import {
  Loader2, Save, Globe, MessageSquare, Wrench, AlertTriangle, ShieldCheck
} from "lucide-vue-next";

const store = useSuperadminStore();

const isDark = ref(document.documentElement.classList.contains("dark"));
let observer: MutationObserver | null = null;
onMounted(() => {
  observer = new MutationObserver(() => { isDark.value = document.documentElement.classList.contains("dark"); });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  store.fetchGlobalSettings();
});
onUnmounted(() => observer?.disconnect());

const inputCls = computed(() =>
  `w-full px-4 py-2.5 border rounded-xl font-bold text-xs outline-none transition-colors ${
    isDark.value ? "bg-zinc-900 border-zinc-800 text-white focus:border-zinc-600" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"
  }`
);
</script>

<template>
  <div class="rounded-2xl border p-6 sm:p-8 transition-colors max-w-4xl mx-auto"
    :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">

    <div class="flex items-center gap-4 mb-8 pb-6 border-b transition-colors"
      :class="isDark ? 'border-zinc-800' : 'border-slate-100'">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
        :class="isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'">
        <Wrench class="w-6 h-6" />
      </div>
      <div>
        <h2 class="text-base font-bold uppercase tracking-wider" :class="isDark ? 'text-white' : 'text-slate-900'">Global Settings</h2>
        <p class="text-xs mt-1" :class="isDark ? 'text-zinc-500' : 'text-slate-500'">Configure platform-wide operational parameters and gateways</p>
      </div>
    </div>

    <form @submit.prevent="store.updateGlobalSettings" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Maintenance Mode -->
        <div class="p-4 rounded-xl border transition-colors" :class="isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-slate-50 border-slate-200'">
          <label class="text-[10px] font-black uppercase flex items-center gap-1.5 mb-2" :class="isDark ? 'text-zinc-400' : 'text-zinc-600'">
            <AlertTriangle class="w-3.5 h-3.5" :class="store.globalSettings.maintenanceMode ? 'text-amber-500' : ''" />
            System Status Mode
          </label>
          <select v-model="store.globalSettings.maintenanceMode" :class="inputCls">
            <option :value="false">Operational (Live Systems)</option>
            <option :value="true">Maintenance Mode Enabled</option>
          </select>
          <p class="text-[10px] mt-2 font-medium" :class="isDark ? 'text-zinc-500' : 'text-slate-500'">
            When enabled, non-admin tenant access is restricted.
          </p>
        </div>

        <!-- Base Fee Rule -->
        <div class="p-4 rounded-xl border transition-colors" :class="isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-slate-50 border-slate-200'">
          <label class="text-[10px] font-black uppercase flex items-center gap-1.5 mb-2" :class="isDark ? 'text-zinc-400' : 'text-zinc-600'">
            <Globe class="w-3.5 h-3.5 text-blue-500" />
            Global Base Rate Formula
          </label>
          <input v-model="store.globalSettings.globalRateFormula" type="text" placeholder="e.g., BASE_HOUR_FACTOR_1.2" :class="inputCls" />
          <p class="text-[10px] mt-2 font-medium" :class="isDark ? 'text-zinc-500' : 'text-slate-500'">
            Identifier used for default global fee scaling.
          </p>
        </div>

        <!-- SMS Gateway -->
        <div class="md:col-span-2 p-4 rounded-xl border transition-colors" :class="isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-slate-50 border-slate-200'">
          <label class="text-[10px] font-black uppercase flex items-center gap-1.5 mb-2" :class="isDark ? 'text-zinc-400' : 'text-zinc-600'">
            <MessageSquare class="w-3.5 h-3.5 text-emerald-500" />
            SMS Gateway API URL
          </label>
          <input v-model="store.globalSettings.smsGatewayUrl" type="url" placeholder="https://api.sms-provider.com/v1/send" :class="inputCls" />
          <p class="text-[10px] mt-2 font-medium" :class="isDark ? 'text-zinc-500' : 'text-slate-500'">
            Endpoint for dispatching payment links and SMS notifications to customers.
          </p>
        </div>
      </div>

      <div class="pt-6 mt-6 border-t flex items-center justify-between transition-colors" :class="isDark ? 'border-zinc-800' : 'border-slate-100'">
        <div class="flex items-center gap-2 text-xs font-bold" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">
          <ShieldCheck class="w-4 h-4 text-emerald-500" /> Settings require Super Admin privileges
        </div>
        <button type="submit" :disabled="store.isLoading"
          class="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all"
          :class="isDark ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'">
          <Loader2 v-if="store.isLoading" class="w-3.5 h-3.5 animate-spin" />
          <Save v-else class="w-3.5 h-3.5" />
          Save Configurations
        </button>
      </div>
    </form>
  </div>
</template>
