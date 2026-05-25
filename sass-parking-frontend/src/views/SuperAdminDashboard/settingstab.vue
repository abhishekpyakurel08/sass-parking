<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import {
  Loader2,
  Save,
  Globe,
  MessageSquare,
  Wrench,
  AlertTriangle,
} from "lucide-vue-next";

const superadminStore = useSuperadminStore();

// --- Reactive Dark Mode Detection ---
const isDarkMode = ref(false);
const updateDarkMode = () => {
  isDarkMode.value = document.documentElement.classList.contains("dark");
};
let themeObserver: MutationObserver | null = null;

onMounted(() => {
  updateDarkMode();
  themeObserver = new MutationObserver(updateDarkMode);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  window.addEventListener("themechange", () => updateDarkMode());
});
onUnmounted(() => {
  themeObserver?.disconnect();
});
</script>

<template>
  <div
    class="rounded-2xl shadow-sm border p-8 transition-colors duration-300"
    :class="
      isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
    "
  >
    <div
      class="flex items-center gap-3 mb-6 pb-4 border-b transition-colors duration-300"
      :class="isDarkMode ? 'border-zinc-800' : 'border-slate-150'"
    >
      <div
        class="w-10 h-10 rounded-xl flex items-center justify-center"
        :class="isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'"
      >
        <Wrench
          class="w-5 h-5"
          :class="isDarkMode ? 'text-zinc-400' : 'text-zinc-600'"
        />
      </div>
      <div>
        <h2
          class="text-sm font-bold uppercase tracking-wider"
          :class="isDarkMode ? 'text-white' : 'text-slate-900'"
        >
          Global Settings
        </h2>
        <p
          class="text-[10px] mt-0.5"
          :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-400'"
        >
          Configure platform-wide operational parameters
        </p>
      </div>
    </div>

    <form
      @submit.prevent="superadminStore.updateGlobalSettings"
      class="space-y-6 max-w-2xl"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Maintenance Mode -->
        <div>
          <label
            class="text-[10px] font-black uppercase flex items-center gap-1.5 mb-2"
            :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-500'"
          >
            <AlertTriangle class="w-3 h-3" />
            Maintenance Mode
          </label>
          <select
            v-model="superadminStore.globalSettings.maintenanceMode"
            class="w-full px-4 py-2.5 border rounded-xl font-bold text-xs outline-none transition-colors duration-300"
            :class="
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
            "
          >
            <option :value="false">Operational (Live Systems)</option>
            <option :value="true">Maintenance Mode Enabled</option>
          </select>
          <p
            class="text-[10px] mt-1.5"
            :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
          >
            When enabled, all non-admin access will be restricted
          </p>
        </div>

        <!-- Base Fee Rule -->
        <div>
          <label
            class="text-[10px] font-black uppercase flex items-center gap-1.5 mb-2"
            :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-500'"
          >
            <Globe class="w-3 h-3" />
            Base Fee Rule
          </label>
          <input
            v-model="superadminStore.globalSettings.globalRateFormula"
            type="text"
            placeholder="e.g., base + (hours * rate)"
            class="w-full px-4 py-2.5 border rounded-xl font-semibold text-xs outline-none transition-colors duration-300"
            :class="
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
            "
          />
          <p
            class="text-[10px] mt-1.5"
            :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
          >
            Formula used to calculate parking fees across all partners
          </p>
        </div>
      </div>

      <!-- SMS Gateway -->
      <div>
        <label
          class="text-[10px] font-black uppercase flex items-center gap-1.5 mb-2"
          :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-500'"
        >
          <MessageSquare class="w-3 h-3" />
          SMS Gateway API URL
        </label>
        <input
          v-model="superadminStore.globalSettings.smsGatewayUrl"
          type="text"
          placeholder="https://api.sms-provider.com/v1/send"
          class="w-full px-4 py-2.5 border rounded-xl font-semibold text-xs outline-none transition-colors duration-300"
          :class="
            isDarkMode
              ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
          "
        />
        <p
          class="text-[10px] mt-1.5"
          :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
        >
          Endpoint for dispatching SMS notifications to users
        </p>
      </div>

      <div
        class="pt-4 border-t flex justify-end transition-colors duration-300"
        :class="isDarkMode ? 'border-zinc-800' : 'border-slate-150'"
      >
        <button
          type="submit"
          :disabled="superadminStore.isLoading"
          class="px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-300"
          :class="
            isDarkMode
              ? 'bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-50'
              : 'bg-zinc-900 text-white hover:bg-black disabled:opacity-50'
          "
        >
          <Loader2
            v-if="superadminStore.isLoading"
            class="w-4 h-4 animate-spin"
          />
          <Save v-else class="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </form>
  </div>
</template>
