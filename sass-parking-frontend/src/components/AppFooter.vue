<template>
  <footer class="nav-accent">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
      <div class="glass-panel p-6 rounded-2xl">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="text-xl font-black brand">ParkSaaS</div>
            <div class="text-sm muted hidden md:block">Built for parking operators</div>
          </div>
          <div class="flex items-center gap-4 flex-wrap justify-center">
            <a href="/terms" class="text-secondary text-sm">Terms</a>
            <a href="/privacy" class="text-secondary text-sm">Privacy</a>
            <a href="/contact" class="cta-ghost">Contact</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Car } from "lucide-vue-next"
</script>

<style scoped>
.footer-links a { margin-left: .5rem; }
</style>
