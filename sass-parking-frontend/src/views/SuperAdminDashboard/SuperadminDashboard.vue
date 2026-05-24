<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import {
  Building2,
  Users,
  LogOut,
  Loader2,
  LayoutDashboard,
  ChevronRight,
  MapPin,
  Ticket,
  CheckCircle,
  BarChart3,
  ShieldAlert,
  Settings,
  Activity,
  UserCheck,
  CreditCard,
  Plus,
  Search,
  ShieldX,
  Key,
  Server,
} from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useSuperadminStore } from "../../stores/superadmin.ts";

const router = useRouter();
const superadminStore = useSuperadminStore();

// Filter Controls
const tenantSearch = ref("");
const tenantStatusFilter = ref("ALL");
const userSearch = ref("");
const userRoleFilter = ref("ALL");

// Expandable Action Drawers (UX Polished state)
const showTenantForm = ref(false);
const showUserForm = ref(false);
const showPlanForm = ref(false);

const newTenantForm = reactive({
  companyName: "",
  ownerName: "",
  email: "",
  contactNumber: "",
  address: "",
  subscriptionPlan: "BASIC",
  maxStaffLimit: 5,
  maxSlotsLimit: 50,
});

const newUserForm = reactive({
  name: "",
  email: "",
  password: "",
  role: "TENANT_OWNER",
  tenantId: "",
});

const newPlanForm = reactive({
  name: "",
  priceMonthly: 15000,
  maxStaff: 5,
  maxSlots: 100,
  features: "",
});

const handleLogout = () => {
  router.push("/");
};

const switchTab = (
  tab: "overview" | "tenants" | "users" | "plans" | "logs" | "settings",
) => {
  superadminStore.activeTab = tab;
  if (tab === "overview") superadminStore.fetchPlatformStats();
  if (tab === "tenants") superadminStore.fetchTenants();
  if (tab === "users") {
    superadminStore.fetchTenants();
    superadminStore.fetchGlobalUsers();
  }
  if (tab === "plans") superadminStore.fetchPricingPlans();
  if (tab === "logs") superadminStore.fetchAuditLogs();
  if (tab === "settings") superadminStore.fetchGlobalSettings();
};

// Action Handlers
const handleCreateTenant = async () => {
  const success = await superadminStore.createTenant(newTenantForm);
  if (success) {
    showTenantForm.value = false;
    Object.assign(newTenantForm, {
      companyName: "",
      ownerName: "",
      email: "",
      contactNumber: "",
      address: "",
      subscriptionPlan: "BASIC",
      maxStaffLimit: 5,
      maxSlotsLimit: 50,
    });
  }
};

const toggleStatus = async (tenantId: string, currentStatus: string) => {
  const targetStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  await superadminStore.updateTenantStatus(tenantId, targetStatus);
};

const handleCreateUser = async () => {
  const success = await superadminStore.createGlobalUser(newUserForm);
  if (success) {
    showUserForm.value = false;
    Object.assign(newUserForm, {
      name: "",
      email: "",
      password: "",
      role: "TENANT_OWNER",
      tenantId: "",
    });
  }
};

const handleCreatePlan = async () => {
  const success = await superadminStore.createPlan(newPlanForm);
  if (success) {
    showPlanForm.value = false;
    Object.assign(newPlanForm, {
      name: "",
      priceMonthly: 15000,
      maxStaff: 5,
      maxSlots: 100,
      features: "",
    });
  }
};

// In-Memory Search Computations
const filteredTenants = computed(() => {
  return superadminStore.tenants.filter((t) => {
    const matchesQuery =
      t.companyName.toLowerCase().includes(tenantSearch.value.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(tenantSearch.value.toLowerCase());
    const matchesStatus =
      tenantStatusFilter.value === "ALL" ||
      t.status === tenantStatusFilter.value;
    return matchesQuery && matchesStatus;
  });
});

const filteredUsers = computed(() => {
  return superadminStore.globalUsers.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(userSearch.value.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.value.toLowerCase());
    const matchesRole =
      userRoleFilter.value === "ALL" || u.role === userRoleFilter.value;
    return matchesQuery && matchesRole;
  });
});

onMounted(() => {
  superadminStore.fetchPlatformStats();
  superadminStore.fetchTenants();
});
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800"
  >
    <!-- Sidebar Menu Panel -->
    <aside
      class="w-72 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 z-20 shadow-2xl relative border-r border-slate-800"
    >
      <div
        class="absolute inset-0 bg-gradient-to-b from-purple-950/10 to-transparent pointer-events-none"
      ></div>

      <div class="p-6 pb-6 border-b border-white/5 relative z-10">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30"
          >
            <ShieldAlert class="text-white w-6 h-6" />
          </div>
          <span class="font-black text-xl tracking-tight text-white"
            >ParkSaaS<span class="text-purple-400">Core</span></span
          >
        </div>
        <p
          class="text-xs text-purple-400 mt-1.5 font-bold uppercase tracking-widest"
        >
          Platform Engine Authority
        </p>
      </div>

      <nav class="flex-1 p-4 space-y-1 relative z-10 overflow-y-auto">
        <p
          class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 pt-2 pb-1.5"
        >
          Administration Control
        </p>
        <button
          v-for="item in [
            {
              id: 'overview',
              icon: LayoutDashboard,
              label: 'Platform Metrics',
            },
            { id: 'tenants', icon: Building2, label: 'Tenant Directories' },
            { id: 'users', icon: Users, label: 'Cross-Tenant Users' },
            { id: 'plans', icon: CreditCard, label: 'Subscription Plans' },
            { id: 'logs', icon: Activity, label: 'System Audit Logs' },
            { id: 'settings', icon: Settings, label: 'Global Settings' },
          ]"
          :key="item.id"
          @click="switchTab(item.id as any)"
          :class="[
            'w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all outline-none duration-150',
            superadminStore.activeTab === item.id
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-slate-400 hover:bg-white/5 hover:text-white',
          ]"
        >
          <div class="flex items-center gap-3">
            <component :is="item.icon" class="w-5 h-5 animate-pulse-slow" />
            <span class="text-sm tracking-wide">{{ item.label }}</span>
          </div>
          <ChevronRight
            v-if="superadminStore.activeTab === item.id"
            class="w-4 h-4 opacity-70"
          />
        </button>
      </nav>

      <!-- User Logged Status Footer -->
      <div class="p-4 border-t border-white/5 relative z-10 space-y-2">
        <!-- <div
          class="flex items-center gap-2.5 px-4 py-3 bg-slate-950/40 rounded-xl border border-white/5"
        >
          <div
            class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"
          ></div>
          <p class="text-xs font-bold text-slate-300">Live Services Active</p>
        </div> -->
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl font-bold transition-colors duration-150 outline-none text-sm"
        >
          <LogOut class="w-5 h-5" /> Sign Out Authority
        </button>
      </div>
    </aside>

    <!-- Main Content Workspace -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden bg-[#f4f7f9]">
      <header
        class="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shrink-0 shadow-sm relative z-10"
      >
        <div>
          <h1
            class="text-2xl font-black text-slate-900 capitalize tracking-tight"
          >
            {{ superadminStore.activeTab.replace("-", " ") }}
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Multi-tenant routing database and security configurations
          </p>
        </div>
        <div class="flex items-center gap-4"></div>
      </header>

      <!-- Scrollable Central Grid -->
      <div class="flex-1 overflow-y-auto p-8 relative">
        <div class="max-w-5xl mx-auto space-y-6">
          <!-- ── PLATFORM METRICS TABS ── -->
          <div
            v-if="superadminStore.activeTab === 'overview'"
            class="space-y-6"
          >
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <!-- Total Tenants Card -->
              <div
                class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex justify-between items-start mb-4">
                  <div
                    class="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center"
                  >
                    <Building2 class="w-5 h-5 text-purple-600" />
                  </div>
                  <span
                    class="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100"
                    >Core</span
                  >
                </div>
                <p
                  class="text-slate-400 text-xs font-semibold uppercase tracking-wider"
                >
                  Active Tenants
                </p>
                <h3 class="text-3xl font-black text-slate-900 mt-1">
                  {{ superadminStore.stats?.activeTenants }}
                </h3>
              </div>

              <!-- Operational Users Card -->
              <div
                class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex justify-between items-start mb-4">
                  <div
                    class="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center"
                  >
                    <Users class="w-5 h-5 text-indigo-600" />
                  </div>
                  <span
                    class="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono"
                    >Live</span
                  >
                </div>
                <p
                  class="text-slate-400 text-xs font-semibold uppercase tracking-wider"
                >
                  Platform Users
                </p>
                <h3 class="text-3xl font-black text-slate-900 mt-1">
                  {{ superadminStore.stats?.totalUsers }}
                </h3>
              </div>

              <!-- MRR Analytics Card -->
              <div
                class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200"
              >
                <div class="flex justify-between items-start mb-4">
                  <div
                    class="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center"
                  >
                    <BarChart3 class="w-5 h-5 text-emerald-600" />
                  </div>
                  <span
                    class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100"
                    >SaaS</span
                  >
                </div>
                <p
                  class="text-slate-400 text-xs font-semibold uppercase tracking-wider"
                >
                  Gross MRR
                </p>
                <h3 class="text-3xl font-black text-slate-900 mt-1">
                  Rs.
                  {{
                    superadminStore.stats?.monthlyRecurringRevenue.toLocaleString(
                      "en-US",
                      { minimumFractionDigits: 2 },
                    )
                  }}
                </h3>
              </div>

              <!-- Database Logs Performance Card -->
              <div
                class="bg-gradient-to-br from-purple-600 to-indigo-800 rounded-2xl p-6 shadow-lg shadow-purple-600/20 text-white relative overflow-hidden"
              >
                <div
                  class="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                ></div>
                <div
                  class="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center mb-4 relative z-10"
                >
                  <Activity class="w-5 h-5 text-white animate-pulse" />
                </div>
                <p
                  class="text-purple-100 text-xs font-semibold uppercase tracking-wider relative z-10"
                >
                  Sessions Logged
                </p>
                <h3 class="text-3xl font-black relative z-10">
                  {{
                    superadminStore.stats?.totalSessionsLogged.toLocaleString()
                  }}
                </h3>
              </div>
            </div>

            <!-- Visual Charts Mock & Diagnostic Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <h4 class="font-bold text-slate-800 text-sm">
                  Subscription Tier Allocation
                </h4>
                <div class="space-y-3.5 pt-1">
                  <div
                    v-for="tier in superadminStore.stats?.tierDistribution"
                    :key="tier.name"
                    class="space-y-1"
                  >
                    <div
                      class="flex justify-between text-xs font-semibold text-slate-600"
                    >
                      <span>{{ tier.name }} Tiers</span>
                      <span
                        >{{ tier.count }} Tenants ({{ tier.percentage }}%)</span
                      >
                    </div>
                    <div
                      class="w-full bg-slate-100 h-2 rounded-full overflow-hidden"
                    >
                      <div
                        class="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        :style="{ width: `${tier.percentage}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <p class="text-xs text-slate-400 mt-1">
                    Status of global load-balancers and active APIs
                  </p>
                </div>
                <div class="grid grid-cols-3 gap-2 py-4">
                  <div
                    class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center"
                  >
                    <p class="text-[10px] font-bold text-slate-400 uppercase">
                      Database
                    </p>
                    <p
                      class="text-xs font-black text-emerald-600 mt-1 flex items-center justify-center gap-1"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      ></span>
                      99.98%
                    </p>
                  </div>
                  <div
                    class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center"
                  >
                    <p class="text-[10px] font-bold text-slate-400 uppercase">
                      Gateway API
                    </p>
                    <p
                      class="text-xs font-black text-emerald-600 mt-1 flex items-center justify-center gap-1"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      ></span>
                      0.12ms
                    </p>
                  </div>
                  <div
                    class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center"
                  >
                    <p class="text-[10px] font-bold text-slate-400 uppercase">
                      CPU Load
                    </p>
                    <p class="text-xs font-black text-indigo-600 mt-1">4.2%</p>
                  </div>
                </div>
                <div
                  class="text-[11px] font-medium text-slate-400 flex items-center justify-between border-t border-slate-100 pt-3"
                >
                  <span>Last Automated Backup</span>
                  <span class="font-mono">15 mins ago</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── TENANT DIRECTORIES ── -->
          <div v-if="superadminStore.activeTab === 'tenants'" class="space-y-4">
            <div
              class="flex flex-col md:flex-row gap-4 items-center justify-between"
            >
              <div class="flex flex-1 gap-3 w-full">
                <div class="relative flex-1">
                  <Search
                    class="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400"
                  />
                  <input
                    v-model="tenantSearch"
                    type="text"
                    placeholder="Search tenants by business/owner email..."
                    class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-medium"
                  />
                </div>
                <select
                  v-model="tenantStatusFilter"
                  class="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold outline-none focus:ring-4 focus:ring-purple-500/10 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
              <button
                @click="showTenantForm = !showTenantForm"
                class="w-full md:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 text-xs"
              >
                <Plus class="w-4 h-4" />
                {{ showTenantForm ? "Close Form" : "Deploy Tenant Instance" }}
              </button>
            </div>

            <!-- Slide down/collapsible Add Tenant Form -->
            <div
              v-if="showTenantForm"
              class="bg-white p-6 rounded-2xl border border-slate-200 shadow-md transition-all duration-300"
            >
              <h3 class="text-sm font-bold text-slate-900 mb-4">
                Provision New SaaS Parking Facility
              </h3>
              <form
                @submit.prevent="handleCreateTenant"
                class="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label class="text-xs font-semibold text-slate-700"
                    >Company Name</label
                  >
                  <input
                    v-model="newTenantForm.companyName"
                    type="text"
                    placeholder="e.g. Liberty Plaza parking"
                    required
                    class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-medium text-xs"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-700"
                    >Owner Full Name</label
                  >
                  <input
                    v-model="newTenantForm.ownerName"
                    type="text"
                    placeholder="e.g. Amal Perera"
                    required
                    class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-medium text-xs"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-700"
                    >Primary Contact Email</label
                  >
                  <input
                    v-model="newTenantForm.email"
                    type="email"
                    placeholder="owner@gmail.com"
                    required
                    class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-medium text-xs"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-700"
                    >Contact Number</label
                  >
                  <input
                    v-model="newTenantForm.contactNumber"
                    type="text"
                    placeholder="e.g. +94 77..."
                    required
                    class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-medium text-xs"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="text-xs font-semibold text-slate-700"
                    >Physical Address</label
                  >
                  <input
                    v-model="newTenantForm.address"
                    type="text"
                    placeholder="No. 12 Galle Road, Colombo 03"
                    required
                    class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-medium text-xs"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-700"
                    >Subscription Tier Plan</label
                  >
                  <select
                    v-model="newTenantForm.subscriptionPlan"
                    class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-semibold text-xs"
                  >
                    <option value="BASIC">Basic Parking Module</option>
                    <option value="PREMIUM">Premium / Dual Gate Suite</option>
                    <option value="ENTERPRISE">
                      Enterprise (Unlimited Slots)
                    </option>
                  </select>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-[10px] font-semibold text-slate-700"
                      >Max Operators</label
                    >
                    <input
                      v-model="newTenantForm.maxStaffLimit"
                      type="number"
                      required
                      class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label class="text-[10px] font-semibold text-slate-700"
                      >Max Parking Slots</label
                    >
                    <input
                      v-model="newTenantForm.maxSlotsLimit"
                      type="number"
                      required
                      class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-medium text-xs"
                    />
                  </div>
                </div>
                <div class="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    :disabled="superadminStore.isLoading"
                    class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-500/60 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                  >
                    <Loader2
                      v-if="superadminStore.isLoading"
                      class="w-4 h-4 animate-spin"
                    />
                    <span>Run Deployment Pipeline</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- Tenants Data List Grid -->
            <div
              class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div
                v-if="superadminStore.isLoading && tenants.length === 0"
                class="flex justify-center py-12"
              >
                <Loader2 class="w-8 h-8 text-purple-600 animate-spin" />
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr
                      class="bg-slate-50 text-slate-400 text-[10px] font-bold border-b border-slate-200 uppercase tracking-widest"
                    >
                      <th class="px-6 py-4">Facility & Owner Info</th>
                      <th class="px-6 py-4">Subscription Plan</th>
                      <th class="px-6 py-4">System Gate Capacities</th>
                      <th class="px-6 py-4">Deployment Date</th>
                      <th class="px-6 py-4">Status</th>
                      <th class="px-6 py-4 text-center">System Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="tenant in filteredTenants"
                      :key="tenant._id"
                      class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"
                          >
                            <Building2 class="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p class="font-bold text-slate-900 text-xs">
                              {{ tenant.companyName }}
                            </p>
                            <p
                              class="text-[10px] text-slate-400 font-semibold mt-0.5"
                            >
                              {{ tenant.email }} | {{ tenant.ownerName }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-100"
                        >
                          {{ tenant.subscriptionPlan }}
                        </span>
                      </td>
                      <td
                        class="px-6 py-4 text-[11px] font-bold text-slate-600"
                      >
                        {{ tenant.maxStaffLimit }} Operators /
                        {{ tenant.maxSlotsLimit }} Slots
                      </td>
                      <td
                        class="px-6 py-4 text-slate-400 font-medium text-[11px] font-mono"
                      >
                        {{ new Date(tenant.createdAt).toLocaleDateString() }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          :class="
                            tenant.status === 'ACTIVE'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                              : 'text-rose-700 bg-rose-50 border-rose-100'
                          "
                          class="px-2 py-0.5 rounded text-[10px] font-bold border"
                        >
                          {{ tenant.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <button
                          @click="toggleStatus(tenant._id, tenant.status)"
                          :class="
                            tenant.status === 'ACTIVE'
                              ? 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200'
                              : 'bg-emerald-500 text-white hover:bg-emerald-600'
                          "
                          class="px-3 py-1 rounded-lg text-[10px] font-bold transition-all duration-150"
                        >
                          {{
                            tenant.status === "ACTIVE" ? "Suspend" : "Activate"
                          }}
                        </button>
                      </td>
                    </tr>
                    <tr v-if="filteredTenants.length === 0">
                      <td
                        colspan="6"
                        class="px-6 py-12 text-center text-slate-400 font-medium"
                      >
                        No tenants match the active filter criteria.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ── CROSS-TENANT USERS ── -->
          <div v-if="superadminStore.activeTab === 'users'" class="space-y-4">
            <div
              class="flex flex-col md:flex-row gap-4 items-center justify-between"
            >
              <div class="flex flex-1 gap-3 w-full">
                <div class="relative flex-1">
                  <Search
                    class="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400"
                  />
                  <input
                    v-model="userSearch"
                    type="text"
                    placeholder="Search operational users platform-wide..."
                    class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-medium"
                  />
                </div>
                <select
                  v-model="userRoleFilter"
                  class="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold outline-none focus:ring-4 focus:ring-purple-500/10 text-xs"
                >
                  <option value="ALL">All Roles</option>
                  <option value="TENANT_OWNER">Tenant Owner</option>
                  <option value="GATE_STAFF">Gate Staff</option>
                </select>
              </div>
              <button
                @click="showUserForm = !showUserForm"
                class="w-full md:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 text-xs"
              >
                <Plus class="w-4 h-4" />
                {{ showUserForm ? "Hide User Form" : "Add Direct User" }}
              </button>
            </div>

            <!-- Direct User Allocation Form -->
            <div
              v-if="showUserForm"
              class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl"
            >
              <h3 class="text-sm font-bold text-slate-900 mb-4">
                Provision Operational User Credentials
              </h3>
              <form @submit.prevent="handleCreateUser" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="text-xs font-semibold text-slate-700"
                      >Full Name</label
                    >
                    <input
                      v-model="newUserForm.name"
                      type="text"
                      required
                      class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-slate-700"
                      >Primary Email Address</label
                    >
                    <input
                      v-model="newUserForm.email"
                      type="email"
                      required
                      class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-medium text-xs"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-slate-700"
                      >Password</label
                    >
                    <input
                      v-model="newUserForm.password"
                      type="password"
                      required
                      class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-slate-700"
                      >Access Allocation Role</label
                    >
                    <select
                      v-model="newUserForm.role"
                      class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-semibold text-xs"
                    >
                      <option value="TENANT_OWNER">
                        Tenant Manager (Owner)
                      </option>
                      <option value="GATE_STAFF">Gate Terminal Staff</option>
                    </select>
                  </div>
                  <div class="md:col-span-2">
                    <label class="text-xs font-semibold text-slate-700"
                      >Assign to Parking Facility (Tenant)</label
                    >
                    <select
                      v-model="newUserForm.tenantId"
                      required
                      class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 text-slate-900 font-semibold text-xs"
                    >
                      <option value="" disabled>
                        Select Tenant Platform Domain
                      </option>
                      <option
                        v-for="t in superadminStore.tenants"
                        :key="t._id"
                        :value="t._id"
                      >
                        {{ t.companyName }}
                      </option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  :disabled="superadminStore.isLoading"
                  class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-500/60 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                >
                  <Loader2
                    v-if="superadminStore.isLoading"
                    class="w-4 h-4 animate-spin"
                  />
                  <span>Provision Account</span>
                </button>
              </form>
            </div>

            <!-- Global Users List Table -->
            <div
              class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr
                    class="bg-slate-50 text-slate-400 text-[10px] font-bold border-b border-slate-200 uppercase tracking-widest"
                  >
                    <th class="px-6 py-4">User Personal Details</th>
                    <th class="px-6 py-4">Security Role Permission</th>
                    <th class="px-6 py-4">Linked Facility Tenant</th>
                    <th class="px-6 py-4">Live API Key Mapping</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="user in filteredUsers"
                    :key="user._id"
                    class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2.5">
                        <div
                          class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase"
                        >
                          {{ user.name.charAt(0) }}
                        </div>
                        <div>
                          <p class="font-bold text-slate-900 text-xs">
                            {{ user.name }}
                          </p>
                          <p
                            class="text-[10px] text-slate-400 font-semibold mt-0.5"
                          >
                            {{ user.email }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        :class="
                          user.role === 'TENANT_OWNER'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        "
                        class="px-2 py-0.5 rounded text-[10px] font-bold border"
                      >
                        {{ user.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-xs font-semibold text-slate-600">
                      {{ user.tenantName }}
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="flex items-center gap-1.5 text-[11px] font-mono text-slate-500"
                      >
                        <Key class="w-3 h-3 text-slate-400" />
                        <span
                          class="bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded"
                          >{{ user.apiKey }}</span
                        >
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredUsers.length === 0">
                    <td
                      colspan="4"
                      class="px-6 py-12 text-center text-slate-400 font-medium"
                    >
                      No operational accounts match search query.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ── SUBSCRIPTION PLANS ── -->
          <div v-if="superadminStore.activeTab === 'plans'" class="space-y-6">
            <div class="flex justify-between items-center">
              <div>
                <h3
                  class="text-sm font-bold text-slate-900 uppercase tracking-wide"
                >
                  Configured SaaS Subscription Structures
                </h3>
                <p class="text-xs text-slate-500 mt-1">
                  Pricing tiers linked automatically to tenant gateways and
                  limits.
                </p>
              </div>
              <button
                @click="showPlanForm = !showPlanForm"
                class="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-md text-xs"
              >
                {{ showPlanForm ? "Close Form" : "+ Create Pricing Tier" }}
              </button>
            </div>

            <!-- Slide down/collapsible Add Plan Form -->
            <div
              v-if="showPlanForm"
              class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl"
            >
              <form @submit.prevent="handleCreatePlan" class="space-y-4">
                <div>
                  <label class="text-xs font-semibold text-slate-700"
                    >Tier Name</label
                  >
                  <input
                    v-model="newPlanForm.name"
                    type="text"
                    required
                    placeholder="e.g. Standard Enterprise"
                    class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs shadow-sm"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-700"
                    >Pricing Monthly Cost (Rs.)</label
                  >
                  <input
                    v-model="newPlanForm.priceMonthly"
                    type="number"
                    required
                    class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs shadow-sm"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-xs font-semibold text-slate-700"
                      >Max Included Operators</label
                    >
                    <input
                      v-model="newPlanForm.maxStaff"
                      type="number"
                      required
                      class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs shadow-sm"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-slate-700"
                      >Max Slot Capacities</label
                    >
                    <input
                      v-model="newPlanForm.maxSlots"
                      type="number"
                      required
                      class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-700"
                    >Features Checklist (comma-separated)</label
                  >
                  <input
                    v-model="newPlanForm.features"
                    type="text"
                    placeholder="Dual-Gate sync, Ticket Engine, Analytics"
                    class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md text-xs"
                >
                  Publish Billing Tier
                </button>
              </form>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                v-for="plan in superadminStore.pricingPlans"
                :key="plan._id"
                class="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col justify-between hover:border-purple-300 transition-colors duration-200 shadow-sm relative overflow-hidden"
              >
                <div
                  class="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/5 rounded-full blur-xl pointer-events-none"
                ></div>
                <div>
                  <h4 class="text-base font-bold text-slate-900">
                    {{ plan.name }}
                  </h4>
                  <p class="text-2xl font-black text-purple-600 mt-2">
                    Rs. {{ plan.priceMonthly.toLocaleString()
                    }}<span
                      class="text-xs text-slate-400 font-semibold font-sans"
                    >
                      / mo</span
                    >
                  </p>

                  <ul
                    class="mt-5 space-y-3 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-5"
                  >
                    <li class="flex items-center gap-2">
                      <CheckCircle class="w-4 h-4 text-emerald-500 shrink-0" />
                      Includes {{ plan.maxStaff }} staff logs
                    </li>
                    <li class="flex items-center gap-2">
                      <CheckCircle class="w-4 h-4 text-emerald-500 shrink-0" />
                      Up to {{ plan.maxSlots }} parking slots
                    </li>
                    <li
                      v-for="feature in (plan.features || '').split(',')"
                      :key="feature"
                      class="flex items-center gap-2"
                    >
                      <CheckCircle
                        class="w-4 h-4 text-emerald-500 shrink-0"
                        v-if="feature.trim()"
                      />
                      <span v-if="feature.trim()">{{ feature.trim() }}</span>
                    </li>
                  </ul>
                </div>
                <button
                  class="mt-6 w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs transition-all duration-150"
                >
                  Configure limits
                </button>
              </div>
            </div>
          </div>

          <!-- ── SYSTEM AUDIT LOGS ── -->
          <div v-if="superadminStore.activeTab === 'logs'" class="space-y-4">
            <div
              class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div
                class="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center"
              >
                <h2
                  class="text-sm font-bold text-slate-900 uppercase tracking-wider"
                >
                  System Event Logging Records
                </h2>
                <div class="flex items-center gap-2"></div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr
                      class="bg-slate-100 text-slate-400 text-[10px] font-bold border-b border-slate-200 uppercase tracking-widest"
                    >
                      <th class="px-6 py-4">Timestamp telemetry</th>
                      <th class="px-6 py-4">Action Event Tag</th>
                      <th class="px-6 py-4">Triggered By</th>
                      <th class="px-6 py-4">Target Node Hash</th>
                    </tr>
                  </thead>
                  <tbody class="font-semibold text-slate-700 text-xs">
                    <tr
                      v-for="log in superadminStore.auditLogs"
                      :key="log._id"
                      class="border-b border-slate-100 hover:bg-slate-50/50"
                    >
                      <td
                        class="px-6 py-4 text-slate-400 font-mono text-[11px]"
                      >
                        {{ new Date(log.timestamp).toLocaleString() }}
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-100"
                          >{{ log.action }}</span
                        >
                      </td>
                      <td class="px-6 py-4 text-slate-600">
                        {{ log.triggeredBy }}
                      </td>
                      <td
                        class="px-6 py-4 font-mono text-[11px] text-slate-400"
                      >
                        {{ log.targetId }}
                      </td>
                    </tr>
                    <tr v-if="superadminStore.auditLogs.length === 0">
                      <td
                        colspan="4"
                        class="px-6 py-8 text-center text-slate-400"
                      >
                        No telemetry actions recorded yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ── GLOBAL SETTINGS ── -->
          <div
            v-if="superadminStore.activeTab === 'settings'"
            class="space-y-6"
          >
            <div
              class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
            >
              <h2
                class="text-base font-bold text-slate-900 border-b border-slate-100 pb-4"
              >
                Global Platform Routing Parameters
              </h2>
              <form
                @submit.prevent="superadminStore.updateGlobalSettings"
                class="space-y-6 mt-6 max-w-2xl"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="text-xs font-semibold text-slate-700"
                      >Platform Maintenance Overrides</label
                    >
                    <select
                      v-model="superadminStore.globalSettings.maintenanceMode"
                      class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:ring-4 focus:ring-purple-500/10 outline-none"
                    >
                      <option :value="false">Operational (Live Systems)</option>
                      <option :value="true">
                        Maintenance Interceptor Enabled
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-slate-700"
                      >Global Pricing Scale Formula</label
                    >
                    <input
                      v-model="superadminStore.globalSettings.globalRateFormula"
                      type="text"
                      class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:ring-4 focus:ring-purple-500/10 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-700"
                    >Centralized SMS Carrier Gateway Hook</label
                  >
                  <input
                    v-model="superadminStore.globalSettings.smsGatewayUrl"
                    type="text"
                    class="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:ring-4 focus:ring-purple-500/10 outline-none"
                  />
                </div>
                <div class="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    :disabled="superadminStore.isLoading"
                    class="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 text-xs"
                  >
                    <Loader2
                      v-if="superadminStore.isLoading"
                      class="w-4 h-4 animate-spin inline-block mr-1"
                    />
                    Commit Platform State
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
