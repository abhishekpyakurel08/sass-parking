<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import {
  Building2,
  Search,
  Plus,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Users,
  ParkingSquare,
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

const tenantSearch = ref("");
const tenantStatusFilter = ref("ALL");
const showTenantForm = ref(false);

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

const filteredTenants = computed(() => {
  return superadminStore.tenants.filter((t) => {
    const matchesQuery =
      t.companyName.toLowerCase().includes(tenantSearch.value.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(tenantSearch.value.toLowerCase()) ||
      t.email.toLowerCase().includes(tenantSearch.value.toLowerCase());
    const matchesStatus =
      tenantStatusFilter.value === "ALL" ||
      t.status === tenantStatusFilter.value;
    return matchesQuery && matchesStatus;
  });
});

// Plan color mapping
const getPlanColor = (plan: string) => {
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
    BASIC: {
      bg: "bg-zinc-100",
      text: "text-zinc-700",
      border: "border-zinc-200",
      darkBg: "bg-zinc-800",
      darkText: "text-zinc-300",
      darkBorder: "border-zinc-700",
    },
    PREMIUM: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      darkBg: "bg-amber-950/30",
      darkText: "text-amber-400",
      darkBorder: "border-amber-900/50",
    },
    ENTERPRISE: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-200",
      darkBg: "bg-violet-950/30",
      darkText: "text-violet-400",
      darkBorder: "border-violet-900/50",
    },
  };
  return colors[plan?.toUpperCase()] || colors.BASIC;
};
</script>

<template>
  <div class="space-y-4">
    <!-- Controls -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div class="flex flex-1 gap-3 w-full">
        <div class="relative flex-1">
          <Search
            class="w-5 h-5 absolute left-3.5 top-3.5"
            :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-400'"
          />
          <input
            v-model="tenantSearch"
            type="text"
            placeholder="Search partners by name, owner, or email..."
            class="w-full pl-11 pr-4 py-3 border rounded-xl outline-none text-sm font-medium transition-colors duration-300"
            :class="
              isDarkMode
                ? 'bg-zinc-900 border-zinc-800 text-white focus:ring-4 focus:ring-zinc-800 focus:border-zinc-700'
                : 'bg-white border-slate-200 text-slate-900 focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-950'
            "
          />
        </div>
        <select
          v-model="tenantStatusFilter"
          class="px-4 py-3 border rounded-xl font-bold outline-none text-xs transition-colors duration-300"
          :class="
            isDarkMode
              ? 'bg-zinc-900 border-zinc-800 text-zinc-300 focus:ring-4 focus:ring-zinc-800 focus:border-zinc-700'
              : 'bg-white border-slate-200 text-slate-700 focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-950'
          "
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>
      <button
        @click="showTenantForm = !showTenantForm"
        class="w-full md:w-auto px-6 py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg text-xs uppercase tracking-wider transition-all duration-300"
        :class="
          showTenantForm
            ? isDarkMode
              ? 'bg-zinc-800 text-white hover:bg-zinc-700'
              : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'
            : isDarkMode
              ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
              : 'bg-zinc-900 text-white hover:bg-black'
        "
      >
        <Plus class="w-4 h-4" />
        {{ showTenantForm ? "Close Form" : "Add Partner" }}
      </button>
    </div>

    <!-- Tenant Registration Form -->
    <div
      v-if="showTenantForm"
      class="p-6 rounded-2xl border shadow-sm space-y-4 transition-colors duration-300"
      :class="
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      "
    >
      <h3
        class="text-sm font-bold uppercase tracking-wider"
        :class="isDarkMode ? 'text-white' : 'text-slate-950'"
      >
        Register New Parking Partner
      </h3>
      <form
        @submit.prevent="handleCreateTenant"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label
            class="text-xs font-semibold"
            :class="isDarkMode ? 'text-zinc-400' : 'text-slate-700'"
            >Company Name</label
          >
          <input
            v-model="newTenantForm.companyName"
            type="text"
            required
            class="mt-1.5 w-full px-4 py-2.5 border rounded-xl outline-none text-xs transition-colors duration-300"
            :class="
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
            "
          />
        </div>
        <div>
          <label
            class="text-xs font-semibold"
            :class="isDarkMode ? 'text-zinc-400' : 'text-slate-700'"
            >Owner Full Name</label
          >
          <input
            v-model="newTenantForm.ownerName"
            type="text"
            required
            class="mt-1.5 w-full px-4 py-2.5 border rounded-xl outline-none text-xs transition-colors duration-300"
            :class="
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
            "
          />
        </div>
        <div>
          <label
            class="text-xs font-semibold"
            :class="isDarkMode ? 'text-zinc-400' : 'text-slate-700'"
            >Primary Contact Email</label
          >
          <div class="relative">
            <Mail
              class="w-4 h-4 absolute left-3 top-3"
              :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
            />
            <input
              v-model="newTenantForm.email"
              type="email"
              required
              class="mt-1.5 w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none text-xs transition-colors duration-300"
              :class="
                isDarkMode
                  ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
              "
            />
          </div>
        </div>
        <div>
          <label
            class="text-xs font-semibold"
            :class="isDarkMode ? 'text-zinc-400' : 'text-slate-700'"
            >Contact Phone Number</label
          >
          <div class="relative">
            <Phone
              class="w-4 h-4 absolute left-3 top-3"
              :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
            />
            <input
              v-model="newTenantForm.contactNumber"
              type="text"
              required
              class="mt-1.5 w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none text-xs transition-colors duration-300"
              :class="
                isDarkMode
                  ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
              "
            />
          </div>
        </div>
        <div class="md:col-span-2">
          <label
            class="text-xs font-semibold"
            :class="isDarkMode ? 'text-zinc-400' : 'text-slate-700'"
            >Physical Address</label
          >
          <div class="relative">
            <MapPin
              class="w-4 h-4 absolute left-3 top-3"
              :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
            />
            <input
              v-model="newTenantForm.address"
              type="text"
              required
              class="mt-1.5 w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none text-xs transition-colors duration-300"
              :class="
                isDarkMode
                  ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
              "
            />
          </div>
        </div>
        <div>
          <label
            class="text-xs font-semibold"
            :class="isDarkMode ? 'text-zinc-400' : 'text-slate-700'"
            >Subscription Plan</label
          >
          <select
            v-model="newTenantForm.subscriptionPlan"
            class="mt-1.5 w-full px-4 py-2.5 border rounded-xl outline-none text-xs font-bold transition-colors duration-300"
            :class="
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
            "
          >
            <option value="BASIC">Basic Plan</option>
            <option value="PREMIUM">Premium Suite</option>
            <option value="ENTERPRISE">Enterprise Tier</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label
              class="text-[10px] font-semibold"
              :class="isDarkMode ? 'text-zinc-400' : 'text-slate-700'"
              >Max Staff</label
            >
            <div class="relative">
              <Users
                class="w-3.5 h-3.5 absolute left-3 top-3"
                :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
              />
              <input
                v-model="newTenantForm.maxStaffLimit"
                type="number"
                required
                class="mt-1.5 w-full pl-9 pr-4 py-2.5 border rounded-xl outline-none text-xs transition-colors duration-300"
                :class="
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
                "
              />
            </div>
          </div>
          <div>
            <label
              class="text-[10px] font-semibold"
              :class="isDarkMode ? 'text-zinc-400' : 'text-slate-700'"
              >Max Slots</label
            >
            <div class="relative">
              <ParkingSquare
                class="w-3.5 h-3.5 absolute left-3 top-3"
                :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
              />
              <input
                v-model="newTenantForm.maxSlotsLimit"
                type="number"
                required
                class="mt-1.5 w-full pl-9 pr-4 py-2.5 border rounded-xl outline-none text-xs transition-colors duration-300"
                :class="
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
                "
              />
            </div>
          </div>
        </div>
        <div class="md:col-span-2 pt-2">
          <button
            type="submit"
            :disabled="superadminStore.isLoading"
            class="w-full font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300"
            :class="
              isDarkMode
                ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
                : 'bg-zinc-900 text-white hover:bg-black'
            "
            :disabled-class="'opacity-50 cursor-not-allowed'"
          >
            <Loader2
              v-if="superadminStore.isLoading"
              class="w-4 h-4 animate-spin"
            />
            <span>Save and Deploy Partner</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Tenants Table -->
    <div
      class="rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300"
      :class="
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      "
    >
      <table class="w-full text-left border-collapse">
        <thead>
          <tr
            class="text-xs font-bold border-b uppercase tracking-wider transition-colors duration-300"
            :class="
              isDarkMode
                ? 'bg-zinc-800/50 text-zinc-400 border-zinc-800'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            "
          >
            <th class="px-6 py-4">Partner & Owner Info</th>
            <th class="px-6 py-4">Subscription Plan</th>
            <th class="px-6 py-4">Limits</th>
            <th class="px-6 py-4">Created Date</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="text-xs">
          <tr
            v-for="tenant in filteredTenants"
            :key="tenant._id"
            class="border-b transition-colors duration-200"
            :class="[
              isDarkMode
                ? 'border-zinc-850 hover:bg-zinc-800/20'
                : 'border-slate-150 hover:bg-slate-50/50',
            ]"
          >
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 border rounded-xl flex items-center justify-center transition-colors duration-300"
                  :class="
                    isDarkMode
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                  "
                >
                  <Building2 class="w-4.5 h-4.5" />
                </div>
                <div>
                  <p
                    class="font-bold"
                    :class="isDarkMode ? 'text-white' : 'text-slate-900'"
                  >
                    {{ tenant.companyName }}
                  </p>
                  <p
                    class="text-[10px] font-bold mt-0.5"
                    :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-400'"
                  >
                    {{ tenant.email }} | {{ tenant.ownerName }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                class="px-2.5 py-0.5 border font-mono text-[9px] font-bold uppercase rounded-md transition-colors duration-300"
                :class="[
                  isDarkMode
                    ? [
                        getPlanColor(tenant.subscriptionPlan).darkBg,
                        getPlanColor(tenant.subscriptionPlan).darkText,
                        getPlanColor(tenant.subscriptionPlan).darkBorder,
                      ]
                    : [
                        getPlanColor(tenant.subscriptionPlan).bg,
                        getPlanColor(tenant.subscriptionPlan).text,
                        getPlanColor(tenant.subscriptionPlan).border,
                      ],
                ]"
              >
                {{ tenant.subscriptionPlan }}
              </span>
            </td>
            <td
              class="px-6 py-4 font-semibold"
              :class="isDarkMode ? 'text-zinc-400' : 'text-zinc-600'"
            >
              <div class="flex items-center gap-1">
                <Users class="w-3 h-3" />
                {{ tenant.maxStaffLimit }}
                <span class="mx-1">/</span>
                <ParkingSquare class="w-3 h-3" />
                {{ tenant.maxSlotsLimit }}
              </div>
            </td>
            <td
              class="px-6 py-4 font-mono text-[10px]"
              :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-400'"
            >
              {{ new Date(tenant.createdAt).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4">
              <span
                :class="[
                  tenant.status === 'ACTIVE'
                    ? isDarkMode
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                    : isDarkMode
                      ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      : 'bg-zinc-100 text-zinc-400 border-zinc-200',
                ]"
                class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase border transition-colors duration-300"
              >
                {{ tenant.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <button
                @click="toggleStatus(tenant._id, tenant.status)"
                class="px-3 py-1 rounded-xl text-[10px] font-black uppercase shadow-sm transition-all duration-300"
                :class="
                  tenant.status === 'ACTIVE'
                    ? isDarkMode
                      ? 'bg-transparent text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-900/50'
                      : 'bg-transparent text-zinc-500 hover:text-red-600 border border-zinc-200 hover:border-red-200'
                    : isDarkMode
                      ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
                      : 'bg-zinc-950 text-white hover:bg-black'
                "
              >
                {{ tenant.status === "ACTIVE" ? "Suspend" : "Activate" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
