<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import { Activity, Clock, User, Target, Filter } from "lucide-vue-next";

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

// Action type color mapping
const getActionColor = (action: string) => {
  const colors: Record<
    string,
    {
      bg: string;
      text: string;
      border: string;
      darkBg: string;
      darkText: string;
      darkBorder: string;
    }
  > = {
    CREATE: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      darkBg: "bg-emerald-950/30",
      darkText: "text-emerald-400",
      darkBorder: "border-emerald-900/50",
    },
    UPDATE: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      darkBg: "bg-blue-950/30",
      darkText: "text-blue-400",
      darkBorder: "border-blue-900/50",
    },
    DELETE: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      darkBg: "bg-red-950/30",
      darkText: "text-red-400",
      darkBorder: "border-red-900/50",
    },
    LOGIN: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-200",
      darkBg: "bg-violet-950/30",
      darkText: "text-violet-400",
      darkBorder: "border-violet-900/50",
    },
    SUSPEND: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      darkBg: "bg-amber-950/30",
      darkText: "text-amber-400",
      darkBorder: "border-amber-900/50",
    },
    ACTIVATE: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      darkBg: "bg-emerald-950/30",
      darkText: "text-emerald-400",
      darkBorder: "border-emerald-900/50",
    },
  };
  return (
    colors[action?.toUpperCase()] || {
      bg: "bg-zinc-100",
      text: "text-zinc-700",
      border: "border-zinc-200",
      darkBg: "bg-zinc-800",
      darkText: "text-zinc-300",
      darkBorder: "border-zinc-700",
    }
  );
};
</script>

<template>
  <div
    class="rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300"
    :class="
      isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
    "
  >
    <!-- Header -->
    <div
      class="p-6 border-b flex justify-between items-center transition-colors duration-300"
      :class="
        isDarkMode
          ? 'bg-zinc-800/50 border-zinc-800'
          : 'bg-slate-50 border-slate-200'
      "
    >
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center"
          :class="isDarkMode ? 'bg-zinc-800' : 'bg-white'"
        >
          <Activity
            class="w-4 h-4"
            :class="isDarkMode ? 'text-zinc-400' : 'text-zinc-600'"
          />
        </div>
        <div>
          <h2
            class="text-xs font-black uppercase tracking-widest"
            :class="isDarkMode ? 'text-white' : 'text-zinc-950'"
          >
            Activity Log
          </h2>
          <p
            class="text-[10px] mt-0.5"
            :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-400'"
          >
            Real-time audit trail of platform events
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span
          class="text-[10px] font-bold uppercase"
          :class="isDarkMode ? 'text-zinc-400' : 'text-zinc-400'"
        >
          Live Tracking Active
        </span>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr
            class="text-xs font-bold border-b uppercase tracking-wider transition-colors duration-300"
            :class="
              isDarkMode
                ? 'bg-zinc-800/50 text-zinc-400 border-zinc-800'
                : 'bg-slate-50 text-zinc-400 border-zinc-200'
            "
          >
            <th class="px-6 py-4">
              <div class="flex items-center gap-1.5">
                <Clock class="w-3 h-3" />
                Date & Time
              </div>
            </th>
            <th class="px-6 py-4">
              <div class="flex items-center gap-1.5">
                <Filter class="w-3 h-3" />
                Action
              </div>
            </th>
            <th class="px-6 py-4">
              <div class="flex items-center gap-1.5">
                <User class="w-3 h-3" />
                Done By
              </div>
            </th>
            <th class="px-6 py-4">
              <div class="flex items-center gap-1.5">
                <Target class="w-3 h-3" />
                Affected Item ID
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="font-semibold text-xs">
          <tr
            v-for="log in superadminStore.auditLogs"
            :key="log._id"
            class="border-b transition-colors duration-200"
            :class="[
              isDarkMode
                ? 'border-zinc-850 hover:bg-zinc-800/20 text-zinc-300'
                : 'border-slate-100 hover:bg-slate-50/40 text-zinc-700',
            ]"
          >
            <td
              class="px-6 py-4 font-mono text-[10px]"
              :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-400'"
            >
              <div class="flex items-center gap-2">
                <span
                  class="w-1 h-1 rounded-full"
                  :class="
                    getActionColor(log.action)
                      .darkBg.replace('bg-', 'bg-')
                      .replace('/30', '')
                  "
                ></span>
                {{ new Date(log.timestamp).toLocaleString() }}
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                class="px-2.5 py-0.5 rounded text-[9px] font-black uppercase border transition-colors duration-300"
                :class="[
                  isDarkMode
                    ? [
                        getActionColor(log.action).darkBg,
                        getActionColor(log.action).darkText,
                        getActionColor(log.action).darkBorder,
                      ]
                    : [
                        getActionColor(log.action).bg,
                        getActionColor(log.action).text,
                        getActionColor(log.action).border,
                      ],
                ]"
              >
                {{ log.action }}
              </span>
            </td>
            <td
              class="px-6 py-4"
              :class="isDarkMode ? 'text-zinc-300' : 'text-zinc-600'"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black"
                  :class="
                    isDarkMode
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-zinc-100 text-zinc-500'
                  "
                >
                  {{ log.triggeredBy?.charAt(0)?.toUpperCase() || "?" }}
                </div>
                {{ log.triggeredBy }}
              </div>
            </td>
            <td
              class="px-6 py-4 font-mono text-[10px]"
              :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-400'"
            >
              <code
                class="px-1.5 py-0.5 rounded text-[9px]"
                :class="isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'"
              >
                {{ log.targetId }}
              </code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
