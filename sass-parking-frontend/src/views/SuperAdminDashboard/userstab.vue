<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import { Search, Plus, Key, User, Mail, Shield, Building2, ShieldCheck, RefreshCcw, X } from "lucide-vue-next";

const store = useSuperadminStore();

const isDark = ref(document.documentElement.classList.contains("dark"));
let observer: MutationObserver | null = null;
onMounted(() => {
  observer = new MutationObserver(() => { isDark.value = document.documentElement.classList.contains("dark"); });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  store.fetchGlobalUsers();
});
onUnmounted(() => observer?.disconnect());

const q          = ref("");
const roleFilter = ref("ALL");

const filteredUsers = computed(() =>
  store.globalUsers.filter((u) => {
    const matchQ = !q.value ||
      (u.name || "").toLowerCase().includes(q.value.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(q.value.toLowerCase());
    const matchR = roleFilter.value === "ALL" || u.role === roleFilter.value;
    return matchQ && matchR;
  })
);

const roleStyle = (role: string) => {
  if (role === "TENANT_OWNER") return isDark.value ? "bg-violet-950/30 text-violet-300 border-violet-800" : "bg-violet-50 text-violet-700 border-violet-200";
  if (role === "SUPER_ADMIN")  return isDark.value ? "bg-blue-950/30 text-blue-300 border-blue-800" : "bg-blue-50 text-blue-700 border-blue-200";
  return isDark.value ? "bg-emerald-950/30 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200";
};

const roleLabel = (role: string) => {
  if (role === "TENANT_OWNER") return "Tenant Owner";
  if (role === "SUPER_ADMIN")  return "Super Admin";
  return "Staff Operator";
};
</script>

<template>
  <div class="space-y-4">
    <!-- Controls Bar -->
    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div class="flex flex-1 gap-2 w-full">
        <div class="relative flex-1">
          <Search class="w-4 h-4 absolute left-3 top-3" :class="isDark ? 'text-zinc-500' : 'text-slate-400'" />
          <input v-model="q" type="text" placeholder="Search profiles by name or email…"
            :class="`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:border-zinc-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'}`" />
        </div>
        <select v-model="roleFilter"
          :class="`px-3 py-2.5 border rounded-xl font-bold text-xs outline-none transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'}`">
          <option value="ALL">All Roles</option>
          <option value="TENANT_OWNER">Tenant Owner</option>
          <option value="GATE_STAFF">Staff Operator</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>
      <button @click="store.fetchGlobalUsers()" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap border"
        :class="isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'">
        <RefreshCcw class="w-4 h-4" :class="store.isLoading ? 'animate-spin' : ''" /> Refresh
      </button>
    </div>

    <div class="p-4 rounded-xl border flex gap-3 transition-colors"
      :class="isDark ? 'bg-blue-950/20 border-blue-900/50 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700'">
      <ShieldCheck class="w-5 h-5 flex-shrink-0" />
      <div class="text-sm font-medium">
        Users are managed by their respective Tenant Owners. This directory provides a global view of all staff and owners across the platform. Super Admin capabilities include viewing access and audit trails.
      </div>
    </div>

    <!-- Users Table -->
    <div class="rounded-2xl border overflow-hidden transition-colors"
      :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">
      <div v-if="store.isLoading && store.globalUsers.length === 0" class="py-12 flex items-center justify-center gap-2"
        :class="isDark ? 'text-zinc-500' : 'text-slate-400'">
        <RefreshCcw class="w-4 h-4 animate-spin" /> Loading global directory…
      </div>
      <div v-else-if="filteredUsers.length === 0" class="py-12 text-center text-sm" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">
        No users match your filters.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="text-[10px] font-bold uppercase tracking-wider border-b"
            :class="isDark ? 'bg-zinc-800/50 text-zinc-500 border-zinc-800' : 'bg-slate-50 text-slate-400 border-slate-200'">
            <tr>
              <th class="px-5 py-3">User Details</th>
              <th class="px-5 py-3">Role</th>
              <th class="px-5 py-3">Tenant Association</th>
              <th class="px-5 py-3">Identifiers</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y" :class="isDark ? 'divide-zinc-800' : 'divide-slate-100'">
            <tr v-for="u in filteredUsers" :key="u._id" class="group transition-colors"
              :class="isDark ? 'hover:bg-zinc-800/20' : 'hover:bg-slate-50/60'">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                    :class="isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'">
                    {{ u.name?.charAt(0)?.toUpperCase() || '?' }}
                  </div>
                  <div>
                    <p class="font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ u.name }}</p>
                    <p class="text-[10px] mt-0.5" :class="isDark ? 'text-zinc-500' : 'text-slate-500'">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <span class="px-2 py-0.5 border rounded text-[9px] font-black uppercase" :class="roleStyle(u.role)">
                  {{ roleLabel(u.role) }}
                </span>
              </td>
              <td class="px-5 py-3.5 font-bold" :class="isDark ? 'text-zinc-300' : 'text-slate-700'">
                <div v-if="u.tenantName" class="flex items-center gap-1.5">
                  <Building2 class="w-3.5 h-3.5" :class="isDark ? 'text-zinc-500' : 'text-zinc-400'" />
                  {{ u.tenantName }}
                </div>
                <div v-else class="text-[10px] font-medium opacity-50">Global / System</div>
              </td>
              <td class="px-5 py-3.5 font-mono text-[10px]" :class="isDark ? 'text-zinc-500' : 'text-slate-500'">
                <div v-if="u.gate_assignment" class="flex items-center gap-1.5 px-2 py-1 border rounded w-max"
                  :class="isDark ? 'border-zinc-800 bg-zinc-800/50' : 'border-slate-200 bg-slate-50'">
                  Gate: {{ u.gate_assignment }}
                </div>
                <div v-if="u.ticket_prefix" class="flex items-center gap-1.5 px-2 py-1 border rounded w-max mt-1"
                  :class="isDark ? 'border-zinc-800 bg-zinc-800/50' : 'border-slate-200 bg-slate-50'">
                  Prefix: {{ u.ticket_prefix }}
                </div>
                <div v-if="!u.gate_assignment && !u.ticket_prefix">—</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
