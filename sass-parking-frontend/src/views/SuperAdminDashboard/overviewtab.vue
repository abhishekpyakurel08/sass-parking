<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useSuperadminStore } from "../../stores/superadmin";
import {
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
} from "lucide-vue-next";

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

// --- Enhanced Revenue Chart Data ---
const revenueTrend = computed(() => {
  const baseMRR = superadminStore.stats?.monthlyRecurringRevenue || 120000;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const growthFactor = [0.65, 0.72, 0.78, 0.85, 0.92, 1.0];

  return months.map((month, i) => {
    const factor = growthFactor[i] ?? 1.0;
    return {
      month,
      value: baseMRR * factor,
      projected: baseMRR * (factor * 1.08), // 8% projected growth
    };
  });
});

// Chart dimensions and scaling
const CHART_WIDTH = 600;
const CHART_HEIGHT = 180;
const PADDING = { top: 20, right: 30, bottom: 30, left: 50 };

const chartPoints = computed(() => {
  const data = revenueTrend.value;
  if (!data.length) return [];

  const width = CHART_WIDTH - PADDING.left - PADDING.right;
  const height = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const maxVal =
    Math.max(...data.map((d) => Math.max(d.value, d.projected))) * 1.15;
  const minVal =
    Math.min(...data.map((d) => Math.min(d.value, d.projected))) * 0.85;
  const range = maxVal - minVal || 1;

  return data.map((d, i) => {
    const x = PADDING.left + (i * width) / (data.length - 1);
    const y = PADDING.top + height - ((d.value - minVal) / range) * height;
    const yProj =
      PADDING.top + height - ((d.projected - minVal) / range) * height;
    return { x, y, yProj, label: d.month, val: d.value, proj: d.projected };
  });
});

// Smooth monotone-like bezier curve path
const smoothPath = (points: { x: number; y: number }[], isArea = false) => {
  if (points.length === 0) return "";
  const first = points[0];
  if (!first) return "";
  if (points.length === 1) return `M ${first.x} ${first.y}`;

  let d = `M ${first.x} ${first.y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1] || first;
    const p1 = points[i] || first;
    const p2 = points[i + 1] || first;
    const p3 = points[i + 2] || p2 || first;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  if (isArea) {
    const last = points[points.length - 1] || first;
    d += ` L ${last.x} ${CHART_HEIGHT - PADDING.bottom}`;
    d += ` L ${first.x} ${CHART_HEIGHT - PADDING.bottom} Z`;
  }

  return d;
};

const actualPath = computed(() =>
  smoothPath(chartPoints.value.map((p) => ({ x: p.x, y: p.y }))),
);
const projectedPath = computed(() =>
  smoothPath(chartPoints.value.map((p) => ({ x: p.x, y: p.yProj }))),
);
const areaPath = computed(() =>
  smoothPath(
    chartPoints.value.map((p) => ({ x: p.x, y: p.y })),
    true,
  ),
);

// Y-axis labels
const yAxisLabels = computed(() => {
  const data = revenueTrend.value;
  if (!data.length) return [];
  const maxVal =
    Math.max(...data.map((d) => Math.max(d.value, d.projected))) * 1.15;
  const minVal =
    Math.min(...data.map((d) => Math.min(d.value, d.projected))) * 0.85;
  const steps = 4;
  const range = maxVal - minVal;

  return Array.from({ length: steps + 1 }, (_, i) => {
    const val = minVal + (range * i) / steps;
    const y =
      PADDING.top +
      (CHART_HEIGHT - PADDING.top - PADDING.bottom) * (1 - i / steps);
    return { val: Math.round(val), y };
  });
});

// Growth rate calculation
const growthRate = computed(() => {
  const data = revenueTrend.value;
  if (data.length < 2) return "0.0";
  const first = data[0]?.value ?? 120000;
  const last = data[data.length - 1]?.value ?? 120000;
  return (((last - first) / first) * 100).toFixed(1);
});

// Premium colors synced with theme config and your brand blueprint
const chartColors = computed(() => ({
  line: "#B2BEB5", // Ash Gray (Main Accent)
  lineProjected: isDarkMode.value ? "#d3dad5" : "#8d9e92", // Projected Ash Gray variants
  areaStart: isDarkMode.value
    ? "rgba(178, 190, 181, 0.15)"
    : "rgba(178, 190, 181, 0.25)",
  areaEnd: "rgba(178, 190, 181, 0)",
  grid: isDarkMode.value ? "#2B2B2B" : "#DADADA", // Charcoal vs Light Gray
  text: isDarkMode.value ? "#B2BEB5" : "#6B7280", // Ash Gray vs Gray
  dot: "#B2BEB5",
  tooltipBg: isDarkMode.value ? "#111111" : "#ffffff", // Matte Black vs White
  tooltipText: isDarkMode.value ? "#F8F9FA" : "#1A1A1A", // Soft White vs Rich Black
}));

// Floating HTML tooltip coordinates and reference data
const activePointIdx = ref<number | null>(null);

const activePoint = computed(() => {
  if (activePointIdx.value === null) return null;
  return chartPoints.value[activePointIdx.value] || null;
});

const handleChartHover = (index: number) => {
  activePointIdx.value = index;
};

const handleChartLeave = () => {
  activePointIdx.value = null;
};
</script>

<template>
  <div class="space-y-6">
    <!-- Numeric Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Active Partners Card -->
      <div
        class="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800 transition-colors duration-300"
      >
        <div class="flex justify-between items-start mb-4">
          <div
            class="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center transition-colors duration-300"
          >
            <Building2 class="w-6 h-6 text-zinc-900 dark:text-zinc-300" />
          </div>
          <span
            class="text-xs font-bold text-zinc-900 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 transition-colors duration-300"
            >Partners</span
          >
        </div>
        <p
          class="text-slate-500 dark:text-zinc-400 text-sm font-semibold transition-colors duration-300"
        >
          Active Partners
        </p>
        <div class="flex items-baseline gap-2 mt-1">
          <h3
            class="text-3xl font-black text-slate-900 dark:text-white transition-colors duration-300"
          >
            {{ superadminStore.stats?.activeTenants || 0 }}
          </h3>
          <span
            class="text-xs font-bold text-emerald-500 flex items-center gap-0.5"
          >
            <ArrowUpRight class="w-3 h-3" />
            {{ growthRate }}%
          </span>
        </div>
      </div>

      <!-- Total Users Card -->
      <div
        class="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800 transition-colors duration-300"
      >
        <div class="flex justify-between items-start mb-4">
          <div
            class="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center transition-colors duration-300"
          >
            <Users class="w-6 h-6 text-zinc-900 dark:text-zinc-300" />
          </div>
          <span
            class="text-xs font-bold text-zinc-900 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 transition-colors duration-300"
            >Total Accounts</span
          >
        </div>
        <p
          class="text-slate-500 dark:text-zinc-400 text-sm font-semibold transition-colors duration-300"
        >
          System Users
        </p>
        <h3
          class="text-3xl font-black text-slate-900 dark:text-white mt-1 transition-colors duration-300"
        >
          {{ superadminStore.stats?.totalUsers || 0 }}
        </h3>
      </div>

      <!-- Revenue Card -->
      <div
        class="bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-800 dark:to-zinc-950 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden transition-all duration-300"
      >
        <div
          class="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"
        ></div>
        <div
          class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 relative z-10"
        >
          <BarChart3 class="w-6 h-6 text-white" />
        </div>
        <p class="text-zinc-100 text-sm font-semibold relative z-10">
          Monthly Revenue
        </p>
        <div class="flex items-baseline gap-2 mt-1 relative z-10">
          <h3 class="text-2xl font-black">
            Rs.
            {{
              superadminStore.stats?.monthlyRecurringRevenue?.toLocaleString(
                undefined,
                { minimumFractionDigits: 2 },
              ) || "0.00"
            }}
          </h3>
          <span
            class="text-xs font-bold text-emerald-400 flex items-center gap-0.5"
          >
            <TrendingUp class="w-3 h-3" />
            MRR
          </span>
        </div>
      </div>
    </div>

    <!-- Chart Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Enhanced Revenue Trend Chart -->
      <div
        class="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between transition-colors duration-300 relative"
      >
        <div class="flex justify-between items-start">
          <div>
            <h4
              class="font-bold text-slate-900 dark:text-white text-sm transition-colors duration-300"
            >
              Monthly Revenue Trend
            </h4>
            <p
              class="text-xs text-slate-400 dark:text-zinc-500 mt-1 transition-colors duration-300"
            >
              Actual vs. projected revenue trajectory
            </p>
          </div>
          <div class="flex items-center gap-3 text-[10px] font-bold">
            <span
              class="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400"
            >
              <span class="w-2.5 h-0.5 bg-sky-700 rounded-full"></span>
              Actual
            </span>
            <span
              class="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500"
            >
              <span
                class="w-2.5 h-0.5 bg-sky-400 rounded-full border border-dashed"
              ></span>
              Projected
            </span>
          </div>
        </div>

        <!-- Position Relative container to anchor the absolute Recharts HTML Tooltip -->
        <div class="my-4 relative">
          <!-- Dynamic Floating HTML Tooltip matching original Recharts design structure -->
          <div
            v-if="activePoint"
            class="absolute pointer-events-none bg-white dark:bg-zinc-950 p-3.5 border border-slate-150 dark:border-zinc-800 shadow-xl rounded-2xl transition-all duration-100 ease-out z-10"
            :style="{
              left: `${(activePoint.x / CHART_WIDTH) * 100}%`,
              top: `${(activePoint.y / CHART_HEIGHT) * 100 - 15}%`,
              transform: 'translate(-50%, -100%)',
            }"
          >
            <p
              class="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none"
            >
              {{ activePoint.label }}
            </p>
            <div class="mt-2 space-y-1 text-xs">
              <p
                class="font-bold text-slate-900 dark:text-white flex items-center justify-between gap-4"
              >
                <span
                  class="text-[10px] text-slate-400 dark:text-zinc-500 font-medium"
                  >Actual:</span
                >
                <span class="font-mono"
                  >Rs.
                  {{
                    Math.round(activePoint.val).toLocaleString()
                  }}</span
                >
              </p>
              <p
                class="font-bold text-slate-500 dark:text-zinc-400 flex items-center justify-between gap-4"
              >
                <span
                  class="text-[10px] text-slate-400 dark:text-zinc-500 font-medium"
                  >Projected:</span
                >
                <span class="font-mono"
                  >Rs.
                  {{
                    Math.round(
                      activePoint.proj,
                    ).toLocaleString()
                  }}</span
                >
              </p>
            </div>
          </div>

          <svg
            :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
            class="w-full h-48 overflow-visible"
            @mouseleave="handleChartLeave"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" :stop-color="chartColors.areaStart" />
                <stop offset="95%" :stop-color="chartColors.areaEnd" />
              </linearGradient>
            </defs>

            <!-- Grid Lines -->
            <g v-for="(label, i) in yAxisLabels" :key="`grid-${i}`">
              <line
                :x1="PADDING.left"
                :y1="label.y"
                :x2="CHART_WIDTH - PADDING.right"
                :y2="label.y"
                :stroke="chartColors.grid"
                stroke-width="1"
                stroke-dasharray="3 3"
              />
              <text
                :x="PADDING.left - 8"
                :y="label.y + 3"
                text-anchor="end"
                class="text-[9px] font-bold"
                :fill="chartColors.text"
              >
                {{ (label.val / 1000).toFixed(0) }}k
              </text>
            </g>

            <!-- Active Vertical Hover Line (Cursor) -->
            <line
              v-if="activePoint"
              :x1="activePoint.x"
              :y1="PADDING.top"
              :x2="activePoint.x"
              :y2="CHART_HEIGHT - PADDING.bottom"
              stroke="#94a3b8"
              class="dark:stroke-zinc-700 opacity-60"
              stroke-width="1"
              stroke-dasharray="3 3"
            />

            <!-- Area under actual line -->
            <path :d="areaPath" fill="url(#areaGradient)" />

            <!-- Projected line (dashed) -->
            <path
              :d="projectedPath"
              fill="none"
              :stroke="chartColors.lineProjected"
              stroke-width="2"
              stroke-dasharray="5,4"
              stroke-linecap="round"
              opacity="0.6"
            />

            <!-- Actual line -->
            <path
              :d="actualPath"
              fill="none"
              :stroke="chartColors.line"
              stroke-width="2.5"
              stroke-linecap="round"
            />

            <!-- Data points -->
            <g v-for="(p, i) in chartPoints" :key="i">
              <!-- Actual Dot -->
              <circle
                :cx="p.x"
                :cy="p.y"
                :r="activePointIdx === i ? 6 : 4"
                :fill="chartColors.dot"
                stroke="#ffffff"
                :stroke-width="activePointIdx === i ? 2 : 1.5"
                class="transition-all duration-150 ease-out"
              />

              <!-- Projected Dot (subtle) -->
              <circle
                :cx="p.x"
                :cy="p.yProj"
                :r="activePointIdx === i ? 4.5 : 3"
                :fill="chartColors.lineProjected"
                stroke="#ffffff"
                :stroke-width="activePointIdx === i ? 1.5 : 1"
                class="transition-all duration-150 ease-out"
                opacity="0.8"
              />

              <!-- X-axis label -->
              <text
                :x="p.x"
                :y="CHART_HEIGHT - 8"
                text-anchor="middle"
                class="text-[10px] font-bold"
                :fill="chartColors.text"
              >
                {{ p.label }}
              </text>
            </g>

            <!-- Invisible rectangular trigger lanes for accurate hover tracking -->
            <g v-for="(p, i) in chartPoints" :key="'trigger-' + i">
              <rect
                :x="p.x - 25"
                y="10"
                width="50"
                :height="CHART_HEIGHT - PADDING.bottom"
                fill="transparent"
                class="cursor-crosshair"
                @mouseenter="handleChartHover(i)"
                @mousemove="handleChartHover(i)"
              />
            </g>
          </svg>
        </div>

        <div
          class="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-800 pt-3 transition-colors duration-300"
        >
          <span>6-month rolling average</span>
          <span
            class="font-semibold text-slate-800 dark:text-zinc-300 transition-colors duration-300"
          >
            +{{ growthRate }}% growth trend
          </span>
        </div>
      </div>

      <!-- Quick Stats Panel -->
      <div
        class="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors duration-300"
      >
        <h4
          class="font-bold text-slate-900 dark:text-white text-sm mb-4 transition-colors duration-300"
        >
          Performance Metrics
        </h4>
        <div class="space-y-4">
          <div
            v-for="(stat, idx) in [
              {
                label: 'Avg. Revenue per Partner',
                value: superadminStore.stats?.activeTenants
                  ? Math.round(
                      (superadminStore.stats?.monthlyRecurringRevenue || 0) /
                        superadminStore.stats.activeTenants,
                    )
                  : 0,
                prefix: 'Rs. ',
              },
              {
                label: 'User-to-Partner Ratio',
                value: superadminStore.stats?.activeTenants
                  ? (
                      (superadminStore.stats?.totalUsers || 0) /
                      superadminStore.stats.activeTenants
                    ).toFixed(1)
                  : '0',
                prefix: '',
              },
              { label: 'System Uptime', value: 99.9, prefix: '', suffix: '%' },
            ]"
            :key="idx"
            class="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800 last:border-0"
          >
            <span
              class="text-xs text-slate-500 dark:text-zinc-400 font-medium"
              >{{ stat.label }}</span
            >
            <span
              class="text-sm font-bold text-slate-900 dark:text-white font-mono"
              >{{ stat.prefix }}{{ stat.value.toLocaleString()
              }}{{ stat.suffix || "" }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
