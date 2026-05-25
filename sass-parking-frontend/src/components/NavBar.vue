<template>
  <nav ref="navRoot" class="sticky top-0 z-50 bg-slate-50">
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
        <div class="hidden sm:flex items-center gap-6 sm:gap-10">
          <a
            href="#home"
            @click="handleNavClick('home')"
            :class="[
              'relative py-1 text-sm font-semibold transition-colors',
              activeSection === 'home' ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-emerald-500' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Home
          </a>
          <a
            href="#how-it-works"
            @click="handleNavClick('how-it-works')"
            :class="[
              'relative py-1 text-sm font-semibold transition-colors',
              activeSection === 'how-it-works' ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-emerald-500' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            How it works
          </a>
          <a
            href="#about"
            @click="handleNavClick('about')"
            :class="[
              'relative py-1 text-sm font-semibold transition-colors',
              activeSection === 'about' ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-emerald-500' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            About
          </a>
          <a
            href="#pricing"
            @click="handleNavClick('pricing')"
            :class="[
              'relative py-1 text-sm font-semibold transition-colors',
              activeSection === 'pricing' ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-emerald-500' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Pricing
          </a>
          <a
            href="#reviews"
            @click="handleNavClick('reviews')"
            :class="[
              'relative py-1 text-sm font-semibold transition-colors',
              activeSection === 'reviews' ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-emerald-500' : 'text-slate-600 hover:text-slate-900'
            ]"
          >
            Reviews
          </a>
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
        <div v-show="isMobileMenuOpen" class="absolute left-4 right-4 top-full z-50 mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:left-6 sm:right-6 sm:hidden">
          <div class="flex flex-col gap-4">
            <a
              href="#home"
              @click="handleNavClick('home')"
              :class="[
                'relative w-fit py-1 text-base font-semibold transition-colors',
                activeSection === 'home' ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-emerald-500' : 'text-slate-600'
              ]"
            >
              Home
            </a>
            <a
              href="#how-it-works"
              @click="handleNavClick('how-it-works')"
              :class="[
                'relative w-fit py-1 text-base font-semibold transition-colors',
                activeSection === 'how-it-works' ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-emerald-500' : 'text-slate-600'
              ]"
            >
              How it works
            </a>
            <a
              href="#about"
              @click="handleNavClick('about')"
              :class="[
                'relative w-fit py-1 text-base font-semibold transition-colors',
                activeSection === 'about' ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-emerald-500' : 'text-slate-600'
              ]"
            >
              About
            </a>
            <a
              href="#pricing"
              @click="handleNavClick('pricing')"
              :class="[
                'relative w-fit py-1 text-base font-semibold transition-colors',
                activeSection === 'pricing' ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-emerald-500' : 'text-slate-600'
              ]"
            >
              Pricing
            </a>
            <a
              href="#reviews"
              @click="handleNavClick('reviews')"
              :class="[
                'relative w-fit py-1 text-base font-semibold transition-colors',
                activeSection === 'reviews' ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-emerald-500' : 'text-slate-600'
              ]"
            >
              Reviews
            </a>
            <router-link
              to="/login"
              class="mt-2 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-600 hover:to-emerald-700"
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
const activeSection = ref("home")
const isClickScrolling = ref(false)
let scrollTimeout: any = null

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleNavClick = (section: string) => {
  isClickScrolling.value = true
  activeSection.value = section
  closeMobileMenu()

  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    isClickScrolling.value = false
  }, 800)
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

let sectionObserver: IntersectionObserver | null = null

const handleScroll = () => {
  if (isClickScrolling.value) return
  const scrollPosition = window.innerHeight + window.pageYOffset
  const pageHeight = document.documentElement.scrollHeight
  // If we're at the bottom, mark reviews as active
  if (scrollPosition >= pageHeight - 100) {
    activeSection.value = "reviews"
  }
}

onMounted(() => {
  document.addEventListener("pointerdown", handleOutsideClick)
  window.addEventListener("scroll", handleScroll)

  const sections = ["home", "how-it-works", "about", "pricing", "reviews"]
  sectionObserver = new IntersectionObserver((entries) => {
    if (isClickScrolling.value) return

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeSection.value = entry.target.id
      }
    })
  }, { 
    threshold: 0.2,
    rootMargin: "-10% 0px -70% 0px" 
  })

  sections.forEach(id => {
    const el = document.getElementById(id)
    if (el) sectionObserver?.observe(el)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleOutsideClick)
  window.removeEventListener("scroll", handleScroll)
  sectionObserver?.disconnect()
})
</script>

<style scoped>
</style>
