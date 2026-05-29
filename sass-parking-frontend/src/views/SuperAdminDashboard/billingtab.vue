<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import { CreditCard, TrendingUp, DollarSign, Users, RefreshCcw, Info } from "lucide-vue-next";

const store = useSuperadminStore();

const isDark = ref(document.documentElement.classList.contains("dark"));
let observer: MutationObserver | null = null;
onMounted(() => {
  observer = new MutationObserver(() => { isDark.value = document.documentElement.classList.contains("dark"); });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
});
onUnmounted(() => observer?.disconnect());

const PLAN_PRICES: Record<string, number> = { BASIC: 12500, PREMIUM: 35000, ENTERPRISE: 85000 };
const PLAN_ICONS = [DollarSign, Users, TrendingUp];
const PLAN_COLORS_LIGHT = ["bg-zinc-100 text-zinc-700", "bg-amber-50 text-amber-700", "bg-violet-50 text-violet-700"];
const PLAN_COLORS_DARK  = ["bg-zinc-800 text-zinc-300", "bg-amber-950/30 text-amber-300", "bg-violet-950/30 text-violet-300"];

const tierDist = computed(() => store.tierDistribution);
const totalMRR = computed(() => store.monthlyRecurringRevenue);

const fmtRs = (n: number) => `Rs. ${n.toLocaleString('en-IN')}`;

// SVG donut segments
const donutSegments = computed(() => {
  if (totalMRR.value === 0) return [];
  const colors = ['#3b82f6', '#f59e0b', '#8b5cf6'];
  let cumPct = 0;
  return tierDist.value.map((tier, idx) => {
    const pct = (tier.mrrContribution / totalMRR.value) * 100;
    const startPct = cumPct;
    cumPct += pct;
    const toRad = (p: number) => (p / 100) * 2 * Math.PI - Math.PI / 2;
    const r = 45, cx = 60, cy = 60, ir = 28;
    const s = toRad(startPct), e = toRad(cumPct);
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const x3 = cx + ir * Math.cos(e), y3 = cy + ir * Math.sin(e);
    const x4 = cx + ir * Math.cos(s), y4 = cy + ir * Math.sin(s);
    const large = pct > 50 ? 1 : 0;
    return {
      name: tier.name, pct, count: tier.count, mrr: tier.mrrContribution,
      color: colors[idx % colors.length],
      path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${ir} ${ir} 0 ${large} 0 ${x4} ${y4} Z`,
    };
  });
});

const hoveredSegment = ref<null | { name: string; mrr: number; pct: number }>(null);
</script>

<template>
  <div class="space-y-6">
    <!-- Empty State -->
    <div v-if="store.tenants.length === 0"
      class="rounded-2xl border p-10 text-center transition-colors"
      :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'">
      <Info class="w-8 h-8 mx-auto mb-3" :class="isDark ? 'text-zinc-500' : 'text-slate-300'" />
      <p class="text-sm font-bold" :class="isDark ? 'text-zinc-400' : 'text-slate-500'">No tenant billing data available.</p>
      <p class="text-xs mt-1" :class="isDark ? 'text-zinc-600' : 'text-slate-400'">Load tenants from the Tenants tab first.</p>
      <button @click="store.fetchTenants()" class="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
        <RefreshCcw class="w-3.5 h-3.5" :class="store.isLoading ? 'animate-spin' : ''" />
        Load Tenants
      </button>
    </div>

    <template v-else>
      <!-- Tier MRR Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="(tier, idx) in tierDist" :key="tier.name"
          class="rounded-2xl border p-5 transition-colors relative overflow-hidden"
          :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">
          <div class="flex items-start justify-between mb-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" :class="isDark ? PLAN_COLORS_DARK[idx] : PLAN_COLORS_LIGHT[idx]">
              <component :is="PLAN_ICONS[idx]" class="w-4 h-4" />
            </div>
            <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border rounded"
              :class="isDark ? PLAN_COLORS_DARK[idx] + ' border-zinc-700' : PLAN_COLORS_LIGHT[idx] + ' border-zinc-200'">
              {{ tier.name }}
            </span>
          </div>
          <h3 class="text-2xl font-black" :class="isDark ? 'text-white' : 'text-slate-900'">
            {{ fmtRs(tier.mrrContribution) }}
          </h3>
          <p class="text-xs mt-1" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">Monthly Recurring Revenue</p>
          <div class="flex justify-between items-center text-[10px] mt-3 pt-3 border-t"
            :class="isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-100 text-slate-400'">
            <span class="font-semibold">{{ tier.count }} active plan{{ tier.count !== 1 ? 's' : '' }}</span>
            <span class="font-bold">
              {{ totalMRR > 0 ? ((tier.mrrContribution / totalMRR) * 100).toFixed(0) : 0 }}% share
            </span>
          </div>
        </div>
        <!-- Total MRR Summary Card -->
        <div v-if="tierDist.length < 3"
          class="rounded-2xl border p-5 transition-colors flex flex-col justify-between"
          :class="isDark ? 'bg-zinc-800/40 border-zinc-800' : 'bg-slate-50 border-slate-200'">
          <p class="text-[10px] font-bold uppercase tracking-wider" :class="isDark ? 'text-zinc-600' : 'text-slate-400'">Total Platform MRR</p>
          <h3 class="text-2xl font-black mt-2" :class="isDark ? 'text-white' : 'text-slate-900'">{{ fmtRs(totalMRR) }}</h3>
          <p class="text-xs" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">Across {{ store.tenants.length }} tenants</p>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Bar Chart -->
        <div class="rounded-2xl border p-5 transition-colors"
          :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">
          <h4 class="font-bold text-sm mb-1" :class="isDark ? 'text-white' : 'text-slate-900'">Subscriptions by Tier</h4>
          <p class="text-xs mb-4" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">Active accounts across plan tiers</p>
          <div v-if="tierDist.length === 0" class="py-8 text-center text-xs" :class="isDark ? 'text-zinc-600' : 'text-slate-300'">No data</div>
          <svg v-else viewBox="0 0 420 160" class="w-full h-36 overflow-visible">
            <g v-for="(tier, idx) in tierDist" :key="tier.name">
              <text :x="16" :y="30 + idx * 50" text-anchor="middle" class="text-xs font-bold"
                :fill="isDark ? '#a1a1aa' : '#374151'" font-size="10">{{ tier.name.charAt(0) }}</text>
              <text :x="44" :y="30 + idx * 50" class="text-xs font-bold capitalize"
                :fill="isDark ? '#d4d4d8' : '#374151'" font-size="11">{{ tier.name.toLowerCase() }}</text>
              <!-- Track -->
              <rect x="110" :y="18 + idx * 50" width="250" height="16" rx="8"
                :fill="isDark ? '#27272a' : '#f1f5f9'" />
              <!-- Fill -->
              <rect x="110" :y="18 + idx * 50"
                :width="Math.max(store.tenants.length > 0 ? (tier.count / Math.max(...tierDist.map(d => d.count), 1)) * 250 : 4, 4)"
                height="16" rx="8"
                :fill="['#3b82f6','#f59e0b','#8b5cf6'][idx % 3]"
                class="transition-all duration-700" />
              <!-- Count -->
              <text :x="375" :y="30 + idx * 50" font-size="11" font-weight="700"
                :fill="isDark ? '#fff' : '#111827'">{{ tier.count }}</text>
            </g>
          </svg>
        </div>

        <!-- Donut Chart -->
        <div class="rounded-2xl border p-5 transition-colors"
          :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">
          <h4 class="font-bold text-sm mb-1" :class="isDark ? 'text-white' : 'text-slate-900'">MRR Revenue Share</h4>
          <p class="text-xs mb-4" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">Income distribution across tiers</p>
          <div class="flex items-center gap-6">
            <!-- SVG Donut -->
            <div class="relative flex-shrink-0">
              <svg viewBox="0 0 120 120" class="w-32 h-32">
                <circle cx="60" cy="60" r="45" fill="none" :stroke="isDark ? '#27272a' : '#f1f5f9'" stroke-width="17" />
                <path v-for="seg in donutSegments" :key="seg.name" :d="seg.path" :fill="seg.color"
                  class="transition-opacity hover:opacity-80 cursor-pointer"
                  @mouseenter="hoveredSegment = { name: seg.name, mrr: seg.mrr, pct: seg.pct }"
                  @mouseleave="hoveredSegment = null" />
                <text x="60" y="55" text-anchor="middle" font-size="8" font-weight="600" :fill="isDark ? '#71717a' : '#9ca3af'">Total MRR</text>
                <text x="60" y="70" text-anchor="middle" font-size="10" font-weight="900" :fill="isDark ? '#fff' : '#111827'">
                  {{ totalMRR >= 1000000 ? (totalMRR / 1000000).toFixed(1) + 'M' : (totalMRR / 1000).toFixed(0) + 'k' }}
                </text>
              </svg>
              <!-- Tooltip -->
              <div v-if="hoveredSegment"
                class="absolute -top-2 left-full ml-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10 shadow-xl"
                :class="isDark ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'">
                <p class="font-bold">{{ hoveredSegment.name }}</p>
                <p class="opacity-70 text-[10px]">{{ fmtRs(hoveredSegment.mrr) }} ({{ hoveredSegment.pct.toFixed(1) }}%)</p>
              </div>
            </div>
            <!-- Legend -->
            <div class="flex-1 space-y-2.5">
              <div v-for="(seg, idx) in donutSegments" :key="seg.name"
                class="flex items-center justify-between py-2 border-b last:border-0"
                :class="isDark ? 'border-zinc-800' : 'border-slate-100'"
                @mouseenter="hoveredSegment = { name: seg.name, mrr: seg.mrr, pct: seg.pct }"
                @mouseleave="hoveredSegment = null">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-sm" :style="{ backgroundColor: seg.color }"></span>
                  <span class="text-xs font-bold capitalize" :class="isDark ? 'text-zinc-300' : 'text-slate-700'">
                    {{ seg.name.toLowerCase() }}
                  </span>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold font-mono" :class="isDark ? 'text-white' : 'text-slate-900'">{{ seg.pct.toFixed(0) }}%</p>
                  <p class="text-[10px]" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">{{ seg.count }} accts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Billing Ledger -->
      <div class="space-y-2">
        <h3 class="text-sm font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">Partner Billing Ledger</h3>
        <div class="rounded-2xl border overflow-hidden transition-colors"
          :class="isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'">
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="text-[10px] font-bold uppercase tracking-wider border-b"
                :class="isDark ? 'bg-zinc-800/50 text-zinc-500 border-zinc-800' : 'bg-slate-50 text-slate-400 border-slate-200'">
                <tr>
                  <th class="px-5 py-3">Partner</th>
                  <th class="px-5 py-3">Plan</th>
                  <th class="px-5 py-3">Monthly Rate</th>
                  <th class="px-5 py-3">Billing Cycle</th>
                  <th class="px-5 py-3">Est. Next Payment</th>
                  <th class="px-5 py-3">Est. Total Paid</th>
                </tr>
              </thead>
              <tbody class="text-xs divide-y" :class="isDark ? 'divide-zinc-800' : 'divide-slate-100'">
                <tr v-for="t in store.tenants" :key="t._id" class="transition-colors"
                  :class="isDark ? 'hover:bg-zinc-800/20 text-zinc-300' : 'hover:bg-slate-50 text-slate-700'">
                  <td class="px-5 py-3 font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">{{ t.companyName || t.name }}</td>
                  <td class="px-5 py-3">
                    <span class="px-2 py-0.5 border rounded text-[9px] font-black uppercase"
                      :class="isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-100 text-zinc-800 border-zinc-200'">
                      {{ t.subscriptionPlan || 'BASIC' }}
                    </span>
                  </td>
                  <td class="px-5 py-3 font-mono font-bold">
                    {{ fmtRs(PLAN_PRICES[t.subscriptionPlan?.toUpperCase()] ?? 12500) }}
                  </td>
                  <td class="px-5 py-3 text-[10px] font-bold uppercase" :class="isDark ? 'text-zinc-500' : 'text-zinc-400'">Monthly</td>
                  <td class="px-5 py-3 font-mono text-[10px]" :class="isDark ? 'text-zinc-500' : 'text-slate-400'">2026-06-01</td>
                  <td class="px-5 py-3 font-mono font-bold" :class="isDark ? 'text-white' : 'text-zinc-900'">
                    {{ fmtRs((PLAN_PRICES[t.subscriptionPlan?.toUpperCase()] ?? 12500) * 12) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
