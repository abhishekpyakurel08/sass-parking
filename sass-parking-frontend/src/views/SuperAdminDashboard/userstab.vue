<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import {
  Search,
  Plus,
  Key,
  User,
  Mail,
  Shield,
  Building2,
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

const userSearch = ref("");
const userRoleFilter = ref("ALL");
const showUserForm = ref(false);

const newUserForm = reactive({
  name: "",
  email: "",
  password: "",
  role: "TENANT_OWNER",
  tenantId: "",
});

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

// Role styling
const getRoleStyle = (role: string) => {
  if (role === "TENANT_OWNER") {
    return {
      light: "bg-violet-50 text-violet-700 border-violet-200",
      dark: "bg-violet-950/30 text-violet-400 border-violet-900/50",
      label: "Partner Owner",
    };
  }
  return {
    light: "bg-blue-50 text-blue-700 border-blue-200",
    dark: "bg-blue-950/30 text-blue-400 border-blue-900/50",
    label: "Staff Operator",
  };
};
</script>

<template>
  <div class="space-y-4">
    <!-- Controls -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div class="flex flex-1 gap-3 w-full">
        <div class="relative flex-1">
          <Search
            class="w-4 h-4 absolute left-3.5 top-3.5"
            :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-400'"
          />
          <input
            v-model="userSearch"
            type="text"
            placeholder="Search profiles by name or email..."
            class="w-full pl-11 pr-4 py-2.5 border rounded-xl text-xs outline-none font-semibold transition-colors duration-300"
            :class="
              isDarkMode
                ? 'bg-zinc-900 border-zinc-800 text-white focus:ring-4 focus:ring-zinc-800 focus:border-zinc-700'
                : 'bg-white border-zinc-200 text-slate-900 focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-950'
            "
          />
        </div>
        <select
          v-model="userRoleFilter"
          class="px-4 py-2.5 border rounded-xl font-bold outline-none text-xs transition-colors duration-300"
          :class="
            isDarkMode
              ? 'bg-zinc-900 border-zinc-800 text-zinc-300 focus:ring-4 focus:ring-zinc-800 focus:border-zinc-700'
              : 'bg-white border-zinc-200 text-zinc-700 focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-950'
          "
        >
          <option value="ALL">All Roles</option>
          <option value="TENANT_OWNER">Partner Owner</option>
          <option value="GATE_STAFF">Staff Operator</option>
        </select>
      </div>
      <button
        @click="showUserForm = !showUserForm"
        class="w-full md:w-auto px-5 py-2.5 font-bold rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all duration-300"
        :class="
          showUserForm
            ? isDarkMode
              ? 'bg-zinc-800 text-white hover:bg-zinc-700'
              : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'
            : isDarkMode
              ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
              : 'bg-zinc-950 text-white hover:bg-black'
        "
      >
        <Plus class="w-4 h-4" />
        {{ showUserForm ? "Close Form" : "Add User" }}
      </button>
    </div>

    <!-- Registration Panel -->
    <div
      v-if="showUserForm"
      class="p-6 rounded-2xl border shadow-sm max-w-xl space-y-4 transition-colors duration-300"
      :class="
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      "
    >
      <h3
        class="text-xs font-black uppercase tracking-widest"
        :class="isDarkMode ? 'text-white' : 'text-zinc-900'"
      >
        Create User Profile
      </h3>
      <form @submit.prevent="handleCreateUser" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              class="text-[10px] font-black uppercase"
              :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-500'"
              >Full Name</label
            >
            <div class="relative">
              <User
                class="w-4 h-4 absolute left-3 top-3"
                :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
              />
              <input
                v-model="newUserForm.name"
                type="text"
                required
                class="mt-1 w-full pl-10 pr-3 py-2 border rounded-xl text-xs font-semibold outline-none transition-colors duration-300"
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
              class="text-[10px] font-black uppercase"
              :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-500'"
              >Email Address</label
            >
            <div class="relative">
              <Mail
                class="w-4 h-4 absolute left-3 top-3"
                :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
              />
              <input
                v-model="newUserForm.email"
                type="email"
                required
                class="mt-1 w-full pl-10 pr-3 py-2 border rounded-xl text-xs font-semibold outline-none transition-colors duration-300"
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
              class="text-[10px] font-black uppercase"
              :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-500'"
              >Password</label
            >
            <div class="relative">
              <Shield
                class="w-4 h-4 absolute left-3 top-3"
                :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
              />
              <input
                v-model="newUserForm.password"
                type="password"
                required
                class="mt-1 w-full pl-10 pr-3 py-2 border rounded-xl text-xs font-semibold outline-none transition-colors duration-300"
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
              class="text-[10px] font-black uppercase"
              :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-500'"
              >User Role</label
            >
            <select
              v-model="newUserForm.role"
              class="mt-1 w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none transition-colors duration-300"
              :class="
                isDarkMode
                  ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
              "
            >
              <option value="TENANT_OWNER">Partner Owner</option>
              <option value="GATE_STAFF">Staff Operator</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label
              class="text-[10px] font-black uppercase"
              :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-500'"
              >Assign Partner</label
            >
            <div class="relative">
              <Building2
                class="w-4 h-4 absolute left-3 top-3"
                :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
              />
              <select
                v-model="newUserForm.tenantId"
                required
                class="mt-1 w-full pl-10 pr-3 py-2 border rounded-xl text-xs font-bold outline-none transition-colors duration-300"
                :class="
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-zinc-400'
                "
              >
                <option value="" disabled>Select Partner</option>
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
        </div>
        <button
          type="submit"
          class="w-full font-black py-2.5 rounded-xl uppercase tracking-wider text-xs shadow-md transition-all duration-300"
          :class="
            isDarkMode
              ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
              : 'bg-zinc-900 text-white hover:bg-black'
          "
        >
          Create User Credentials
        </button>
      </form>
    </div>

    <!-- Users Table -->
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
            <th class="px-6 py-4">User Details</th>
            <th class="px-6 py-4">Role</th>
            <th class="px-6 py-4">Partner Name</th>
            <th class="px-6 py-4">API Access Key</th>
          </tr>
        </thead>
        <tbody class="text-xs">
          <tr
            v-for="user in filteredUsers"
            :key="user._id"
            class="border-b transition-colors duration-200"
            :class="[
              isDarkMode
                ? 'border-zinc-850 hover:bg-zinc-800/30'
                : 'border-slate-150 hover:bg-slate-50/40',
            ]"
          >
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                  :class="
                    isDarkMode
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-zinc-100 text-zinc-600'
                  "
                >
                  {{ user.name?.charAt(0)?.toUpperCase() || "?" }}
                </div>
                <div>
                  <p
                    class="font-bold"
                    :class="isDarkMode ? 'text-white' : 'text-slate-900'"
                  >
                    {{ user.name }}
                  </p>
                  <p
                    class="text-[10px] font-bold mt-0.5"
                    :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-400'"
                  >
                    {{ user.email }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                class="px-2 py-0.5 border font-mono text-[9px] font-black uppercase rounded-md transition-colors duration-300"
                :class="[
                  isDarkMode
                    ? getRoleStyle(user.role).dark
                    : getRoleStyle(user.role).light,
                ]"
              >
                {{ getRoleStyle(user.role).label }}
              </span>
            </td>
            <td
              class="px-6 py-4 font-bold"
              :class="isDarkMode ? 'text-zinc-300' : 'text-zinc-600'"
            >
              <div class="flex items-center gap-1.5">
                <Building2
                  class="w-3 h-3"
                  :class="isDarkMode ? 'text-zinc-600' : 'text-zinc-400'"
                />
                {{ user.tenantName }}
              </div>
            </td>
            <td class="px-6 py-4 font-mono text-[10px]">
              <div
                class="flex items-center gap-1.5 border px-2 py-0.5 rounded-lg inline-block w-fit transition-colors duration-300"
                :class="
                  isDarkMode
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    : 'bg-zinc-50 border-zinc-150 text-zinc-500'
                "
              >
                <Key class="w-3.5 h-3.5" />
                <span>{{ user.apiKey }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
