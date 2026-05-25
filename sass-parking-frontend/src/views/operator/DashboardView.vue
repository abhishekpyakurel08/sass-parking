<script setup lang="ts">
import { ref, reactive } from "vue"
import { Car, Building2, Ticket, CheckCircle, LogOut, BarChart3, Loader2 } from "lucide-vue-next"
import { useRouter } from "vue-router"
import { useAuthStore } from "../../stores/auth"
import { useOperatorStore } from "../../stores/operator"

const router = useRouter()
const authStore = useAuthStore()
const operatorStore = useOperatorStore()

const activeTab = ref<"check-in" | "check-out" | "stats">("check-in")

// Check-in form
const checkInForm = reactive({ vehiclePlateNumber: "", vehicleType: "CAR" }) // Removed 'floor_level'
const checkInSuccess = ref(false)
const assignedSlot = ref("") // This can also be removed if not needed elsewhere for display
const checkInQrCode = ref("")

// Check-out form
const checkOutForm = reactive({ vehiclePlateNumber: "" })
// Updated type to match backend response (duration_hours, total_amount, subtotal, discount)
const checkOutSummary = ref<{ duration_hours: number; rate_per_hour: number; total_amount: number; subtotal: number; discount: number } | null>(null) 

const handleLogout = async () => {
  await authStore.logout()
  router.push("/")
}

const submitCheckIn = async () => {
  checkInSuccess.value = false
  try {
    const data = await operatorStore.checkIn(checkInForm)
    checkInSuccess.value = true
    // assignedSlot.value = data.assignedSlot // Removed as slot assignment is no longer tracked
    checkInQrCode.value = data.qrCode
    checkInForm.vehiclePlateNumber = ""
    // checkInForm.floor_level = "" // Removed as floor_level is no longer tracked
  } catch {
    // Toast already shown by store
  }
}

const submitCheckOut = async () => {
  checkOutSummary.value = null
  try {
    const data = await operatorStore.checkOut(checkOutForm)
    checkOutSummary.value = data.summary
    checkOutForm.vehiclePlateNumber = ""
  } catch {
    // Toast already shown by store
  }
}

const switchTab = (tab: "check-in" | "check-out" | "stats") => {
  activeTab.value = tab
  if (tab === "stats") operatorStore.fetchStats()
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
    
    <!-- Top Navigation -->
    <header class="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Car class="text-white w-6 h-6" />
        </div>
        <span class="font-bold text-xl tracking-tight text-slate-900">ParkSaaS<span class="text-emerald-600">Pro</span></span>
        <span class="ml-4 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
          Operator Terminal
        </span>
      </div>
      <button @click="handleLogout" class="flex items-center gap-2 text-slate-600 hover:text-red-600 font-semibold transition-colors bg-slate-100 hover:bg-red-50 px-4 py-2 rounded-lg">
        <LogOut class="w-4 h-4" />
        Sign Out
      </button>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-slate-200 flex flex-col p-4 gap-2">
        <button @click="switchTab('check-in')" :class="['flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all outline-none', activeTab === 'check-in' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50']">
          <Building2 class="w-5 h-5" />
          Vehicle Entry
        </button>
        <button @click="switchTab('check-out')" :class="['flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all outline-none', activeTab === 'check-out' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50']">
          <LogOut class="w-5 h-5" />
          Vehicle Exit
        </button>
        <button @click="switchTab('stats')" :class="['flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all outline-none', activeTab === 'stats' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50']">
          <BarChart3 class="w-5 h-5" />
          Daily Operations
        </button>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto p-8">
        
        <div class="max-w-4xl mx-auto space-y-8">
          
          <!-- CHECK-IN SECTION -->
          <div v-if="activeTab === 'check-in'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Vehicle Arrival</h2>
            <p class="text-slate-500 mb-8">Process new vehicles entering the parking facility.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <form @submit.prevent="submitCheckIn" class="space-y-5">
                  <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700">License Plate</label>
                    <input v-model="checkInForm.vehiclePlateNumber" type="text" placeholder="e.g. ABC-1234" required
                           class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 font-medium uppercase" />
                  </div>
                  
                  <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700">Vehicle Class</label>
                    <select v-model="checkInForm.vehicleType" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 font-medium">
                      <option value="BIKE">Motorcycle</option>
                      <option value="CAR">Standard Car</option>
                      <option value="TRUCK">Truck / Heavy</option>
                      <option value="SUV">SUV</option>
                      <option value="BUS">Bus</option>
                    </select>
                  </div>

                  <!-- Removed Floor Preference as it's no longer tracked -->
                  <!--
                  <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700">Floor Preference (Optional)</label>
                    <input v-model="checkInForm.floor_level" type="text" placeholder="e.g. Ground"
                           class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 font-medium" />
                  </div>
                  -->

                  <button type="submit" :disabled="operatorStore.isLoading" 
                          class="w-full bg-[#10b981] hover:bg-[#059669] disabled:bg-[#10b981]/50 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 mt-4">
                    <Loader2 v-if="operatorStore.isLoading" class="w-5 h-5 animate-spin" />
                    <span v-else>Open Gate & Check In</span>
                  </button>
                </form>
              </div>

              <!-- Success Card -->
              <div v-if="checkInSuccess" class="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl text-white shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                <div class="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
                <div class="flex items-center gap-3 mb-6">
                  <CheckCircle class="text-emerald-400 w-8 h-8" />
                  <h3 class="text-2xl font-bold">Access Granted</h3>
                </div>
                
                <div class="space-y-4 relative z-10">
                  <!-- Removed Assigned Bay display -->
                  <!--
                  <div class="bg-white/10 rounded-xl p-4 flex justify-between items-center backdrop-blur-sm border border-white/5">
                    <span class="text-slate-400 font-medium">Assigned Bay</span>
                    <span class="text-2xl font-black text-emerald-400">{{ assignedSlot || 'N/A' }}</span>
                  </div>
                  -->
                  
                  <div v-if="checkInQrCode" class="mt-6 flex flex-col items-center bg-white p-4 rounded-xl">
                    <img :src="checkInQrCode" alt="Parking QR" class="w-48 h-48 rounded-lg shadow-sm" />
                    <p class="text-slate-500 text-sm font-semibold mt-3">Scan at exit terminal</p>
                  </div>
                </div>
              </div>
              
              <div v-else class="hidden md:flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-400">
                <Ticket class="w-16 h-16 mb-4 opacity-50" />
                <p class="font-medium">Ticket will appear here</p>
              </div>
            </div>
          </div>

          <!-- CHECK-OUT SECTION -->
          <div v-if="activeTab === 'check-out'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Vehicle Departure</h2>
            <p class="text-slate-500 mb-8">Process exiting vehicles and collect payments.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <form @submit.prevent="submitCheckOut" class="space-y-5">
                  <div class="space-y-1.5">
                    <label class="text-sm font-semibold text-slate-700">License Plate or Scan QR</label>
                    <input v-model="checkOutForm.vehiclePlateNumber" type="text" placeholder="e.g. ABC-1234" required
                           class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 font-medium uppercase" />
                  </div>
                  
                  <button type="submit" :disabled="operatorStore.isLoading" 
                          class="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-900/50 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20 mt-4">
                    <Loader2 v-if="operatorStore.isLoading" class="w-5 h-5 animate-spin" />
                    <span v-else>Calculate Fare & Exit</span>
                  </button>
                </form>
              </div>

              <!-- Check-out Summary -->
              <div v-if="checkOutSummary" class="bg-white border-2 border-emerald-500 p-8 rounded-2xl shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                <div class="flex items-center gap-3 mb-6 text-emerald-600">
                  <CheckCircle class="w-8 h-8" />
                  <h3 class="text-2xl font-bold">Payment Settled</h3>
                </div>
                
                <div class="space-y-3">
                  <div class="flex justify-between items-center py-2 border-b border-slate-100">
                    <span class="text-slate-500 font-medium">Duration</span>
                    <span class="font-bold text-slate-900">{{ Math.floor(checkOutSummary.duration_hours) }} hr(s) {{ Math.round((checkOutSummary.duration_hours % 1) * 60) }} min</span>
                  </div>
                  <div class="flex justify-between items-center py-2 border-b border-slate-100">
                    <span class="text-slate-500 font-medium">Rate Base</span>
                    <span class="font-bold text-slate-900">Rs. {{ checkOutSummary.rate_per_hour }}/hr</span>
                  </div>
                  <div class="flex justify-between items-center py-2 border-b border-slate-100">
                    <span class="text-slate-500 font-medium">Subtotal</span>
                    <span class="font-bold text-slate-900">Rs. {{ checkOutSummary.subtotal.toFixed(2) }}</span>
                  </div>
                  <div v-if="checkOutSummary.discount > 0" class="flex justify-between items-center py-2 border-b border-slate-100">
                    <span class="text-slate-500 font-medium">Discount</span>
                    <span class="font-bold text-red-500">- Rs. {{ checkOutSummary.discount.toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between items-center pt-4 mt-2">
                    <span class="text-lg text-slate-900 font-black">Total Due</span>
                    <span class="text-3xl font-black text-emerald-600">Rs. {{ checkOutSummary.total_amount.toFixed(2) }}</span>
                  </div>
                </div>
                
                <div class="mt-8 flex justify-center">
                  <button @click="checkOutSummary = null" class="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg font-semibold hover:bg-slate-200 transition-colors">
                    Next Vehicle
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- STATS SECTION -->
          <div v-if="activeTab === 'stats'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Shift Overview</h2>
            <p class="text-slate-500 mb-8">Real-time metrics for today's parking operations.</p>
            
            <div v-if="operatorStore.stats" class="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <div class="flex items-center gap-3 text-slate-500 mb-4">
                  <Car class="w-5 h-5 text-blue-500" />
                  <h3 class="font-bold">Vehicles Processed</h3>
                </div>
                <p class="text-4xl font-black text-slate-900">{{ operatorStore.stats.totalVehicles }}</p>
              </div>

              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <div class="flex items-center gap-3 text-slate-500 mb-4">
                  <CheckCircle class="w-5 h-5 text-emerald-500" />
                  <h3 class="font-bold">Completed Sessions</h3>
                </div>
                <p class="text-4xl font-black text-slate-900">{{ operatorStore.stats.completedSessions }}</p>
              </div>

              <div class="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg shadow-emerald-500/30 flex flex-col justify-between text-white">
                <div class="flex items-center gap-3 text-emerald-100 mb-4">
                  <BarChart3 class="w-5 h-5" />
                  <h3 class="font-bold">Daily Revenue</h3>
                </div>
                <p class="text-4xl font-black">Rs. {{ operatorStore.stats.totalRevenue.toFixed(2) }}</p>
              </div>

            </div>
            <div v-else class="flex justify-center p-12">
              <Loader2 class="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>
