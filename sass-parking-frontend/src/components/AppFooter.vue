<template>
  <footer class="bg-slate-50 text-slate-700 border-t border-slate-200">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 py-12 lg:py-14">
      <div class="grid gap-10 items-start justify-items-center text-center lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:gap-16 lg:justify-items-start lg:text-left">
        <div class="flex flex-col items-center lg:items-start">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Car class="text-white w-7 h-7" />
            </div>
            <div class="text-left">
              <div class="text-slate-900 font-bold text-xl tracking-tight leading-none">ParkSaaS<span class="text-emerald-600">Pro</span></div>
              <div class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Parking Management</div>
            </div>
          </div>
          <p class="mt-4 max-w-sm text-sm leading-7 text-slate-600">
            Smart parking management demo. Dummy data shown.
          </p>

          <div class="mt-6 flex items-center justify-center gap-3 lg:justify-start">
            <a href="#" aria-label="Facebook" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50">
              <Facebook class="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50">
              <Instagram class="h-4 w-4" />
            </a>
            <a href="#" aria-label="Twitter" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50">
              <Twitter class="h-4 w-4" />
            </a>
          </div>

          <div class="mt-6 space-y-3 text-sm text-slate-600">
            <a href="mailto:support@example.com" class="flex items-center gap-3 transition hover:text-emerald-600">
              <Mail class="h-4 w-4" />
              support@example.com
            </a>
            <a href="tel:+15551234567" class="flex items-center gap-3 transition hover:text-emerald-600">
              <Phone class="h-4 w-4" />
              +1 (555) 123-4567
            </a>
          </div>
        </div>

        <div class="flex flex-col items-center lg:items-start">
          <h4 class="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">Quick Link</h4>
          <ul class="mt-5 space-y-3 text-sm text-slate-600">
            <li><a href="#home" class="transition hover:text-emerald-600">Home</a></li>
            <li><a href="#how-it-works" class="transition hover:text-emerald-600">How it works</a></li>
            <li><a href="#about" class="transition hover:text-emerald-600">About</a></li>
            <li><a href="#pricing" class="transition hover:text-emerald-600">Pricing</a></li>
            <li><a href="#reviews" class="transition hover:text-emerald-600">Reviews</a></li>
          </ul>
        </div>

        <div class="flex flex-col items-center lg:items-start">
          <h4 class="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">Support</h4>
          <ul class="mt-5 space-y-3 text-sm text-slate-600">
            <li><a href="#" class="transition hover:text-emerald-600">Terms and Services</a></li>
            <li><a href="#" class="transition hover:text-emerald-600">Contact Us</a></li>
            <li><a href="#" class="transition hover:text-emerald-600">Privacy and Policy</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="border-t border-slate-200 py-4 text-center text-sm text-slate-500">© 2026 ParkSaaSPro — Sample Data</div>
  </footer>
</template>

<script setup lang="ts">
import { Car, Facebook, Instagram, Mail, Phone, Twitter } from "lucide-vue-next"
</script>

<style scoped>
</style>
