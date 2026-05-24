<script setup lang="ts">
import { ref, reactive } from "vue"
import {
  Loader2, Car, Building2, Mail, Lock, ArrowRight, Eye, EyeOff
} from "lucide-vue-next"
import { useRouter } from "vue-router"
import { useAuthStore } from "../../stores/auth"
import { toast } from "vue3-toastify"

const router = useRouter()
const authStore = useAuthStore()

const view = ref<"login" | "register" | "pos">("login")
const isLoading = ref(false)
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)

const loginData = reactive({ email: "", password: "", rememberMe: false })
const registerData = reactive({ businessName: "", slug: "", ownerName: "", ownerEmail: "", password: "" })
const posData = reactive({ apiKey: "" })

const toggleView = (target: "login" | "register" | "pos") => {
  view.value = target
}

const onSubmit = async () => {
  isLoading.value = true
  try {
    if (view.value === "login") {
      const res = await fetch("/api/v1/user/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          rememberMe: loginData.rememberMe
        })
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.errors?.[0]?.message || data.message || "Login failed"
        toast.error(msg)
        return
      }
      authStore.setAuth(data.token, data.user)
      toast.success(`Welcome back, ${data.user.name}!`)
      await new Promise(r => setTimeout(r, 600))
      if (data.user.role === "GATE_STAFF") {
        router.push("/operator")
      } else if (data.user.role === "TENANT_OWNER") {
        router.push("/tenant")
      } else {
        router.push("/")
      }
    } else if (view.value === "register") {
      const res = await fetch("/api/v1/user/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerData.businessName,
          corporate_email: registerData.ownerEmail,
          owner_name: registerData.ownerName,
          owner_email: registerData.ownerEmail,
          password: registerData.password,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.errors?.[0]?.message || data.message || "Registration failed"
        toast.error(msg)
        return
      }
      toast.success("Account created! Please sign in.")
      toggleView("login")
    } else if (view.value === "pos") {
      const res = await fetch("/api/v1/user/auth/pos-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(posData)
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.errors?.[0]?.message || data.message || "POS Login failed"
        toast.error(msg)
        return
      }
      authStore.setAuth(data.token, data.user)
      toast.success(`POS Terminal activated.`)
      await new Promise(r => setTimeout(r, 600))
      router.push("/operator")
    }
  } catch {
    toast.error("Network error. Please check your connection.")
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex bg-slate-50 font-sans">
    
    <!-- LEFT PANEL: Dynamic Auth -->
    <div class="w-full lg:w-[45%] xl:w-5/12 flex flex-col justify-center px-8 sm:px-16 lg:px-20 relative overflow-y-auto bg-white shadow-2xl z-10 py-16">
      
      <!-- Logo Top -->
      <div class="absolute top-8 left-8 sm:left-16 lg:left-20 flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Car class="text-white w-6 h-6" />
        </div>
        <span class="font-bold text-xl tracking-tight text-slate-900">ParkSaaS<span class="text-emerald-600">Pro</span></span>
      </div>

      <div class="w-full max-w-sm mx-auto mt-20">
        
        <!-- Toggle Tabs with sliding indicator -->
        <div class="flex p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-xl mb-10 relative">
          <!-- Animated Background Pill -->
          <div class="absolute inset-y-1.5 w-[calc(33.33%-6px)] bg-white rounded-lg shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)] transition-all duration-500 cubic-bezier-out"
               :class="{'left-1.5': view === 'login', 'left-[calc(33.33%+4px)]': view === 'register', 'left-[calc(66.66%+1px)]': view === 'pos'}"></div>
          
          <button @click="toggleView('login')" 
                  class="relative flex-1 py-2.5 text-sm font-semibold transition-colors duration-300 z-10 rounded-lg outline-none"
                  :class="view === 'login' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'">
            Login
          </button>
          
          <button @click="toggleView('register')" 
                  class="relative flex-1 py-2.5 text-sm font-semibold transition-colors duration-300 z-10 rounded-lg outline-none"
                  :class="view === 'register' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'">
            New Tenant
          </button>

          <button @click="toggleView('pos')" 
                  class="relative flex-1 py-2.5 text-sm font-semibold transition-colors duration-300 z-10 rounded-lg outline-none"
                  :class="view === 'pos' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'">
            POS Login
          </button>
        </div>

        <!-- Form Container with Sliding Transitions -->
        <div class="relative min-h-[400px]">
          <Transition name="slide-fade" mode="out-in">
            
            <!-- LOGIN FORM -->
            <form v-if="view === 'login'" @submit.prevent="onSubmit" class="space-y-6 w-full absolute inset-0">
              <div class="space-y-2">
                <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back.</h2>
                <p class="text-slate-500">Authenticate to access the control center.</p>
              </div>

              <div class="space-y-5 pt-4">
                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-slate-700">Operator Email</label>
                  <div class="relative group">
                    <Mail class="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input v-model="loginData.email" type="email" placeholder="admin@facility.com" required
                           class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium" />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-semibold text-slate-700">Master Password</label>
                    <a href="#" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Forgot?</a>
                  </div>
                  <div class="relative group">
                    <Lock class="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input v-model="loginData.password" :type="showLoginPassword ? 'text' : 'password'" placeholder="••••••••" required
                           class="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 font-medium tracking-widest" />
                    <button type="button" @click="showLoginPassword = !showLoginPassword" class="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
                      <EyeOff v-if="showLoginPassword" class="h-5 w-5" />
                      <Eye v-else class="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 pt-1">
                  <input type="checkbox" id="rememberMe" v-model="loginData.rememberMe" 
                         class="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                  <label for="rememberMe" class="text-sm font-medium text-slate-600 cursor-pointer select-none">Keep session active (30 days)</label>
                </div>
              </div>

              <button type="submit" :disabled="isLoading" 
                      class="w-full bg-[#10b981] hover:bg-[#059669] disabled:bg-[#10b981]/50 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group shadow-xl shadow-[#10b981]/20 mt-8">
                <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
                <span v-else>Access Dashboard</span>
                <ArrowRight v-if="!isLoading" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <!-- REGISTER FORM -->
            <form v-else-if="view === 'register'" @submit.prevent="onSubmit" class="space-y-6 w-full absolute inset-0">
              <div class="space-y-2">
                <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Deploy Node.</h2>
                <p class="text-slate-500">Initialize a new parking management instance.</p>
              </div>

              <div class="space-y-5 pt-4">
                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-slate-700">Business Name</label>
                  <div class="relative group">
                    <Building2 class="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input v-model="registerData.businessName" type="text" placeholder="Acme Parking Ltd." required
                           class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium" />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-slate-700">URL Slug <span class="text-slate-400 font-normal">(e.g. acme-parking)</span></label>
                  <input v-model="registerData.slug" type="text" placeholder="acme-parking" required
                         class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium lowercase" />
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-slate-700">Owner Name</label>
                  <input v-model="registerData.ownerName" type="text" placeholder="John Doe" required
                         class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium" />
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-slate-700">Admin Contact Email</label>
                  <div class="relative group">
                    <Mail class="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input v-model="registerData.ownerEmail" type="email" placeholder="admin@acmeparking.com" required
                           class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 placeholder:text-slate-400 font-medium" />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-slate-700">Master Password</label>
                  <div class="relative group">
                    <Lock class="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input v-model="registerData.password" :type="showRegisterPassword ? 'text' : 'password'" placeholder="••••••••" required minlength="8"
                           class="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 font-medium tracking-widest" />
                    <button type="button" @click="showRegisterPassword = !showRegisterPassword" class="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
                      <EyeOff v-if="showRegisterPassword" class="h-5 w-5" />
                      <Eye v-else class="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" :disabled="isLoading" 
                      class="w-full bg-[#10b981] hover:bg-[#059669] disabled:bg-[#10b981]/50 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group shadow-xl shadow-[#10b981]/20 mt-8">
                <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
                <span v-else>Register Facility</span>
                <ArrowRight v-if="!isLoading" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <!-- POS LOGIN FORM -->
            <form v-else-if="view === 'pos'" @submit.prevent="onSubmit" class="space-y-6 w-full absolute inset-0">
              <div class="space-y-2">
                <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">POS Terminal.</h2>
                <p class="text-slate-500">Authenticate using device API Key.</p>
              </div>

              <div class="space-y-5 pt-4">
                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-slate-700">API Key</label>
                  <div class="relative group">
                    <Lock class="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input v-model="posData.apiKey" type="password" placeholder="••••••••••••••••" required
                           class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-slate-900 font-medium tracking-widest" />
                  </div>
                </div>
              </div>

              <button type="submit" :disabled="isLoading" 
                      class="w-full bg-[#10b981] hover:bg-[#059669] disabled:bg-[#10b981]/50 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group shadow-xl shadow-[#10b981]/20 mt-8">
                <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
                <span v-else>Activate Terminal</span>
                <ArrowRight v-if="!isLoading" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

          </Transition>
        </div>

      </div>
      
      <!-- Footer details -->
      <div class="absolute bottom-8 left-8 sm:left-16 lg:left-20 text-xs text-slate-400 font-medium tracking-wide">
        &copy; 2026 ParkSaaS Systems Inc. &middot; <a href="#" class="hover:text-slate-600 transition-colors">Privacy</a>
      </div>
    </div>

    <!-- RIGHT PANEL: POS / Enterprise Marketing -->
    <div class="hidden lg:flex lg:w-[55%] xl:w-7/12 bg-[#0a0f1c] relative overflow-hidden flex-col items-center justify-center p-12 lg:p-20">
      
      <!-- Futuristic Background Gradients & Grid -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0d1627] via-[#0a0f1c] to-[#0a0f1c]"></div>
      <!-- Grid overlay -->
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      <!-- Glow orbs -->
      <div class="absolute top-0 right-0 -mr-48 -mt-48 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]"></div>
      <div class="absolute bottom-0 left-0 -ml-48 -mb-48 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px]"></div>

      <!-- Feature showcase card -->
      <div class="relative z-10 w-full max-w-[560px]">
        
        <div class="bg-[#0f1522] border border-white/[0.04] rounded-[24px] p-10 shadow-2xl">
          
          <div class="space-y-6">
            <!-- Badge -->
           
            
            <!-- Headline -->
            <div class="space-y-1">
              <h2 class="text-[40px] font-bold text-white tracking-tight leading-[1.1]">
                Enterprise-grade
              </h2>
              <h2 class="text-[40px] font-bold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Parking Intelligence
              </h2>
            </div>
            
            <!-- Paragraph -->
            <p class="text-[#8b95a5] leading-relaxed text-[15px]">
              Control boom gates, monitor live occupancy, and manage dynamic pricing in real-time. Designed specifically for high-throughput commercial and residential facilities.
            </p>
          </div>

         
            
           
        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
/* Slide-fade animation for the forms */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Ensure absolute positioning so they slide over each other without layout jumps */
.slide-fade-leave-active {
  position: absolute;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Custom bezier for the tab sliding indicator */
.cubic-bezier-out {
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
</style>