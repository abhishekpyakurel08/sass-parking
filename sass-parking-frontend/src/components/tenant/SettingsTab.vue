<script setup lang="ts">
import { ref } from 'vue';
import { useTenantStore } from '../../stores/tenant';
import { useAuthStore } from '../../stores/auth';
import {
  Building2, Save, Lock, ShieldCheck, CreditCard,
  Phone, MapPin, Mail, User, BadgeCheck, AlertTriangle,
} from 'lucide-vue-next';

const store = useTenantStore();
const authStore = useAuthStore();

const activeSection = ref<'profile' | 'subscription' | 'security'>('profile');

const sections = [
  { id: 'profile',      label: 'Company Profile',    icon: Building2 },
  { id: 'subscription', label: 'Subscription',       icon: CreditCard },
  { id: 'security',     label: 'Account Security',   icon: ShieldCheck },
] as const;
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">

    <!-- Page Header -->
    <div>
      <h2 class="text-2xl font-bold text-slate-900">Settings</h2>
      <p class="text-slate-500 text-sm mt-1">Manage your facility profile, billing, and security.</p>
    </div>

    <!-- Inner Sub-Nav -->
    <div class="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
      <button
        v-for="s in sections" :key="s.id"
        @click="activeSection = s.id"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
          activeSection === s.id
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <component :is="s.icon" class="w-4 h-4" />
        {{ s.label }}
      </button>
    </div>

    <!-- ── COMPANY PROFILE ─────────────────────────────────────────── -->
    <div v-if="activeSection === 'profile'" class="space-y-4">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div class="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building2 class="w-4 h-4" /></div>
          <div>
            <p class="font-bold text-slate-900 text-sm">Facility Details</p>
            <p class="text-xs text-slate-400">These details appear on printed tickets and receipts.</p>
          </div>
        </div>
        <div class="p-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

            <!-- Company Name -->
            <div>
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 class="w-3 h-3" /> Company Name
              </label>
              <input v-model="store.profile.companyName" type="text"
                placeholder="Metropolis Central Parking"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
            </div>

            <!-- Owner Name -->
            <div>
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User class="w-3 h-3" /> Owner / Manager Name
              </label>
              <input v-model="store.profile.ownerName" type="text"
                placeholder="John Doe"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
            </div>

            <!-- Phone -->
            <div>
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone class="w-3 h-3" /> Contact Number
              </label>
              <input v-model="store.profile.contactNumber" type="text"
                placeholder="+977-9800000000"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
            </div>

            <!-- Email — Read-only / Immutable -->
            <div>
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail class="w-3 h-3" /> Corporate Email
                <span class="ml-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-wider">Locked</span>
              </label>
              <input :value="store.profile.email" type="email" disabled
                class="w-full px-3 py-2.5 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
              <p class="text-[10px] text-slate-400 mt-1">Email is frozen after registration. Contact platform admin to change.</p>
            </div>

            <!-- Address -->
            <div class="md:col-span-2">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin class="w-3 h-3" /> Physical Address
              </label>
              <input v-model="store.profile.address" type="text"
                placeholder="452 Industrial Way, Sector 7, Kathmandu"
                class="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
            </div>

          </div>

          <!-- Save -->
          <div class="flex justify-end pt-3 border-t border-slate-100">
            <button @click="store.updateProfile()" :disabled="store.isLoading"
              class="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Save class="w-4 h-4" />
              {{ store.isLoading ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SUBSCRIPTION ────────────────────────────────────────────── -->
    <div v-else-if="activeSection === 'subscription'" class="space-y-4">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div class="p-2 bg-purple-50 text-purple-600 rounded-lg"><CreditCard class="w-4 h-4" /></div>
          <div>
            <p class="font-bold text-slate-900 text-sm">Subscription Plan</p>
            <p class="text-xs text-slate-400">Your current billing tier and account status.</p>
          </div>
        </div>

        <div class="p-6 space-y-5">
          <!-- Plan badges -->
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Plan</p>
              <div class="flex items-center gap-3">
                <BadgeCheck class="w-7 h-7 text-blue-600" />
                <span class="text-2xl font-black text-slate-900">{{ store.profile.subscriptionPlan || 'BASIC' }}</span>
              </div>
            </div>
            <div class="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Status</p>
              <div class="flex items-center gap-2 mt-1">
                <span :class="[
                  'w-2.5 h-2.5 rounded-full',
                  store.profile.subscriptionStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                ]" />
                <span :class="[
                  'text-2xl font-black',
                  store.profile.subscriptionStatus === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                ]">{{ store.profile.subscriptionStatus || 'ACTIVE' }}</span>
              </div>
            </div>
          </div>

          <!-- Read-only notice -->
          <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-bold text-amber-800">Plan changes require Platform Admin</p>
              <p class="text-xs text-amber-700 mt-0.5">
                Your <code class="bg-amber-100 px-1 rounded">subscriptionPlan</code> and
                <code class="bg-amber-100 px-1 rounded">subscriptionStatus</code> fields are
                immutable from this panel. They are managed exclusively by the Super Admin
                via the billing service. Contact your platform administrator to upgrade or downgrade.
              </p>
            </div>
          </div>

          <!-- Capacity -->
          <div class="border border-dashed border-slate-300 rounded-lg p-4 flex justify-between items-center">
            <div>
              <p class="text-sm font-bold text-slate-700">Total Parking Capacity</p>
              <p class="text-xs text-slate-400 mt-0.5">Set during tenant provisioning. Contact admin to adjust.</p>
            </div>
            <span class="text-2xl font-black text-slate-900">—</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── ACCOUNT SECURITY ────────────────────────────────────────── -->
    <div v-else-if="activeSection === 'security'" class="space-y-4">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div class="p-2 bg-green-50 text-green-600 rounded-lg"><ShieldCheck class="w-4 h-4" /></div>
          <div>
            <p class="font-bold text-slate-900 text-sm">Security Overview</p>
            <p class="text-xs text-slate-400">Your session and access information.</p>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <!-- Logged-in user removed -->

          <!-- Locked fields explanation -->
          <div>
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Server-Protected Fields</p>
            <div class="space-y-2">
              <div v-for="field in [
                { name: 'status',           reason: 'Only SUPER_ADMIN can suspend or activate a tenant account.' },
                { name: 'corporate_email',  reason: 'Account email is frozen at registration to prevent impersonation.' },
                { name: 'total_capacity',   reason: 'Physical capacity is set during provisioning and tied to billing.' },
              ]" :key="field.name"
                class="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <Lock class="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <code class="text-xs font-black text-slate-700">{{ field.name }}</code>
                  <p class="text-xs text-slate-500 mt-0.5">{{ field.reason }}</p>
                </div>
              </div>
            </div>
            <p class="text-xs text-slate-400 mt-3 leading-relaxed">
              Even if these fields are submitted in a request body, the backend controller
              silently deletes them before writing to the database — providing a
              defense-in-depth layer beyond validation.
            </p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
