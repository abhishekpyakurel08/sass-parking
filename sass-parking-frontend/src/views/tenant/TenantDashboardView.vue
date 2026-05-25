<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import {
  Building2, Users, LogOut, Loader2, LayoutDashboard, Briefcase,
  ChevronRight, MapPin, Car, Ticket, CheckCircle, BarChart3
} from "lucide-vue-next"
import { useRouter } from "vue-router"
import { useAuthStore } from "../../stores/auth"
import { useTenantStore } from "../../stores/tenant"
import { useOperatorStore } from "../../stores/operator"

const router = useRouter()
const authStore = useAuthStore()
const tenantStore = useTenantStore()
const operatorStore = useOperatorStore()

type Tab = "overview" | "check-in" | "check-out" | "stats" | "profile" | "staff" | "revenue" | "tickets"
const activeTab = ref<Tab>(authStore.user?.role === "GATE_STAFF" ? "check-in" : "overview")

const isTenantAdmin = authStore.user?.role === "TENANT_OWNER"

// Gate operator state
const checkInForm = reactive({ vehiclePlateNumber: "", vehicleType: "CAR", floor_level: "" }) // Changed 'floor' to 'floor_level'
const checkInSuccess = ref(false)
const assignedSlot = ref("")
const checkInQrCode = ref("")
const lastTicketNumber = ref("")
const checkOutForm = reactive({ vehiclePlateNumber: "" })
const checkOutSummary = ref<{ durationHours: number; ratePerHour: number; totalCharge: number } | null>(null)

// Staff Management
const newStaffForm = reactive({ name: "", email: "", password: "", apiKey: "" })
const showStaffForm = ref(false)

const handleLogout = async () => {
  await authStore.logout()
  router.push("/")
}

const switchTab = (tab: Tab) => {
  activeTab.value = tab
  if (tab === "profile" && !tenantStore.profile.email) tenantStore.fetchProfile()
  if (tab === "stats") operatorStore.fetchStats()
  if (tab === "revenue" && isTenantAdmin) tenantStore.fetchRevenueAnalytics()
  if (tab === "tickets" && isTenantAdmin) tenantStore.fetchTicketHistory()
  if (tab === "staff" && isTenantAdmin) tenantStore.fetchStaff()
}

const handleUpdate = async () => {
  try { await tenantStore.updateProfile() } catch { /* toast shown in store */ }
}

const submitCheckIn = async () => {
  checkInSuccess.value = false
  try {
    const data = await operatorStore.checkIn(checkInForm)
    checkInSuccess.value = true
    assignedSlot.value = data.assignedSlot
    checkInQrCode.value = data.qrCode
    lastTicketNumber.value = data.ticketNumber
    checkInForm.vehiclePlateNumber = ""
    checkInForm.floor_level = "" // Clear floor after submission
  } catch { /* toast shown in store */ }
}

const submitCheckOut = async () => {
  checkOutSummary.value = null
  try {
    const data = await operatorStore.checkOut(checkOutForm)
    checkOutSummary.value = data.summary
    checkOutForm.vehiclePlateNumber = ""
  } catch { /* toast shown in store */ }
}

const handleCreateStaff = async () => {
  const payload: any = { ...newStaffForm }
  if (!payload.apiKey) delete payload.apiKey // let backend generate if empty

  const success = await tenantStore.createStaff(payload)
  if (success) {
    showStaffForm.value = false
    newStaffForm.name = ""
    newStaffForm.email = ""
    newStaffForm.password = ""
    newStaffForm.apiKey = ""
  }
}

onMounted(() => { 
  if (isTenantAdmin) {
    tenantStore.fetchProfile() 
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex font-sans">

    <!-- Sidebar -->
    <aside class="w-72 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 z-20 shadow-2xl">
      <div class="absolute inset-0 bg-gradient-to-b from-slate-800/50 to-transparent pointer-events-none"></div>

      <div class="p-6 pb-6 border-b border-white/5 relative z-10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Building2 class="text-white w-6 h-6" />
          </div>
          <span class="font-bold text-xl tracking-tight text-white">ParkSaaS<span class="text-indigo-400">Admin</span></span>
        </div>
        <p class="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Tenant Control Center</p>
      </div>

      <nav class="flex-1 p-4 space-y-1 relative z-10 overflow-y-auto">
        <!-- Admin Group -->
        <template v-if="isTenantAdmin">
          <p class="text-xs font-bold text-slate-600 uppercase tracking-widest px-4 pt-2 pb-1">Administration</p>
          <button v-for="item in [
            { id: 'overview', icon: LayoutDashboard, label: 'Facility Overview' },
            { id: 'revenue',  icon: BarChart3,      label: 'Revenue Analytics' },
            { id: 'tickets',  icon: Ticket,         label: 'Ticket History' },
            { id: 'profile',  icon: Briefcase,      label: 'Company Profile' },
            { id: 'staff',    icon: Users,           label: 'Staff & Operators' },
          ]" :key="item.id"
            @click="switchTab(item.id as Tab)"
            :class="['w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all outline-none',
              activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white']">
            <div class="flex items-center gap-3">
              <component :is="item.icon" class="w-5 h-5" />
              {{ item.label }}
            </div>
            <ChevronRight v-if="activeTab === item.id" class="w-4 h-4 opacity-70" />
          </button>
        </template>

        <!-- Gate Group -->
        <p class="text-xs font-bold text-slate-600 uppercase tracking-widest px-4 pt-4 pb-1">Gate Operations</p>
        <button v-for="item in [
          { id: 'check-in',  icon: Car,      label: 'Entry Gate' },
          { id: 'check-out', icon: Ticket,   label: 'Exit Gate' },
          { id: 'stats',     icon: BarChart3, label: 'Daily Stats' },
        ]" :key="item.id"
          @click="switchTab(item.id as Tab)"
          :class="['w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all outline-none',
            activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white']">
          <div class="flex items-center gap-3">
            <component :is="item.icon" class="w-5 h-5" />
            {{ item.label }}
          </div>
          <ChevronRight v-if="activeTab === item.id" class="w-4 h-4 opacity-70" />
        </button>
      </nav>

      <div class="p-4 border-t border-white/5 relative z-10">
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl font-semibold transition-colors outline-none">
          <LogOut class="w-5 h-5" /> Sign Out
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden bg-[#f4f7f9]">
      <header class="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shrink-0 shadow-sm">
        <div>
          <h1 class="text-2xl font-black text-slate-900 capitalize">{{ activeTab.replace('-', ' ') }}</h1>
          <p class="text-sm text-slate-500 mt-0.5">Full tenant & gate operator access</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="px-4 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-full border border-indigo-100 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full animate-pulse" :class="isTenantAdmin ? 'bg-indigo-500' : 'bg-emerald-500'"></span>
            {{ isTenantAdmin ? 'TENANT ADMIN' : 'GATE OPERATOR' }}
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-8">
        <div class="max-w-5xl mx-auto">

          <!-- ── OVERVIEW ── -->
          <div v-if="activeTab === 'overview' && isTenantAdmin" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div class="flex justify-between items-start mb-4">
                  <div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center"><Building2 class="w-6 h-6 text-indigo-600" /></div>
                  <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+12% this week</span>
                </div>
                <p class="text-slate-500 text-sm font-semibold">Total Revenue</p>
                <h3 class="text-3xl font-black text-slate-900 mt-1">Rs. 14,250.00</h3>
              </div>
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div class="flex justify-between items-start mb-4">
                  <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center"><Users class="w-6 h-6 text-blue-600" /></div>
                  <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Active</span>
                </div>
                <p class="text-slate-500 text-sm font-semibold">Active Staff</p>
                <h3 class="text-3xl font-black text-slate-900 mt-1">12</h3>
              </div>
              <div class="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                <div class="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 relative z-10"><Briefcase class="w-6 h-6 text-white" /></div>
                <p class="text-indigo-100 text-sm font-semibold relative z-10">Subscription</p>
                <h3 class="text-3xl font-black relative z-10">{{ tenantStore.profile.subscriptionStatus || 'ACTIVE' }}</h3>
              </div>
            </div>
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-56 flex flex-col items-center justify-center text-slate-400">
              <LayoutDashboard class="w-14 h-14 opacity-20 mb-4" />
              <p class="font-medium">Detailed analytics will appear here.</p>
            </div>
          </div>

          <!-- ── ENTRY GATE (CHECK-IN) ── -->
          <div v-if="activeTab === 'check-in'" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 class="text-lg font-bold text-slate-900 mb-5">Process Arrival</h3>
                <form @submit.prevent="submitCheckIn" class="space-y-4">
                  <div>
                    <label class="text-sm font-semibold text-slate-700">License Plate</label>
                    <input v-model="checkInForm.vehiclePlateNumber" type="text" placeholder="e.g. ABC-1234" required class="mt-1.5 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-slate-900 font-medium uppercase" />
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-slate-700">Vehicle Class</label>
                    <select v-model="checkInForm.vehicleType" class="mt-1.5 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-slate-900 font-medium">
                      <option value="BIKE">Motorcycle</option>
                      <option value="CAR">Standard Car</option>
                      <option value="TRUCK">Truck / Heavy</option>
                      <option value="SUV">SUV</option>
                      <option value="BUS">Bus</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-slate-700">Floor (Optional)</label>
                    <input v-model="checkInForm.floor_level" type="text" placeholder="e.g. Ground" class="mt-1.5 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-slate-900 font-medium" />
                  </div>
                  <button type="submit" :disabled="operatorStore.isLoading" class="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 mt-2">
                    <Loader2 v-if="operatorStore.isLoading" class="w-5 h-5 animate-spin" />
                    <span v-else>Open Entry Gate</span>
                  </button>
                </form>
              </div>

              <div v-if="checkInSuccess" class="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl text-white shadow-2xl relative overflow-hidden">
                <div class="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
                <div class="flex items-center gap-3 mb-6"><CheckCircle class="text-emerald-400 w-8 h-8" /><h3 class="text-2xl font-bold">Access Granted</h3></div>
                
                <div class="bg-white/10 rounded-xl p-4 flex justify-between items-center mb-3">
                  <span class="text-slate-400">Ticket No.</span>
                  <span class="text-lg font-black text-emerald-400">{{ lastTicketNumber }}</span>
                </div>

                <div class="bg-white/10 rounded-xl p-4 flex justify-between items-center mb-4">
                  <span class="text-slate-400">Assigned Bay</span>
                  <span class="text-2xl font-black text-emerald-400">{{ assignedSlot || 'N/A' }}</span>
                </div>
                <div v-if="checkInQrCode" class="flex flex-col items-center bg-white p-4 rounded-xl">
                  <img :src="checkInQrCode" alt="QR" class="w-40 h-40 rounded-lg" />
                  <p class="text-slate-500 text-sm font-semibold mt-2">Scan at exit terminal</p>
                </div>
              </div>
              <div v-else class="hidden md:flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                <Ticket class="w-14 h-14 mb-3 opacity-30" /><p class="font-medium">Ticket will appear here</p>
              </div>
            </div>
          </div>

          <!-- ── EXIT GATE (CHECK-OUT) ── -->
          <div v-if="activeTab === 'check-out'" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 class="text-lg font-bold text-slate-900 mb-5">Process Departure</h3>
                <form @submit.prevent="submitCheckOut" class="space-y-4">
                  <div>
                    <label class="text-sm font-semibold text-slate-700">License Plate</label>
                    <input v-model="checkOutForm.vehiclePlateNumber" type="text" placeholder="e.g. ABC-1234" required class="mt-1.5 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-slate-900 font-medium uppercase" />
                  </div>
                  <button type="submit" :disabled="operatorStore.isLoading" class="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-900/50 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg mt-2">
                    <Loader2 v-if="operatorStore.isLoading" class="w-5 h-5 animate-spin" />
                    <span v-else>Calculate Fare & Open Exit</span>
                  </button>
                </form>
              </div>

              <div v-if="checkOutSummary" class="bg-white border-2 border-emerald-500 p-8 rounded-2xl shadow-xl">
                <div class="flex items-center gap-3 mb-6 text-emerald-600"><CheckCircle class="w-8 h-8" /><h3 class="text-2xl font-bold">Payment Settled</h3></div>
                <div class="space-y-3">
                  <div class="flex justify-between py-2 border-b border-slate-100"><span class="text-slate-500">Duration</span><span class="font-bold text-slate-900">{{ checkOutSummary.durationHours }} hr(s)</span></div>
                  <div class="flex justify-between py-2 border-b border-slate-100"><span class="text-slate-500">Rate</span><span class="font-bold text-slate-900">Rs. {{ checkOutSummary.ratePerHour }}/hr</span></div>
                  <div class="flex justify-between pt-4"><span class="text-lg font-black text-slate-900">Total</span><span class="text-3xl font-black text-emerald-600">Rs. {{ checkOutSummary.totalCharge.toFixed(2) }}</span></div>
                </div>
                <button @click="checkOutSummary = null" class="mt-6 w-full px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors">Next Vehicle</button>
              </div>
            </div>
          </div>

          <!-- ── DAILY STATS ── -->
          <div v-if="activeTab === 'stats'">
            <div v-if="operatorStore.stats" class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-3 text-slate-500 mb-4"><Car class="w-5 h-5 text-blue-500" /><h3 class="font-bold">Vehicles Today</h3></div>
                <p class="text-4xl font-black text-slate-900">{{ operatorStore.stats.totalVehicles }}</p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-3 text-slate-500 mb-4"><CheckCircle class="w-5 h-5 text-emerald-500" /><h3 class="font-bold">Completed Sessions</h3></div>
                <p class="text-4xl font-black text-slate-900">{{ operatorStore.stats.completedSessions }}</p>
              </div>
              <div class="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg shadow-emerald-500/30 text-white">
                <div class="flex items-center gap-3 text-emerald-100 mb-4"><BarChart3 class="w-5 h-5" /><h3 class="font-bold">Daily Revenue</h3></div>
                <p class="text-4xl font-black">Rs. {{ operatorStore.stats.totalRevenue.toFixed(2) }}</p>
              </div>
            </div>
            <div v-else class="flex justify-center p-16"><Loader2 class="w-8 h-8 text-indigo-500 animate-spin" /></div>
          </div>

          <!-- ── REVENUE ANALYTICS ── -->
          <div v-if="activeTab === 'revenue' && isTenantAdmin">
            <div v-if="tenantStore.isLoading" class="flex justify-center p-16"><Loader2 class="w-8 h-8 text-indigo-500 animate-spin" /></div>
            <div v-else-if="tenantStore.revenueAnalytics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-3 text-slate-500 mb-4"><BarChart3 class="w-5 h-5 text-indigo-500" /><h3 class="font-bold">Today</h3></div>
                <p class="text-4xl font-black text-slate-900">Rs. {{ tenantStore.revenueAnalytics.today.toFixed(2) }}</p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-3 text-slate-500 mb-4"><BarChart3 class="w-5 h-5 text-indigo-500" /><h3 class="font-bold">1 Month</h3></div>
                <p class="text-4xl font-black text-slate-900">Rs. {{ tenantStore.revenueAnalytics.oneMonth.toFixed(2) }}</p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-3 text-slate-500 mb-4"><BarChart3 class="w-5 h-5 text-indigo-500" /><h3 class="font-bold">3 Months</h3></div>
                <p class="text-4xl font-black text-slate-900">Rs. {{ tenantStore.revenueAnalytics.threeMonths.toFixed(2) }}</p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-3 text-slate-500 mb-4"><BarChart3 class="w-5 h-5 text-indigo-500" /><h3 class="font-bold">6 Months</h3></div>
                <p class="text-4xl font-black text-slate-900">Rs. {{ tenantStore.revenueAnalytics.sixMonths.toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <!-- ── TICKET HISTORY ── -->
          <div v-if="activeTab === 'tickets' && isTenantAdmin">
            <div v-if="tenantStore.isLoading" class="flex justify-center p-16"><Loader2 class="w-8 h-8 text-indigo-500 animate-spin" /></div>
            <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h2 class="text-xl font-bold text-slate-900">Recent Tickets</h2>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-100 text-slate-500 text-sm font-semibold border-b border-slate-200">
                      <th class="px-6 py-4">Ticket No.</th>
                      <th class="px-6 py-4">Plate Number</th>
                      <th class="px-6 py-4">Type</th>
                      <th class="px-6 py-4">Status</th>
                      <th class="px-6 py-4">Cost</th>
                      <th class="px-6 py-4">In Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="ticket in tenantStore.ticketHistory" :key="ticket._id" class="border-b border-slate-100 hover:bg-slate-50">
                      <td class="px-6 py-4 font-mono font-bold text-indigo-600">{{ ticket.ticketNumber || 'N/A' }}</td>
                      <td class="px-6 py-4 font-bold text-slate-900 uppercase">{{ ticket.vehiclePlateNumber }}</td>
                      <td class="px-6 py-4 font-medium text-slate-600">{{ ticket.vehicleType }}</td>
                      <td class="px-6 py-4">
                        <span :class="ticket.paymentStatus === 'PAID' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'" class="px-3 py-1 rounded-full text-xs font-bold">
                          {{ ticket.paymentStatus }}
                        </span>
                      </td>
                      <td class="px-6 py-4 font-bold text-slate-900">Rs. {{ ticket.totalCost.toFixed(2) }}</td>
                      <td class="px-6 py-4 font-medium text-slate-600">{{ new Date(ticket.checkInTime).toLocaleString() }}</td>
                    </tr>
                    <tr v-if="tenantStore.ticketHistory.length === 0">
                      <td colspan="6" class="px-6 py-8 text-center text-slate-500 font-medium">No tickets found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ── COMPANY PROFILE ── -->
          <div v-if="activeTab === 'profile' && isTenantAdmin">
            <div v-if="tenantStore.isLoading" class="flex justify-center p-16"><Loader2 class="w-8 h-8 text-indigo-500 animate-spin" /></div>
            <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div><h2 class="text-xl font-bold text-slate-900">Business Details</h2><p class="text-slate-500 text-sm mt-1">Update your company's identity and contacts.</p></div>
                <div class="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm"><Building2 class="w-7 h-7 text-indigo-300" /></div>
              </div>
              <div class="p-6 md:p-8">
                <form @submit.prevent="handleUpdate" class="space-y-6 max-w-2xl">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="text-sm font-semibold text-slate-700">Company Name</label>
                      <input v-model="tenantStore.profile.companyName" type="text" class="mt-1.5 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-medium" />
                    </div>
                    <div>
                      <label class="text-sm font-semibold text-slate-700">Owner Name</label>
                      <input v-model="tenantStore.profile.ownerName" disabled class="mt-1.5 w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium cursor-not-allowed" />
                    </div>
                    <div>
                      <label class="text-sm font-semibold text-slate-700">Contact Number</label>
                      <input v-model="tenantStore.profile.contactNumber" type="text" class="mt-1.5 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-medium" />
                    </div>
                    <div>
                      <label class="text-sm font-semibold text-slate-700">Registered Email</label>
                      <input v-model="tenantStore.profile.email" disabled class="mt-1.5 w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-medium cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-slate-700">Address</label>
                    <div class="relative mt-1.5"><MapPin class="w-5 h-5 absolute left-4 top-3.5 text-slate-400" /><input v-model="tenantStore.profile.address" type="text" class="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-medium" /></div>
                  </div>
                  <div class="pt-4 border-t border-slate-100 flex justify-end">
                    <button type="submit" :disabled="tenantStore.isLoading" class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
                      <Loader2 v-if="tenantStore.isLoading" class="w-5 h-5 animate-spin" /><span v-else>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- ── STAFF ── -->
          <div v-if="activeTab === 'staff' && isTenantAdmin">
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 class="text-xl font-bold text-slate-900">Staff & Operators</h2>
                  <p class="text-slate-500 text-sm mt-1">Manage POS device access and operator accounts.</p>
                </div>
                <button @click="showStaffForm = !showStaffForm" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md">
                  {{ showStaffForm ? 'Cancel' : '+ Add Operator' }}
                </button>
              </div>
              
              <!-- Staff Form -->
              <div v-if="showStaffForm" class="p-6 border-b border-slate-200 bg-indigo-50/50">
                <form @submit.prevent="handleCreateStaff" class="space-y-4 max-w-lg">
                  <div>
                    <label class="text-sm font-semibold text-slate-700">Full Name</label>
                    <input v-model="newStaffForm.name" type="text" required class="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900" />
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-slate-700">Email Address</label>
                    <input v-model="newStaffForm.email" type="email" required class="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900" />
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-slate-700">Password</label>
                    <input v-model="newStaffForm.password" type="password" required class="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900" />
                  </div>
                  <div>
                    <label class="text-sm font-semibold text-slate-700">POS API Key (Optional)</label>
                    <input v-model="newStaffForm.apiKey" type="text" placeholder="Leave blank to auto-generate" class="mt-1.5 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-mono text-sm" />
                  </div>
                  <button type="submit" :disabled="tenantStore.isLoading" class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-2">
                    <Loader2 v-if="tenantStore.isLoading" class="w-5 h-5 animate-spin" /><span v-else>Create Operator</span>
                  </button>
                </form>
              </div>

              <!-- Staff List -->
              <div class="overflow-x-auto">
                <div v-if="tenantStore.isLoading && !showStaffForm" class="flex justify-center p-8"><Loader2 class="w-8 h-8 text-indigo-500 animate-spin" /></div>
                <table v-else class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-100 text-slate-500 text-sm font-semibold border-b border-slate-200">
                      <th class="px-6 py-4">Name</th>
                      <th class="px-6 py-4">Email</th>
                      <th class="px-6 py-4">Role</th>
                      <th class="px-6 py-4">POS API Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="staff in tenantStore.staffList" :key="staff._id" class="border-b border-slate-100 hover:bg-slate-50">
                      <td class="px-6 py-4 font-bold text-slate-900">{{ staff.name }}</td>
                      <td class="px-6 py-4 font-medium text-slate-600">{{ staff.email }}</td>
                      <td class="px-6 py-4"><span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold">{{ staff.role }}</span></td>
                      <td class="px-6 py-4 font-mono text-xs text-slate-500 bg-slate-100 rounded p-1">{{ staff.apiKey || 'N/A' }}</td>
                    </tr>
                    <tr v-if="tenantStore.staffList.length === 0">
                      <td colspan="4" class="px-6 py-8 text-center text-slate-500 font-medium">No operators created yet.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>
