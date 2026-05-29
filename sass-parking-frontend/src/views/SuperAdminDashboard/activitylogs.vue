<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import { Activity, Clock, User, Target, Filter, RefreshCcw, Info } from "lucide-vue-next";

const store = useSuperadminStore();

const isDark = ref(document.documentElement.classList.contains("dark"));
let observer: MutationObserver | null = null;
onMounted(() => {
  observer = new MutationObserver(() => { isDark.value = document.documentElement.classList.contains("dark"); });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
});
onUnmounted(() => observer?.disconnect());

const actionStyle = (action: string) => {
  const a = (action || "").toUpperCase();
  if (a.includes("CREATE")) return isDark.value ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" : "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (a.includes("UPDATE")) return isDark.value ? "bg-blue-950/30 text-blue-400 border-blue-900/50" : "bg-blue-50 text-blue-700 border-blue-200";
  if (a.includes("DELETE")) return isDark.value ? "bg-red-950/30 text-red-400 border-red-900/50" : "bg-red-50 text-red-700 border-red-200";
  if (a.includes("LOGIN"))  return isDark.value ? "bg-violet-950/30 text-violet-400 border-violet-900/50" : "bg-violet-50 text-violet-700 border-violet-200";
  if (a.includes("SUSPEND"))return isDark.value ? "bg-amber-950/30 text-amber-400 border-amber-900/50" : "bg-amber-50 text-amber-700 border-amber-200";
  return isDark.value ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-200";
};
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors"
          :class="isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-600'">
          <Activity class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-sm font-bold uppercase tracking-wider" :class="isDark ? 'text-white' : 'text-slate-900'">Platform Audit Trail</h2>
          <p class="text-[10px] mt-0.5" :class="isDark ? 'text-zinc-500' : 'text-slate-500'">Comprehensive log of critical system operations</p>
        </div>
      </div>
      <button @click="store.fetchAuditLogs()" class="flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold uppercase tracking-wide transition-colors"
        :class="isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'">
        <RefreshCcw class="w-3.5 h-3.5" :class="store.isLoading ? 'animate-spin' : ''" /> Refresh
      </button>
    </div>

    <!-- Note -->
    <div class="p-4 rounded-xl border flex gap-3 transition-colors"
      :class="isDark ? 'bg-amber-950/20 border-amber-900/50 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-700'">
      <Info class="w-5 h-5 flex-shrink-0" />
      <div class="text-sm font-medium">
        Audit logs are scoped by Tenant. In the Super Admin view, these logs currently reflect activity from the first available active tenant for demonstration purposes.
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-2xl border overflow-hidden transition-colors"
      :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">
      <div v-if="store.isLoading && store.auditLogs.length === 0" class="py-12 flex items-center justify-center gap-2"
        :class="isDark ? 'text-zinc-500' : 'text-slate-400'">
        <RefreshCcw class="w-4 h-4 animate-spin" /> Loading logs…
      </div>
      <div v-else-if="store.auditLogs.length === 0" class="py-12 text-center text-sm" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">
        No audit logs recorded yet.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="text-[10px] font-bold uppercase tracking-wider border-b"
            :class="isDark ? 'bg-zinc-800/50 text-zinc-500 border-zinc-800' : 'bg-slate-50 text-slate-400 border-slate-200'">
            <tr>
              <th class="px-5 py-3">
                <div class="flex items-center gap-1.5"><Clock class="w-3 h-3" /> Timestamp</div>
              </th>
              <th class="px-5 py-3">
                <div class="flex items-center gap-1.5"><Filter class="w-3 h-3" /> Action</div>
              </th>
              <th class="px-5 py-3">
                <div class="flex items-center gap-1.5"><User class="w-3 h-3" /> Executed By</div>
              </th>
              <th class="px-5 py-3">
                <div class="flex items-center gap-1.5"><Target class="w-3 h-3" /> Target Ref</div>
              </th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y" :class="isDark ? 'divide-zinc-800' : 'divide-slate-100'">
            <tr v-for="log in store.auditLogs" :key="log._id" class="transition-colors"
              :class="isDark ? 'hover:bg-zinc-800/20' : 'hover:bg-slate-50/60'">
              <td class="px-5 py-3.5 font-mono text-[10px]" :class="isDark ? 'text-zinc-400' : 'text-slate-600'">
                {{ new Date(log.timestamp).toLocaleString('en-IN') }}
              </td>
              <td class="px-5 py-3.5">
                <span class="px-2 py-0.5 border rounded text-[9px] font-black uppercase" :class="actionStyle(log.action)">
                  {{ log.action }}
                </span>
              </td>
              <td class="px-5 py-3.5 font-bold" :class="isDark ? 'text-zinc-300' : 'text-slate-700'">
                <div class="flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                    :class="isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'">
                    {{ log.triggeredBy?.charAt(0)?.toUpperCase() || '?' }}
                  </div>
                  {{ log.triggeredBy || 'System' }}
                </div>
              </td>
              <td class="px-5 py-3.5 font-mono text-[10px]" :class="isDark ? 'text-zinc-500' : 'text-slate-500'">
                <code class="px-1.5 py-0.5 rounded border" :class="isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-200'">
                  {{ log.targetId || '—' }}
                </code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
