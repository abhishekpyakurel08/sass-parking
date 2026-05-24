<template>
  <nav class="bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
    <div class="max-w-6xl mx-auto px-6 py-4">
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
        <div class="flex items-center gap-2 sm:gap-3">
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
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { Car } from "lucide-vue-next"
</script>

<style scoped>
</style>
