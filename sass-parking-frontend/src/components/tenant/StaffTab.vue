<script setup lang="ts">
import { ref } from 'vue';
import { useTenantStore } from '../../stores/tenant';
import { Users, UserPlus, Save, RefreshCcw, Pencil, Trash2, X, AlertTriangle } from 'lucide-vue-next';

const store = useTenantStore();

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
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Staff Management</h2>
        <p class="text-slate-500 text-sm mt-1">Manage gate operators for your parking facility.</p>
      </div>
      <button @click="showCreateForm = !showCreateForm"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors self-start sm:self-auto">
        <UserPlus class="w-4 h-4" /> Add Operator
      </button>
    </div>

    <!-- Create Form -->
    <Transition name="slide-down">
      <div v-if="showCreateForm" class="bg-white border border-blue-200 rounded-xl p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <UserPlus class="w-4 h-4 text-blue-600" />
            <h3 class="font-bold text-slate-900">New Operator Account</h3>
          </div>
          <button @click="showCreateForm = false" class="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
            <input v-model="createForm.name" type="text" placeholder="Jane Doe"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
            <input v-model="createForm.email" type="email" placeholder="jane@facility.com"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Password</label>
            <input v-model="createForm.password" type="password" placeholder="••••••••"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Gate Assignment</label>
            <select v-model="createForm.gate_assignment"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="ENTRY">Entry Only</option>
              <option value="EXIT">Exit Only</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Ticket Prefix <span class="text-slate-300 font-normal normal-case">(optional)</span></label>
            <input v-model="createForm.ticket_prefix" type="text" placeholder="e.g. P-T-R-2APW"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-1" />
            <p class="text-[10px] text-slate-400">If blank, a prefix like P-T-R-XXXX is auto-generated.</p>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button @click="handleCreate" :disabled="store.isLoading"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Save class="w-4 h-4" /> Create Operator
          </button>
          <button @click="showCreateForm = false" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </Transition>

    <!-- Staff Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Users class="w-4 h-4 text-blue-600" />
          <span class="font-bold text-slate-900 text-sm">Gate Operators</span>
        </div>
        <span class="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
          {{ store.staffList.length }} total
        </span>
      </div>

      <div v-if="store.isLoading" class="py-12 text-center text-slate-400">
        <RefreshCcw class="w-5 h-5 animate-spin inline-block mr-2" /> Loading staff…
      </div>

      <div v-else-if="store.staffList.length === 0" class="py-14 text-center">
        <Users class="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p class="text-slate-500 font-semibold">No operators yet</p>
        <p class="text-slate-400 text-sm mt-1">Click "Add Operator" above to create the first gate staff account.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left min-w-[700px]">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operator</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gate Assignment</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prefix</th>
              <th class="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="staff in store.staffList" :key="staff._id" class="hover:bg-slate-50/50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm shadow-blue-300/50">
                    {{ staff.name?.charAt(0)?.toUpperCase() || '?' }}
                  </div>
                  <span class="font-semibold text-sm text-slate-900">{{ staff.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-500">{{ staff.email }}</td>
              <td class="px-6 py-4">
                <span class="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold uppercase">
                  {{ staff.role || 'GATE_STAFF' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="flex items-center gap-1.5 text-green-600 text-xs font-bold w-max">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active
                </span>
              </td>
              <td class="px-6 py-4 text-sm font-medium text-slate-700">
                {{ staff.gate_assignment || 'BOTH' }}
              </td>
              <td class="px-6 py-4 text-sm text-slate-500">
                {{ staff.ticket_prefix || '-' }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="openEdit(staff)"
                    class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors">
                    <Pencil class="w-3.5 h-3.5" /> Edit
                  </button>
                  <button @click="confirmDeleteStaff = { _id: staff._id, name: staff.name }"
                    class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
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
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Pencil class="w-4 h-4" />
              </div>
              <div>
                <h3 class="font-bold text-slate-900">Edit Operator</h3>
                <p class="text-xs text-slate-400 mt-0.5">Update {{ editingStaff.name }}'s details</p>
              </div>
            </div>
            <button @click="editingStaff = null" class="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Fields -->
          <div class="space-y-4">
            <div>
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name</label>
              <input v-model="editForm.name" type="text"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email Address</label>
              <input v-model="editForm.email" type="email"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">New Password <span class="text-slate-300 font-normal normal-case">(leave blank to keep current)</span></label>
              <input v-model="editForm.password" type="password" placeholder="••••••••"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Gate Assignment</label>
                <select v-model="editForm.gate_assignment"
                  class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                  <option value="ENTRY">Entry Only</option>
                  <option value="EXIT">Exit Only</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Ticket Prefix <span class="text-slate-300 font-normal normal-case">(optional)</span></label>
                <input v-model="editForm.ticket_prefix" type="text" placeholder="e.g. P-T-R-2APW"
                  class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow mb-1" />
                <p class="text-[10px] text-slate-400">If blank, a prefix like P-T-R-XXXX is auto-generated.</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-1">
            <button @click="handleUpdate" :disabled="store.isLoading"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Save class="w-4 h-4" /> Save Changes
            </button>
            <button @click="editingStaff = null" class="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
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
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 text-center">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle class="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-lg">Remove Operator?</h3>
            <p class="text-slate-500 text-sm mt-2">
              <span class="font-semibold text-slate-700">{{ confirmDeleteStaff.name }}</span> will permanently lose access to the system. This cannot be undone.
            </p>
          </div>
          <div class="flex gap-3">
            <button @click="confirmDeleteStaff = null" class="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
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
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
