<template>
  <nav ref="navRoot" class="relative z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
    <div class="relative max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Car class="text-white w-6 h-6" />
          </div>
          <div class="leading-tight">
            <div class="font-bold text-lg tracking-tight text-slate-900">ParkSaaS<span class="text-emerald-600">Pro</span></div>
            <div class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Parking Management</div>
          </div>
        </div>
        <div class="hidden sm:flex items-center gap-2 sm:gap-3">
          <a href="#how-it-works" class="hidden sm:inline-flex items-center rounded-lg px-1.5 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 hover:underline hover:decoration-emerald-500 hover:underline-offset-4">How it works</a>
          <a href="#about" class="hidden sm:inline-flex items-center rounded-lg px-1.5 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 hover:underline hover:decoration-emerald-500 hover:underline-offset-4">About</a>
          <a href="#pricing" class="hidden sm:inline-flex items-center rounded-lg px-1.5 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 hover:underline hover:decoration-emerald-500 hover:underline-offset-4">Pricing</a>
          <a href="#reviews" class="hidden sm:inline-flex items-center rounded-lg px-1.5 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 hover:underline hover:decoration-emerald-500 hover:underline-offset-4">Reviews</a>
          <router-link
            to="/login"
            class="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-600 hover:to-emerald-700"
          >
            Login
          </router-link>
        </div>

        <button
          type="button"
          class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 sm:hidden"
          @click="toggleMobileMenu"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Toggle navigation menu"
        >
          <component :is="isMobileMenuOpen ? X : Menu" class="h-5 w-5" />
        </button>
      </div>

      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-show="isMobileMenuOpen" class="absolute left-4 right-4 top-full z-50 mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:left-6 sm:right-6 sm:hidden">
          <div class="flex flex-col gap-1">
            <a href="#how-it-works" class="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 hover:underline hover:decoration-emerald-500 hover:underline-offset-4" @click="closeMobileMenu">How it works</a>
            <a href="#about" class="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 hover:underline hover:decoration-emerald-500 hover:underline-offset-4" @click="closeMobileMenu">About</a>
            <a href="#pricing" class="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 hover:underline hover:decoration-emerald-500 hover:underline-offset-4" @click="closeMobileMenu">Pricing</a>
            <a href="#reviews" class="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 hover:underline hover:decoration-emerald-500 hover:underline-offset-4" @click="closeMobileMenu">Reviews</a>
            <router-link
              to="/login"
              class="mt-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-600 hover:to-emerald-700"
              @click="closeMobileMenu"
            >
              Login
            </router-link>
          </div>
        </div>
      </transition>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { Car, Menu, X } from "lucide-vue-next"

const navRoot = ref<HTMLElement | null>(null)
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleOutsideClick = (event: PointerEvent) => {
  if (!isMobileMenuOpen.value) {
    return
  }

  const target = event.target as Node | null

  if (target && navRoot.value && !navRoot.value.contains(target)) {
    closeMobileMenu()
  }
}

onMounted(() => {
  document.addEventListener("pointerdown", handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleOutsideClick)
})
</script>

<style scoped>
</style>
