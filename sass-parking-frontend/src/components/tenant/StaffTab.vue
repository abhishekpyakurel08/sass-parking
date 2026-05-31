<script setup lang="ts">
import { ref } from 'vue';
import { useTenantStore } from '../../stores/tenant';
import { Users, UserPlus, Save, RefreshCcw, Pencil, Trash2, X, AlertTriangle } from 'lucide-vue-next';

const store = useTenantStore();

// Tooltip state
const staffTooltip = ref<{ x: number; y: number; staff: any } | null>(null);

// ─── Create Form ───────────────────────────────────────────────────────────
const showCreateForm = ref(false);
const createForm = ref({ name: '', email: '', password: '', gate_assignment: 'BOTH', ticket_prefix: '' });

const handleCreate = async () => {
  const ok = await store.createStaff(createForm.value);
  if (ok) {
    showCreateForm.value = false;
    createForm.value = { name: '', email: '', password: '', gate_assignment: 'BOTH', ticket_prefix: '' };
  }
};

// ─── Edit Modal ────────────────────────────────────────────────────────────
const editingStaff = ref<null | { _id: string; name: string; email: string }>(null);
const editForm = ref({ name: '', email: '', password: '', gate_assignment: 'BOTH', ticket_prefix: '' });

const openEdit = (staff: any) => {
  editingStaff.value = staff;
  editForm.value = { name: staff.name, email: staff.email, password: '', gate_assignment: staff.gate_assignment || 'BOTH', ticket_prefix: staff.ticket_prefix || '' };
};

const handleUpdate = async () => {
  if (!editingStaff.value) return;
  const payload: Record<string, string> = {};
  if (editForm.value.name) payload.name = editForm.value.name;
  if (editForm.value.email) payload.email = editForm.value.email;
  if (editForm.value.password) payload.password = editForm.value.password;
  payload.gate_assignment = editForm.value.gate_assignment;
  payload.ticket_prefix = editForm.value.ticket_prefix;
  const ok = await store.updateStaff(editingStaff.value._id, payload);
  if (ok) editingStaff.value = null;
};

// ─── Delete Confirm ────────────────────────────────────────────────────────
const confirmDeleteStaff = ref<null | { _id: string; name: string }>(null);

const handleDelete = async () => {
  if (!confirmDeleteStaff.value) return;
  await store.deleteStaff(confirmDeleteStaff.value._id);
  confirmDeleteStaff.value = null;
};

// Hover event handlers
const handleStaffHover = (event: MouseEvent, staff: any) => {
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  staffTooltip.value = {
    x: rect.left + rect.width / 2,
    y: rect.top,
    staff
  };
};

const handleStaffLeave = () => {
  staffTooltip.value = null;
};
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Staff Management</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage gate operators for your parking facility.</p>
      </div>
      <button @click="showCreateForm = !showCreateForm"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors self-start sm:self-auto">
        <UserPlus class="w-4 h-4" /> Add Operator
      </button>
    </div>

    <!-- Create Form -->
    <Transition name="slide-down">
      <div v-if="showCreateForm" class="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <UserPlus class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 class="font-bold text-slate-900 dark:text-slate-100">New Operator Account</h3>
          </div>
          <button @click="showCreateForm = false" class="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Full Name</label>
            <input v-model="createForm.name" type="text" placeholder="Jane Doe"
              class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Email</label>
            <input v-model="createForm.email" type="email" placeholder="jane@facility.com"
              class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Password</label>
            <input v-model="createForm.password" type="password" placeholder="••••••••"
              class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Gate Assignment</label>
            <select v-model="createForm.gate_assignment"
              class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="ENTRY">Entry Only</option>
              <option value="EXIT">Exit Only</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Ticket Prefix <span class="text-slate-300 dark:text-slate-600 font-normal normal-case">(optional)</span></label>
            <input v-model="createForm.ticket_prefix" type="text" placeholder="e.g. P-T-R-2APW"
              class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none mb-1" />
            <p class="text-[10px] text-slate-400 dark:text-slate-500">If blank, a prefix like P-T-R-XXXX is auto-generated.</p>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button @click="handleCreate" :disabled="store.isLoading"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Save class="w-4 h-4" /> Create Operator
          </button>
          <button @click="showCreateForm = false" class="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </Transition>

    <!-- Staff Table -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Users class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span class="font-bold text-slate-900 dark:text-slate-100 text-sm">Gate Operators</span>
        </div>
        <span class="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
          {{ store.staffList.length }} total
        </span>
      </div>

      <div v-if="store.isLoading" class="py-12 text-center text-slate-400 dark:text-slate-500">
        <RefreshCcw class="w-5 h-5 animate-spin inline-block mr-2" /> Loading staff…
      </div>

      <div v-else-if="store.staffList.length === 0" class="py-14 text-center">
        <Users class="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
        <p class="text-slate-500 dark:text-slate-400 font-semibold">No operators yet</p>
        <p class="text-slate-400 dark:text-slate-500 text-sm mt-1">Click "Add Operator" above to create the first gate staff account.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left min-w-[700px]">
          <thead class="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
            <tr>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Operator</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gate Assignment</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prefix</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-700/50">
            <tr v-for="staff in store.staffList" :key="staff._id" class="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm group"
              @mouseenter="(e) => handleStaffHover(e, staff)"
              @mouseleave="handleStaffLeave">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm shadow-blue-300/50">
                    {{ staff.name?.charAt(0)?.toUpperCase() || '?' }}
                  </div>
                  <span class="font-semibold text-sm text-slate-900 dark:text-slate-100">{{ staff.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{{ staff.email }}</td>
              <td class="px-6 py-4">
                <span class="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded text-[10px] font-bold uppercase">
                  {{ staff.role || 'GATE_STAFF' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="flex items-center gap-1.5 text-green-600 dark:text-green-500 text-xs font-bold w-max">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active
                </span>
              </td>
              <td class="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                {{ staff.gate_assignment || 'BOTH' }}
              </td>
              <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                {{ staff.ticket_prefix || '-' }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="openEdit(staff)"
                    class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors">
                    <Pencil class="w-3.5 h-3.5" /> Edit
                  </button>
                  <button @click="confirmDeleteStaff = { _id: staff._id, name: staff.name }"
                    class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors">
                    <Trash2 class="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ── Edit Modal ──────────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="editingStaff" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="editingStaff = null"></div>
        <div class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-slate-200 dark:border-slate-700">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Pencil class="w-4 h-4" />
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-slate-100">Edit Operator</h3>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Update {{ editingStaff.name }}'s details</p>
              </div>
            </div>
            <button @click="editingStaff = null" class="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Fields -->
          <div class="space-y-5">
            <div class="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <label class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">Full Name</label>
              <input v-model="editForm.name" type="text"
                class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
            </div>
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 shadow-sm">
              <label class="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider mb-2 block">Email Address</label>
              <input v-model="editForm.email" type="email"
                class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
            </div>
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 shadow-sm">
              <label class="text-[10px] font-bold text-purple-400 dark:text-purple-500 uppercase tracking-wider mb-2 block">New Password <span class="text-purple-300 dark:text-purple-600 font-normal normal-case">(leave blank to keep current)</span></label>
              <input v-model="editForm.password" type="password" placeholder="••••••••"
                class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 shadow-sm">
                <label class="text-[10px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-wider mb-2 block">Gate Assignment</label>
                <select v-model="editForm.gate_assignment"
                  class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                  <option value="ENTRY">Entry Only</option>
                  <option value="EXIT">Exit Only</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <div class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 shadow-sm">
                <label class="text-[10px] font-bold text-amber-400 dark:text-amber-500 uppercase tracking-wider mb-2 block">Ticket Prefix <span class="text-amber-300 dark:text-amber-600 font-normal normal-case">(optional)</span></label>
                <input v-model="editForm.ticket_prefix" type="text" placeholder="e.g. P-T-R-2APW"
                  class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow mb-1" />
                <p class="text-[10px] text-amber-600 dark:text-amber-500">If blank, a prefix like P-T-R-XXXX is auto-generated.</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-1">
            <button @click="handleUpdate" :disabled="store.isLoading"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Save class="w-4 h-4" /> Save Changes
            </button>
            <button @click="editingStaff = null" class="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete Confirm Modal ────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="confirmDeleteStaff" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="confirmDeleteStaff = null"></div>
        <div class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 text-center border border-slate-200 dark:border-slate-700">
          <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <AlertTriangle class="w-6 h-6 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h3 class="font-bold text-slate-900 dark:text-slate-100 text-lg">Remove Operator?</h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm mt-2">
              <span class="font-semibold text-slate-700 dark:text-slate-300">{{ confirmDeleteStaff.name }}</span> will permanently lose access to the system. This cannot be undone.
            </p>
          </div>
          <div class="flex gap-3">
            <button @click="confirmDeleteStaff = null" class="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
              Cancel
            </button>
            <button @click="handleDelete" :disabled="store.isLoading"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
              <Trash2 class="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Staff Tooltip -->
  <teleport to="body">
    <transition name="tooltip-fade">
      <div v-if="staffTooltip"
        class="fixed z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-12px] border border-slate-700 min-w-[200px]"
        :style="{ left: staffTooltip.x + 'px', top: staffTooltip.y + 'px' }">
        <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
          <div class="w-2 h-2 rounded-full bg-green-500"></div>
          <div class="text-slate-400 text-[10px] uppercase tracking-wider">Active</div>
        </div>
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-400">Name:</span>
            <span class="font-bold">{{ staffTooltip.staff.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Role:</span>
            <span class="font-bold">{{ staffTooltip.staff.role || 'GATE_STAFF' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Gate:</span>
            <span class="font-bold text-blue-400">{{ staffTooltip.staff.gate_assignment || 'BOTH' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Prefix:</span>
            <span class="font-bold">{{ staffTooltip.staff.ticket_prefix || 'Auto' }}</span>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
