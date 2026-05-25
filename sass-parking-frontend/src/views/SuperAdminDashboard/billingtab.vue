<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin.ts";
import { CreditCard, TrendingUp, DollarSign, Users } from "lucide-vue-next";

const superadminStore = useSuperadminStore();

// --- Reactive Dark Mode Detection ---
const isDarkMode = ref(false);
const updateDarkMode = () => {
  isDarkMode.value = document.documentElement.classList.contains("dark");
};
let themeObserver: MutationObserver | null = null;

onMounted(() => {
  updateDarkMode();
  themeObserver = new MutationObserver(updateDarkMode);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  window.addEventListener("themechange", () => updateDarkMode());
});
onUnmounted(() => {
  themeObserver?.disconnect();
});

// Computations for SVG Distribution Bars
const computedTierDistribution = computed(() => {
  const dist = superadminStore.stats?.tierDistribution || [];
  return dist.map((d) => {
    const price = d.name.toUpperCase() === "BASIC" 
      ? 12500 
      : d.name.toUpperCase() === "PREMIUM" 
        ? 35000 
        : 85000;
    return {
      ...d,
      mrrContribution: d.count * price
    };
  });
});

const maxTierCount = computed(() => {
  const distributions = computedTierDistribution.value;
  if (distributions.length === 0) return 1;
  return Math.max(...distributions.map((d) => d.count), 1);
});

const maxMRR = computed(() => {
  const distributions = computedTierDistribution.value;
  if (distributions.length === 0) return 1;
  return Math.max(...distributions.map((d) => d.mrrContribution), 1);
});

// Chart colors
const chartColors = computed(() => ({
  text: isDarkMode.value ? "#F8F9FA" : "#1A1A1A", // Soft White vs Rich Black
  textMuted: isDarkMode.value ? "#B2BEB5" : "#6B7280", // Ash Gray vs Gray
  track: isDarkMode.value ? "#2B2B2B" : "#E5E7EB", // Charcoal vs Cool Gray
  bar1: isDarkMode.value ? "#F8F9FA" : "#111111", // Soft White vs Matte Black
  bar2: "#B2BEB5", // Ash Gray (Main Accent)
  bar3: isDarkMode.value ? "#6B7280" : "#DADADA", // Gray vs Light Gray
  border: isDarkMode.value ? "#111111" : "#DADADA", // Matte Black vs Light Gray
  cardBg: isDarkMode.value ? "#2B2B2B" : "#ffffff", // Charcoal vs White
  cardBorder: isDarkMode.value ? "#111111" : "#DADADA", // Matte Black vs Light Gray
}));

// Donut chart data
const donutData = computed(() => {
  const tiers = computedTierDistribution.value;
  const total = superadminStore.stats?.monthlyRecurringRevenue || 1;
  const colors = [
    chartColors.value.bar1,
    chartColors.value.bar2,
    chartColors.value.bar3,
  ];

  let cumulativePercent = 0;
  return tiers.map((tier, idx) => {
    const percent = ((tier.mrrContribution || 0) / total) * 100;
    const startAngle = (cumulativePercent / 100) * Math.PI * 2 - Math.PI / 2;
    cumulativePercent += percent;
    const endAngle = (cumulativePercent / 100) * Math.PI * 2 - Math.PI / 2;

    // Calculate SVG arc path
    const radius = 45;
    const cx = 60;
    const cy = 60;
    const innerRadius = 30;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const x3 = cx + innerRadius * Math.cos(endAngle);
    const y3 = cy + innerRadius * Math.sin(endAngle);
    const x4 = cx + innerRadius * Math.cos(startAngle);
    const y4 = cy + innerRadius * Math.sin(startAngle);

    const largeArc = percent > 50 ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      "Z",
    ].join(" ");

    return {
      name: tier.name,
      percent,
      count: tier.count,
      mrr: tier.mrrContribution || 0,
      color: colors[idx % colors.length],
      path,
    };
  });
});

// Tooltip for donut
const donutTooltip = ref<{
  name: string;
  value: number;
  percent: number;
} | null>(null);
</script>

<template>
  <div class="space-y-6">
    <!-- Revenue Metrics Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="(tierStats, idx) in computedTierDistribution"
        :key="tierStats.name"
        class="p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-all duration-300"
        :class="[
          isDarkMode
            ? 'bg-zinc-900 border-zinc-800'
            : 'bg-white border-slate-200',
          idx === 0 ? 'ring-1 ring-zinc-900/5 dark:ring-zinc-700/30' : '',
        ]"
      >
        <div class="flex items-center gap-2 mb-3">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center"
            :class="[
              idx === 0 ? (isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100') : '',
              idx === 1 ? (isDarkMode ? 'bg-zinc-800/70' : 'bg-slate-100') : '',
              idx === 2 ? (isDarkMode ? 'bg-zinc-800/50' : 'bg-gray-100') : '',
            ]"
          >
            <DollarSign
              v-if="idx === 0"
              class="w-4 h-4"
              :class="isDarkMode ? 'text-zinc-300' : 'text-zinc-700'"
            />
            <Users
              v-if="idx === 1"
              class="w-4 h-4"
              :class="isDarkMode ? 'text-zinc-400' : 'text-zinc-600'"
            />
            <TrendingUp
              v-if="idx === 2"
              class="w-4 h-4"
              :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-500'"
            />
          </div>
          <p
            class="text-[10px] font-black uppercase tracking-widest"
            :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-400'"
          >
            {{ tierStats.name }} Plan
          </p>
        </div>

        <h3
          class="text-2xl font-black font-mono"
          :class="isDarkMode ? 'text-white' : 'text-slate-900'"
        >
          Rs. {{ (tierStats.mrrContribution || 0).toLocaleString() }}
        </h3>
        <p
          class="text-xs mt-1"
          :class="isDarkMode ? 'text-zinc-500' : 'text-slate-400'"
        >
          Monthly Recurring Revenue
        </p>

        <div
          class="flex justify-between items-center text-[10px] mt-4 pt-3 border-t"
          :class="
            isDarkMode
              ? 'border-zinc-800 text-zinc-500'
              : 'border-slate-100 text-slate-400'
          "
        >
          <span class="font-semibold">{{ tierStats.count }} Active Plans</span>
          <span class="font-bold">
            {{
              (
                ((tierStats.mrrContribution || 0) /
                  (superadminStore.stats?.monthlyRecurringRevenue || 1)) *
                100
              ).toFixed(0)
            }}% share
          </span>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Enhanced Horizontal Bar Chart -->
      <div
        class="rounded-2xl p-6 border shadow-sm space-y-4 transition-colors duration-300"
        :class="
          isDarkMode
            ? 'bg-zinc-900 border-zinc-800'
            : 'bg-white border-slate-200'
        "
      >
        <div>
          <h4
            class="font-bold text-sm"
            :class="isDarkMode ? 'text-white' : 'text-slate-900'"
          >
            Active Subscriptions by Tier
          </h4>
          <p
            class="text-xs mt-1"
            :class="isDarkMode ? 'text-zinc-500' : 'text-slate-400'"
          >
            Distribution of active accounts across plan tiers
          </p>
        </div>

        <div class="py-2">
          <svg viewBox="0 0 420 160" class="w-full h-36 overflow-visible">
            <g
              v-for="(tier, idx) in computedTierDistribution"
              :key="tier.name"
            >
              <!-- Tier icon circle -->
              <circle
                :cx="16"
                :cy="28 + idx * 50"
                r="12"
                :fill="chartColors.track"
              />
              <text
                :x="16"
                :y="32 + idx * 50"
                text-anchor="middle"
                class="text-[10px] font-black"
                :fill="chartColors.text"
              >
                {{ tier.name.charAt(0) }}
              </text>

              <!-- Label -->
              <text
                x="34"
                :y="32 + idx * 50"
                class="text-xs font-bold capitalize"
                :fill="chartColors.text"
              >
                {{ tier.name.toLowerCase() }}
              </text>

              <!-- Track background -->
              <rect
                x="100"
                :y="20 + idx * 50"
                width="260"
                height="16"
                rx="8"
                :fill="chartColors.track"
              />

              <!-- Fill bar with animated width -->
              <rect
                x="100"
                :y="20 + idx * 50"
                :width="Math.max((tier.count / maxTierCount) * 260, 4)"
                height="16"
                rx="8"
                :fill="
                  idx === 0
                    ? chartColors.bar1
                    : idx === 1
                      ? chartColors.bar2
                      : chartColors.bar3
                "
                class="transition-all duration-700 ease-out"
              />

              <!-- Percentage label inside bar if wide enough -->
              <text
                v-if="tier.count / maxTierCount > 0.15"
                :x="100 + ((tier.count / maxTierCount) * 260) / 2"
                :y="31 + idx * 50"
                text-anchor="middle"
                class="text-[9px] font-black"
                fill="white"
              >
                {{ ((tier.count / maxTierCount) * 100).toFixed(0) }}%
              </text>

              <!-- Count badge -->
              <text
                :x="375"
                :y="32 + idx * 50"
                class="text-xs font-mono font-bold"
                :fill="chartColors.text"
              >
                {{ tier.count }}
              </text>
            </g>
          </svg>
        </div>
      </div>

      <!-- Enhanced Donut Chart -->
      <div
        class="rounded-2xl p-6 border shadow-sm flex flex-col justify-between transition-colors duration-300"
        :class="
          isDarkMode
            ? 'bg-zinc-900 border-zinc-800'
            : 'bg-white border-slate-200'
        "
      >
        <div>
          <h4
            class="font-bold text-sm"
            :class="isDarkMode ? 'text-white' : 'text-slate-900'"
          >
            MRR Revenue Share
          </h4>
          <p
            class="text-xs mt-1"
            :class="isDarkMode ? 'text-zinc-500' : 'text-slate-400'"
          >
            Income distribution across subscription tiers
          </p>
        </div>

        <div class="flex items-center gap-6 py-4">
          <!-- Donut Chart -->
          <div class="relative flex-shrink-0">
            <svg viewBox="0 0 120 120" class="w-32 h-32">
              <!-- Background ring -->
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                :stroke="chartColors.track"
                stroke-width="15"
              />

              <!-- Segments -->
              <path
                v-for="(segment, idx) in donutData"
                :key="idx"
                :d="segment.path"
                :fill="segment.color"
                class="transition-all duration-300 hover:opacity-80 cursor-pointer"
                @mouseenter="
                  donutTooltip = {
                    name: segment.name,
                    value: segment.mrr,
                    percent: segment.percent,
                  }
                "
                @mouseleave="donutTooltip = null"
              />

              <!-- Center text -->
              <text
                x="60"
                y="56"
                text-anchor="middle"
                class="text-[10px] font-bold"
                :fill="chartColors.textMuted"
              >
                Total MRR
              </text>
              <text
                x="60"
                y="72"
                text-anchor="middle"
                class="text-xs font-black"
                :fill="chartColors.text"
              >
                {{
                  (superadminStore.stats?.monthlyRecurringRevenue || 0) >
                  1000000
                    ? "1M+"
                    : (
                        (superadminStore.stats?.monthlyRecurringRevenue || 0) /
                        1000
                      ).toFixed(0) + "k"
                }}
              </text>
            </svg>

            <!-- Floating tooltip -->
            <div
              v-if="donutTooltip"
              class="absolute -top-2 left-full ml-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap z-10"
            >
              <p class="font-bold">{{ donutTooltip.name }}</p>
              <p class="font-mono text-[10px] opacity-80">
                Rs. {{ donutTooltip.value.toLocaleString() }} ({{
                  donutTooltip.percent.toFixed(1)
                }}%)
              </p>
            </div>
          </div>

          <!-- Legend -->
          <div class="flex-1 space-y-3">
            <div
              v-for="(tier, idx) in computedTierDistribution"
              :key="tier.name"
              class="flex items-center justify-between py-2 border-b last:border-0"
              :class="isDarkMode ? 'border-zinc-800' : 'border-slate-100'"
              @mouseenter="
                donutTooltip = {
                  name: tier.name,
                  value: tier.mrrContribution || 0,
                  percent:
                    ((tier.mrrContribution || 0) /
                      (superadminStore.stats?.monthlyRecurringRevenue || 1)) *
                    100,
                }
              "
              @mouseleave="donutTooltip = null"
            >
              <div class="flex items-center gap-2">
                <span
                  class="w-3 h-3 rounded-sm"
                  :class="[
                    idx === 0
                      ? isDarkMode
                        ? 'bg-zinc-300'
                        : 'bg-zinc-950'
                      : '',
                    idx === 1
                      ? isDarkMode
                        ? 'bg-zinc-500'
                        : 'bg-zinc-600'
                      : '',
                    idx === 2
                      ? isDarkMode
                        ? 'bg-zinc-700'
                        : 'bg-zinc-400'
                      : '',
                  ]"
                ></span>
                <span
                  class="text-xs font-bold capitalize"
                  :class="isDarkMode ? 'text-zinc-300' : 'text-slate-700'"
                >
                  {{ tier.name.toLowerCase() }}
                </span>
              </div>
              <div class="text-right">
                <span
                  class="text-xs font-bold font-mono block"
                  :class="isDarkMode ? 'text-white' : 'text-slate-900'"
                >
                  {{
                    (
                      ((tier.mrrContribution || 0) /
                        (superadminStore.stats?.monthlyRecurringRevenue || 1)) *
                      100
                    ).toFixed(0)
                  }}%
                </span>
                <span
                  class="text-[10px]"
                  :class="isDarkMode ? 'text-zinc-500' : 'text-slate-400'"
                >
                  {{ tier.count }} accounts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Billing Ledger -->
    <div class="space-y-4 pt-2">
      <h3
        class="text-sm font-bold uppercase tracking-wider pb-3 border-b transition-colors duration-300"
        :class="
          isDarkMode
            ? 'text-white border-zinc-800'
            : 'text-slate-900 border-slate-200'
        "
      >
        Billing and Revenue by Partner
      </h3>
      <div
        class="rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300"
        :class="
          isDarkMode
            ? 'bg-zinc-900 border-zinc-800'
            : 'bg-white border-slate-200'
        "
      >
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="text-xs font-bold border-b uppercase tracking-wider transition-colors duration-300"
              :class="
                isDarkMode
                  ? 'bg-zinc-800/50 text-zinc-400 border-zinc-800'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              "
            >
              <th class="px-6 py-4">Partner Name</th>
              <th class="px-6 py-4">Current Plan</th>
              <th class="px-6 py-4">Billing Cycle</th>
              <th class="px-6 py-4">Monthly Rate</th>
              <th class="px-6 py-4">Next Payment Date</th>
              <th class="px-6 py-4 font-mono">Total Paid To Date</th>
            </tr>
          </thead>
          <tbody class="text-xs font-semibold">
            <tr
              v-for="t in superadminStore.tenants"
              :key="t._id"
              class="border-b transition-colors duration-200"
              :class="[
                isDarkMode
                  ? 'border-zinc-800 hover:bg-zinc-800/30 text-zinc-300'
                  : 'border-slate-150 hover:bg-slate-50/50 text-slate-700',
              ]"
            >
              <td
                class="px-6 py-3.5 font-bold"
                :class="isDarkMode ? 'text-white' : 'text-slate-900'"
              >
                {{ t.companyName }}
              </td>
              <td class="px-6 py-3.5">
                <span
                  class="px-2 py-0.5 border font-mono text-[9px] font-bold uppercase rounded-md transition-colors duration-300"
                  :class="
                    isDarkMode
                      ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                      : 'bg-zinc-100 text-zinc-900 border-zinc-200'
                  "
                >
                  {{ t.subscriptionPlan }}
                </span>
              </td>
              <td
                class="px-6 py-3.5 text-[10px] font-bold uppercase"
                :class="isDarkMode ? 'text-zinc-500' : 'text-zinc-400'"
              >
                Monthly
              </td>
              <td
                class="px-6 py-3.5 font-mono"
                :class="isDarkMode ? 'text-zinc-200' : 'text-zinc-900'"
              >
                Rs.
                {{
                  (t.subscriptionPlan === "BASIC" ? 12500 : t.subscriptionPlan === "PREMIUM" ? 35000 : 85000).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })
                }}
              </td>
              <td
                class="px-6 py-3.5 font-mono text-[11px]"
                :class="isDarkMode ? 'text-zinc-500' : 'text-slate-400'"
              >
                2026-06-01
              </td>
              <td
                class="px-6 py-3.5 font-mono font-bold"
                :class="isDarkMode ? 'text-white' : 'text-zinc-900'"
              >
                Rs.
                {{
                  (t.subscriptionPlan === "BASIC" ? 150000 : t.subscriptionPlan === "PREMIUM" ? 420000 : 1020000).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
