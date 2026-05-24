<template>
  <footer class="bg-slate-200 text-slate-700 border-t border-slate-300">
    <div class="max-w-6xl mx-auto px-6 py-10">
      <div class="grid gap-8 md:grid-cols-3 items-center justify-items-center text-center">
        <div class="flex flex-col items-center">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Car class="text-white w-7 h-7" />
            </div>
            <div class="text-left">
              <div class="text-slate-900 font-bold text-xl tracking-tight leading-none">ParkSaaS<span class="text-emerald-600">Pro</span></div>
              <div class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Parking Management</div>
            </div>
          </div>
          <p class="mt-3 text-sm text-slate-600">Smart parking management demo. Dummy data shown.</p>
        </div>

        <div>
          <h4 class="font-semibold text-slate-900">List Content</h4>
          <ul class="mt-3 space-y-1 text-sm text-slate-600">
            <li>Real-time parking occupancy</li>
            <li>QR based check-in and check-out</li>
            <li>Role-based dashboard access</li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold text-slate-900">Contact</h4>
          <p class="mt-3 text-sm">support@example.com</p>
          <p class="text-sm">+1 (555) 123-4567</p>
        </div>
      </div>
    </div>
    <div class="border-t border-slate-300 text-center py-4 text-sm text-slate-600">© 2026 ParkSaaSPro — Sample Data</div>
  </footer>
</template>

<script setup lang="ts">
import { Car } from "lucide-vue-next"
</script>

<style scoped>
</style>
