<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import {
  Building2, Search, Plus, Loader2, Mail, Phone,
  MapPin, Users, ParkingSquare, Trash2, RefreshCcw, X,
} from "lucide-vue-next";

const store = useSuperadminStore();

const isDark = ref(document.documentElement.classList.contains("dark"));
let observer: MutationObserver | null = null;
onMounted(() => {
  observer = new MutationObserver(() => { isDark.value = document.documentElement.classList.contains("dark"); });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
});
onUnmounted(() => observer?.disconnect());

const q             = ref("");
const statusFilter  = ref("ALL");
const showForm      = ref(false);
const deleteConfirm = ref<string | null>(null);

const form = reactive({
  companyName: "", ownerName: "", email: "",
  contactNumber: "", address: "",
  subscriptionPlan: "BASIC", maxStaffLimit: 5, maxSlotsLimit: 50,
});

const resetForm = () => {
  Object.assign(form, { companyName: "", ownerName: "", email: "", contactNumber: "", address: "", subscriptionPlan: "BASIC", maxStaffLimit: 5, maxSlotsLimit: 50 });
};

const handleCreate = async () => {
  const ok = await store.createTenant(form);
  if (ok) { showForm.value = false; resetForm(); }
};

const handleDelete = async (id: string) => {
  await store.deleteTenant(id);
  deleteConfirm.value = null;
};

const filtered = computed(() =>
  store.tenants.filter((t) => {
    const matchQ = !q.value ||
      (t.companyName || t.name || "").toLowerCase().includes(q.value.toLowerCase()) ||
      (t.email || t.corporate_email || "").toLowerCase().includes(q.value.toLowerCase());
    const matchS = statusFilter.value === "ALL" || t.status === statusFilter.value;
    return matchQ && matchS;
  })
);

const planStyle = (plan: string) => {
  const p = plan?.toUpperCase();
  if (p === "PREMIUM")    return isDark.value ? "bg-amber-950/30 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200";
  if (p === "ENTERPRISE") return isDark.value ? "bg-violet-950/30 text-violet-300 border-violet-800" : "bg-violet-50 text-violet-700 border-violet-200";
  return isDark.value ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-200";
};

const inputCls = computed(() =>
  `w-full px-3 py-2.5 border rounded-xl text-xs font-medium outline-none transition-colors ${
    isDark.value ? "bg-zinc-800 border-zinc-700 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
  }`
);
</script>

<template>
  <div class="space-y-4">
    <!-- Controls Bar -->
    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div class="flex flex-1 gap-2 w-full">
        <div class="relative flex-1">
          <Search class="w-4 h-4 absolute left-3 top-3" :class="isDark ? 'text-zinc-500' : 'text-slate-400'" />
          <input v-model="q" type="text" placeholder="Search tenants…"
            :class="`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:border-zinc-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'}`" />
        </div>
        <select v-model="statusFilter"
          :class="`px-3 py-2.5 border rounded-xl font-bold text-xs outline-none transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'}`">
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>
      <button @click="showForm = !showForm"
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap"
        :class="showForm
          ? (isDark ? 'bg-zinc-700 text-white' : 'bg-slate-200 text-slate-800')
          : 'bg-blue-600 hover:bg-blue-700 text-white'">
        <component :is="showForm ? X : Plus" class="w-4 h-4" />
        {{ showForm ? "Close" : "Add Tenant" }}
      </button>
    </div>

    <!-- Create Form -->
    <Transition name="slide">
      <div v-if="showForm" class="rounded-2xl border p-5 space-y-4 transition-colors"
        :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">
        <h3 class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">Register New Parking Partner</h3>
        <form @submit.prevent="handleCreate" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Company Name -->
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-zinc-500' : 'text-zinc-500'">Company Name *</label>
            <input v-model="form.companyName" required placeholder="e.g. Metropolis Parking" :class="inputCls" />
          </div>
          <!-- Owner -->
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-zinc-500' : 'text-zinc-500'">Owner Name</label>
            <div class="relative">
              <input v-model="form.ownerName" placeholder="Full name" :class="inputCls" />
            </div>
          </div>
          <!-- Email -->
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-zinc-500' : 'text-zinc-500'">Corporate Email *</label>
            <div class="relative">
              <Mail class="w-3.5 h-3.5 absolute left-3 top-3" :class="isDark ? 'text-zinc-600' : 'text-zinc-400'" />
              <input v-model="form.email" type="email" required placeholder="admin@company.com"
                :class="`${inputCls} pl-9`" />
            </div>
          </div>
          <!-- Phone -->
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-zinc-500' : 'text-zinc-500'">Contact Phone</label>
            <div class="relative">
              <Phone class="w-3.5 h-3.5 absolute left-3 top-3" :class="isDark ? 'text-zinc-600' : 'text-zinc-400'" />
              <input v-model="form.contactNumber" placeholder="+977-98xxxxxxxx" :class="`${inputCls} pl-9`" />
            </div>
          </div>
          <!-- Address -->
          <div class="sm:col-span-2">
            <label class="block text-[10px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-zinc-500' : 'text-zinc-500'">Address</label>
            <div class="relative">
              <MapPin class="w-3.5 h-3.5 absolute left-3 top-3" :class="isDark ? 'text-zinc-600' : 'text-zinc-400'" />
              <input v-model="form.address" placeholder="Kathmandu, Nepal" :class="`${inputCls} pl-9`" />
            </div>
          </div>
          <!-- Plan -->
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-zinc-500' : 'text-zinc-500'">Subscription Plan</label>
            <select v-model="form.subscriptionPlan" :class="inputCls">
              <option value="BASIC">Basic — Rs. 12,500/mo</option>
              <option value="PREMIUM">Premium — Rs. 35,000/mo</option>
              <option value="ENTERPRISE">Enterprise — Rs. 85,000/mo</option>
            </select>
          </div>
          <!-- Limits -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-zinc-500' : 'text-zinc-500'">
                <Users class="w-3 h-3 inline mr-0.5" /> Max Staff
              </label>
              <input v-model.number="form.maxStaffLimit" type="number" min="1" :class="inputCls" />
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-wider mb-1" :class="isDark ? 'text-zinc-500' : 'text-zinc-500'">
                <ParkingSquare class="w-3 h-3 inline mr-0.5" /> Max Slots
              </label>
              <input v-model.number="form.maxSlotsLimit" type="number" min="1" :class="inputCls" />
            </div>
          </div>
          <!-- Submit -->
          <div class="sm:col-span-2 pt-1">
            <button type="submit" :disabled="store.isLoading"
              class="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
              <Loader2 v-if="store.isLoading" class="w-4 h-4 animate-spin" />
              {{ store.isLoading ? 'Creating…' : 'Create & Deploy Partner' }}
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <!-- Stats Row -->
    <div class="grid grid-cols-3 gap-3">
      <div v-for="stat in [
          { label: 'Total', value: store.tenants.length, color: 'text-slate-900' },
          { label: 'Active', value: store.tenants.filter(t => t.status === 'ACTIVE').length, color: 'text-emerald-600' },
          { label: 'Suspended', value: store.tenants.filter(t => t.status !== 'ACTIVE').length, color: 'text-amber-500' },
        ]" :key="stat.label"
        class="rounded-xl border p-3 text-center transition-colors"
        :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'">
        <p class="text-xl font-black" :class="isDark ? 'text-white' : stat.color">{{ stat.value }}</p>
        <p class="text-[10px] font-bold uppercase tracking-wider mt-0.5" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">{{ stat.label }}</p>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-2xl border overflow-hidden transition-colors"
      :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">
      <div v-if="store.isLoading && store.tenants.length === 0" class="py-12 flex items-center justify-center gap-2"
        :class="isDark ? 'text-zinc-500' : 'text-slate-400'">
        <RefreshCcw class="w-4 h-4 animate-spin" /> Loading…
      </div>
      <div v-else-if="filtered.length === 0" class="py-12 text-center text-sm" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">
        No tenants match your filter.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="text-[10px] font-bold uppercase tracking-wider border-b"
            :class="isDark ? 'bg-zinc-800/50 text-zinc-500 border-zinc-800' : 'bg-slate-50 text-slate-400 border-slate-200'">
            <tr>
              <th class="px-5 py-3">Partner</th>
              <th class="px-5 py-3">Plan</th>
              <th class="px-5 py-3">Limits</th>
              <th class="px-5 py-3">Created</th>
              <th class="px-5 py-3">Status</th>
              <th class="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y" :class="isDark ? 'divide-zinc-800' : 'divide-slate-100'">
            <tr v-for="t in filtered" :key="t._id" class="group transition-colors"
              :class="isDark ? 'hover:bg-zinc-800/20' : 'hover:bg-slate-50/60'">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                    :class="isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'">
                    <Building2 class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ t.companyName || t.name }}</p>
                    <p class="text-[10px] mt-0.5" :class="isDark ? 'text-zinc-500' : 'text-zinc-400'">{{ t.email || t.corporate_email || '—' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <span class="px-2 py-0.5 border rounded text-[9px] font-black uppercase" :class="planStyle(t.subscriptionPlan)">
                  {{ t.subscriptionPlan || 'BASIC' }}
                </span>
              </td>
              <td class="px-5 py-3.5" :class="isDark ? 'text-zinc-400' : 'text-zinc-600'">
                <div class="flex items-center gap-2">
                  <span class="flex items-center gap-1"><Users class="w-3 h-3" /> {{ t.maxStaffLimit }}</span>
                  <span class="text-zinc-300 dark:text-zinc-700">/</span>
                  <span class="flex items-center gap-1"><ParkingSquare class="w-3 h-3" /> {{ t.maxSlotsLimit }}</span>
                </div>
              </td>
              <td class="px-5 py-3.5 font-mono text-[10px]" :class="isDark ? 'text-zinc-500' : 'text-zinc-400'">
                {{ t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : '—' }}
              </td>
              <td class="px-5 py-3.5">
                <span class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide w-max"
                  :class="t.status === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="t.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-400'"></span>
                  {{ t.status || 'ACTIVE' }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-center gap-2">
                  <button @click="store.updateTenantStatus(t._id, t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')"
                    class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all"
                    :class="t.status === 'ACTIVE'
                      ? (isDark ? 'border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400' : 'border-zinc-200 text-zinc-500 hover:border-red-200 hover:text-red-500')
                      : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'">
                    {{ t.status === 'ACTIVE' ? 'Suspend' : 'Activate' }}
                  </button>
                  <button @click="deleteConfirm = t._id"
                    class="p-1.5 rounded-lg border transition-all opacity-0 group-hover:opacity-100"
                    :class="isDark ? 'border-zinc-700 text-zinc-500 hover:border-red-800 hover:text-red-400' : 'border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500'">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <Transition name="fade">
      <div v-if="deleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div class="w-full max-w-sm rounded-2xl border p-6 space-y-4 shadow-2xl"
          :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'">
          <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <Trash2 class="w-5 h-5 text-red-500" />
          </div>
          <div class="text-center">
            <h3 class="font-bold text-sm" :class="isDark ? 'text-white' : 'text-slate-900'">Delete Tenant?</h3>
            <p class="text-xs mt-1" :class="isDark ? 'text-zinc-400' : 'text-slate-500'">
              This action is permanent and cannot be undone. All associated data will be deleted.
            </p>
          </div>
          <div class="flex gap-2">
            <button @click="deleteConfirm = null" class="flex-1 py-2.5 border rounded-xl text-xs font-bold transition-colors"
              :class="isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'">Cancel</button>
            <button @click="handleDelete(deleteConfirm!)" :disabled="store.isLoading"
              class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
              <Loader2 v-if="store.isLoading" class="w-3.5 h-3.5 animate-spin" />
              {{ store.isLoading ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
