<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTenantStore } from '../../stores/tenant';
import { useRouter } from 'vue-router';
import {
  MapPin, TrendingUp,  Car, MoreHorizontal,
  PenLine, RefreshCcw, Download, BarChart3, LineChart, PieChart
} from 'lucide-vue-next';

const store = useTenantStore();
const router = useRouter();

// Tooltip states
const barChartTooltip = ref<{ x: number; y: number; value: number; label: string } | null>(null);
const revenueLineTooltip = ref<{ x: number; y: number; value: number; label: string } | null>(null);
const occupancyLineTooltip = ref<{ x: number; y: number; value: number; label: string } | null>(null);
const pieChartTooltip = ref<{ x: number; y: number; type: string; count: number; percentage: number } | null>(null);

const chartBars = computed(() => {
  const tickets = store.ticketHistory;
  if (!tickets.length) {
    return [
      { label: '06:00', height: '30%', dark: false, count: 3 },
      { label: '',      height: '25%', dark: false, count: 2 },
      { label: '09:00', height: '35%', dark: false, count: 4 },
      { label: '',      height: '28%', dark: false, count: 3 },
      { label: '12:00', height: '50%', dark: false, count: 5 },
      { label: '',      height: '70%', dark: true,  count: 7 },
      { label: '15:00', height: '90%', dark: true,  count: 9 },
      { label: '',      height: '100%',dark: true,  count: 10 },
      { label: '18:00', height: '78%', dark: true,  count: 8 },
      { label: '',      height: '55%', dark: false, count: 5 },
      { label: '21:00', height: '45%', dark: false, count: 4 },
      { label: '00:00', height: '32%', dark: false, count: 3 },
    ];
  }
  const buckets = Array(12).fill(0);
  tickets.forEach((t: any) => {
    if (t.check_in_time) {
      const h = new Date(t.check_in_time).getHours();
      buckets[Math.floor(h / 2)]++;
    }
  });
  const maxVal = Math.max(...buckets, 1);
  const labels = ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'];
  return buckets.map((val, i) => ({
    label: i % 2 === 0 ? labels[i] : '',
    height: `${Math.max(Math.round((val / maxVal) * 100), 5)}%`,
    dark: val > maxVal * 0.6,
    count: val,
  }));
});

const linePoints = computed(() => {
  // Build real per-weekday ticket counts from actual ticket history
  const tickets = store.ticketHistory;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const buckets = new Array(7).fill(0) as number[];
  tickets.forEach((t: any) => {
    if (t.check_in_time) {
      const dayIndex = new Date(t.check_in_time).getDay();
      buckets[dayIndex] = (buckets[dayIndex] || 0) + 1;
    }
  });
  // Reorder to start from Monday
  const ordered = [...buckets.slice(1), buckets[0]] as number[];
  const orderedLabels = [...days.slice(1), days[0]] as string[];
  const maxVal = Math.max(...ordered, 1);
  const heights = ordered.map(v => Math.max(Math.round((v / maxVal) * 100), 5));

  const width = 360;
  const height = 120;
  const padding = 15;

  const points = heights.map((h, i) => {
    const x = padding + (i * (width - padding * 2)) / (heights.length - 1);
    const y = height - padding - (h * (height - padding * 2)) / 100;
    return { x, y, value: ordered[i] };
  });

  if (points.length === 0) return { points: [], path: '', areaPath: '', days: orderedLabels };

  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cpX = (points[i]!.x + points[i + 1]!.x) / 2;
    path += ` C ${cpX} ${points[i]!.y}, ${cpX} ${points[i + 1]!.y}, ${points[i + 1]!.x} ${points[i + 1]!.y}`;
  }

  const areaPath = `${path} L ${points[points.length - 1]!.x} ${height - padding} L ${points[0]!.x} ${height - padding} Z`;

  return { points, path, areaPath, days: orderedLabels };
});

const vehicleDistribution = computed(() => {
  const tickets = store.ticketHistory;
  const counts = { CAR: 0, BIKE: 0, TRUCK: 0 };
  
  tickets.forEach((t: any) => {
    const type = (t.vehicle_type || 'CAR').toUpperCase() as 'CAR' | 'BIKE' | 'TRUCK';
    if (counts[type] !== undefined) counts[type]++;
    else counts.CAR++;
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const colors = [
    { stroke: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-600' },      // CAR
    { stroke: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-500' },  // BIKE
    { stroke: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-500' },    // TRUCK
  ];

  let cumulativePercent = 0;
  return Object.entries(counts).map(([type, count], index) => {
    const percentage = Math.round((count / total) * 100) || (index === 0 ? 100 : 0);
    const strokeDasharray = `${percentage} ${100 - percentage}`;
    const strokeDashoffset = 100 - cumulativePercent + 25;
    cumulativePercent += percentage;

    return {
      type,
      count,
      percentage,
      stroke: colors[index]!.stroke,
      bg: colors[index]!.bg,
      text: colors[index]!.text,
      strokeDasharray,
      strokeDashoffset
    };
  });
});

const revenueLinePoints = computed(() => {
  const bars = chartBars.value;
  const width = 500;
  const height = 180;
  const padding = 20;

  const points = bars.map((bar, i) => {
    const x = padding + (i * (width - padding * 2)) / (bars.length - 1);
    const percent = parseFloat(bar.height) || 0;
    const y = height - padding - (percent * (height - padding * 2)) / 100;
    return { x, y, label: bar.label, value: bar.count };
  });

  if (points.length === 0) return { points: [], path: '', areaPath: '' };

  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cpX = (points[i]!.x + points[i + 1]!.x) / 2;
    path += ` C ${cpX} ${points[i]!.y}, ${cpX} ${points[i + 1]!.y}, ${points[i + 1]!.x} ${points[i + 1]!.y}`;
  }

  const areaPath = `${path} L ${points[points.length - 1]!.x} ${height - padding} L ${points[0]!.x} ${height - padding} Z`;

  return { points, path, areaPath };
});

// Hover event handlers
const handleBarHover = (event: MouseEvent, bar: any, index: number) => {
  const rect = (event.target as SVGElement).getBoundingClientRect();
  barChartTooltip.value = {
    x: rect.left + rect.width / 2,
    y: rect.top,
    value: bar.count,
    label: bar.label || `${index * 2}:00`
  };
};

const handleBarLeave = () => {
  barChartTooltip.value = null;
};

const handleRevenueLineHover = (event: MouseEvent, point: any) => {
  const rect = (event.target as SVGElement).getBoundingClientRect();
  revenueLineTooltip.value = {
    x: rect.left + rect.width / 2,
    y: rect.top,
    value: point.value,
    label: point.label || ''
  };
};

const handleRevenueLineLeave = () => {
  revenueLineTooltip.value = null;
};

const handleOccupancyLineHover = (event: MouseEvent, point: any, day: string) => {
  const rect = (event.target as SVGElement).getBoundingClientRect();
  occupancyLineTooltip.value = {
    x: rect.left + rect.width / 2,
    y: rect.top,
    value: point.value,
    label: day
  };
};

const handleOccupancyLineLeave = () => {
  occupancyLineTooltip.value = null;
};

const handlePieHover = (event: MouseEvent, seg: any) => {
  const rect = (event.target as SVGElement).getBoundingClientRect();
  pieChartTooltip.value = {
    x: rect.left + rect.width / 2,
    y: rect.top,
    type: seg.type,
    count: seg.count,
    percentage: seg.percentage
  };
};

const handlePieLeave = () => {
  pieChartTooltip.value = null;
};

// Navigation logic removed as Terminal Tab is removed

const exportPDF = () => {
  const companyName = store.profile.companyName || 'Metropolis Central Lot';
  const address = store.profile.address || '452 Industrial Way, Sector 7';
  const todayRevenue = store.revenueAnalytics?.today?.toFixed(2) ?? '0.00';
  const monthlyRevenue = store.revenueAnalytics?.oneMonth?.toFixed(2) ?? '0.00';
  const activeTicketsCount = store.revenueAnalytics?.active_tickets ?? 0;

  // Get real chart data
  const bars = chartBars.value;
  const lineData = linePoints.value;
  const vehicleDist = vehicleDistribution.value;

  // Generate hourly distribution table
  const hourlyHTML = bars.filter(b => b.label).map(b => `
    <tr>
      <td>${b.label}</td>
      <td><strong>${b.count}</strong></td>
      <td>
        <div style="width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="width: ${b.height}; height: 100%; background: ${b.dark ? '#2563eb' : '#93c5fd'}; border-radius: 4px;"></div>
        </div>
      </td>
    </tr>
  `).join('');

  // Generate weekly occupancy table
  const weeklyHTML = lineData.days.map((day, i) => `
    <tr>
      <td>${day}</td>
      <td><strong>${lineData.points[i]?.value || 0}</strong></td>
    </tr>
  `).join('');

  // Generate vehicle distribution table
  const vehicleHTML = vehicleDist.map(v => `
    <tr>
      <td>
        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${v.stroke}; margin-right: 8px;"></span>
        ${v.type?.toLowerCase()}
      </td>
      <td><strong>${v.count}</strong></td>
      <td><strong>${v.percentage}%</strong></td>
    </tr>
  `).join('');

  const ticketsHTML = store.ticketHistory.slice(0, 15).map(t => `
    <tr>
      <td><strong>${t.license_plate || '—'}</strong></td>
      <td>${t.vehicle_type || 'CAR'}</td>
      <td>${t.check_in_time ? new Date(t.check_in_time).toLocaleString() : '—'}</td>
      <td>
        <span class="badge ${t.status === 'PAID' ? 'badge-paid' : 'badge-active'}">
          ${t.status || 'ACTIVE'}
        </span>
      </td>
      <td>Rs. ${(t.fare_amount ?? 0) + (t.penalty_amount ?? 0) - (t.discount_amount ?? 0)}</td>
    </tr>
  `).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print the PDF report.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Parking Lot Facility Report - ${companyName}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .brand { font-size: 24px; font-weight: 800; color: #0f172a; }
        .meta { text-align: right; font-size: 12px; color: #64748b; line-height: 1.5; }
        .section-title { font-size: 14px; font-weight: 700; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
        .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .kpi-card { border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; background: #f8fafc; }
        .kpi-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
        .kpi-value { font-size: 22px; font-weight: 800; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
        td { padding: 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; color: #334155; }
        .badge { display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: 700; border-radius: 6px; }
        .badge-paid { background: #dcfce7; color: #15803d; }
        .badge-active { background: #dbeafe; color: #1d4ed8; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">${companyName}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 5px;">${address}</div>
        </div>
        <div class="meta">
          <div>Report Generated: <strong>${new Date().toLocaleString()}</strong></div>
          <div>Status: <span style="color: #10b981; font-weight: bold;">ACTIVE</span></div>
        </div>
      </div>

      <div class="section-title">Lot Performance Summary</div>
      <div class="kpis">
        <div class="kpi-card">
          <div class="kpi-label">Real-Time Occupancy</div>
          <div class="kpi-value">${activeTicketsCount} active</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Today's Revenue</div>
          <div class="kpi-value">Rs. ${todayRevenue}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Monthly Revenue</div>
          <div class="kpi-value">Rs. ${monthlyRevenue}</div>
        </div>
      </div>

      <div class="section-title">Hourly Vehicle Distribution</div>
      <table>
        <thead>
          <tr>
            <th>Time Slot</th>
            <th>Vehicle Count</th>
            <th>Occupancy Level</th>
          </tr>
        </thead>
        <tbody>
          ${hourlyHTML || '<tr><td colspan="3" style="text-align: center; color: #94a3b8;">No hourly data available.</td></tr>'}
        </tbody>
      </table>

      <div class="section-title">Weekly Peak Occupancy</div>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Vehicle Count</th>
          </tr>
        </thead>
        <tbody>
          ${weeklyHTML || '<tr><td colspan="2" style="text-align: center; color: #94a3b8;">No weekly data available.</td></tr>'}
        </tbody>
      </table>

      <div class="section-title">Vehicle Type Distribution</div>
      <table>
        <thead>
          <tr>
            <th>Vehicle Type</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${vehicleHTML || '<tr><td colspan="3" style="text-align: center; color: #94a3b8;">No vehicle distribution data available.</td></tr>'}
        </tbody>
      </table>

      <div class="section-title">Recent Vehicles Activity Log</div>
      <table>
        <thead>
          <tr>
            <th>License Plate</th>
            <th>Type</th>
            <th>Check-In Time</th>
            <th>Status</th>
            <th>Fare Paid/Accrued</th>
          </tr>
        </thead>
        <tbody>
          ${ticketsHTML || '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No recent vehicle records found.</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        ParkSaaS Pro Facility Management Suite • Confidential System Report
      </div>

      <${'script'}>
        window.onload = function() {
          window.print();
        }
      </${'script'}>
    </${'body'}>
    </${'html'}>
  `);
  printWindow.document.close();
};
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {{ store.profile.companyName || 'Dark Alaric Parking Lot' }}
        </h2>
      </div>
      <div class="flex gap-2 flex-wrap">
        <div class="relative">
          <select v-model="store.analyticsFilter" @change="store.fetchRevenueAnalytics()" class="appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm">
            <option value="today">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 dark:text-slate-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
        <button @click="exportPDF" class="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm">
          <Download class="w-4 h-4 text-red-500" /> Export PDF
        </button>
        <button @click="store.exportReport()" :disabled="store.isLoading" class="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-50 transition-all shadow-sm">
          <Download class="w-4 h-4 text-emerald-500" /> Export CSV
        </button>
      </div>
    </div>

    <!-- Occupancy + Revenue Bar Chart Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <!-- Occupancy -->
      <div class="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-1">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">REAL-TIME OCCUPANCY</p>
            <h3 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
              {{ store.revenueAnalytics?.active_tickets ?? '—' }}
              <span class="text-sm sm:text-lg font-semibold text-slate-400 dark:text-slate-500 ml-1">active</span>
            </h3>
          </div>
          <div class="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100">
            <BarChart3 class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div class="mt-4 sm:mt-6 h-3 w-full bg-blue-100 rounded-full overflow-hidden">
          <div class="h-full bg-blue-600 rounded-full transition-all duration-700"
            :style="{ width: store.revenueAnalytics?.active_tickets ? Math.min(Math.round((store.revenueAnalytics.active_tickets / Math.max(store.ticketHistory.length, 1)) * 100), 100) + '%' : '0%' }"
          ></div>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div class="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-lg p-3 sm:p-4">
            <p class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">TODAY'S REVENUE</p>
            <p class="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100">Rs. {{ store.revenueAnalytics?.today?.toFixed(2) ?? '0.00' }}</p>
          </div>
          <div class="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-lg p-3 sm:p-4">
            <p class="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">MONTHLY REVENUE</p>
            <p class="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100">Rs. {{ store.revenueAnalytics?.oneMonth?.toFixed(2) ?? '0.00' }}</p>
          </div>
        </div>

      </div>

      <!-- Revenue Line Chart -->
      <div class="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2 flex flex-col justify-between">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
          <div class="flex items-center gap-2">
            <LineChart class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 class="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">Daily Revenue Flow</h3>
          </div>
          <div class="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
            <span class="px-2 sm:px-3 py-1 bg-white dark:bg-slate-800 shadow-sm rounded-md text-[10px] sm:text-xs font-bold text-slate-900 dark:text-slate-100">Live Trend</span>
          </div>
        </div>

        <!-- Smooth Curve SVG for Revenue Trend -->
        <div class="flex-1 min-h-[120px] sm:min-h-[160px] relative mt-2">
          <svg viewBox="0 0 500 180" class="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2563eb" stop-opacity="0.18" />
                <stop offset="100%" stop-color="#2563eb" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Horizontal Grid lines -->
            <line x1="20" y1="20" x2="480" y2="20" stroke="#f1f5f9" stroke-width="1" />
            <line x1="20" y1="80" x2="480" y2="80" stroke="#f1f5f9" stroke-dasharray="3 3" stroke-width="1" />
            <line x1="20" y1="140" x2="480" y2="140" stroke="#f1f5f9" stroke-width="1" />

            <!-- Filled area path -->
            <path :d="revenueLinePoints.areaPath" fill="url(#revenueAreaGradient)" />

            <!-- Line path -->
            <path :d="revenueLinePoints.path" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" />

            <!-- Highlight Dots -->
            <circle v-for="(p, i) in revenueLinePoints.points" :key="i"
              :cx="p.x" :cy="p.y" r="4"
              fill="#2563eb" stroke="#ffffff" stroke-width="1.5"
              class="transition-all duration-300 ease-out hover:r-7 hover:stroke-width-2.5 cursor-pointer hover:drop-shadow-lg"
              style="filter: drop-shadow(0 0 0px rgba(37, 99, 235, 0));"
              :style="{ filter: revenueLineTooltip && revenueLineTooltip.label === p.label ? 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.6))' : 'drop-shadow(0 0 0px rgba(37, 99, 235, 0))' }"
              @mouseenter="(e) => handleRevenueLineHover(e, p)"
              @mouseleave="handleRevenueLineLeave" />
          </svg>
        </div>
        <div class="flex justify-between px-2 text-[8px] sm:text-[9px] font-bold text-slate-400 mt-2">
          <span v-for="(p, i) in revenueLinePoints.points" :key="i">
            <span v-if="p.label">{{ p.label }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Line & Pie Chart Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <!-- Peak Occupancy Line Graph -->
      <div class="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2 flex flex-col">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-5 gap-2">
          <div class="flex items-center gap-2">
            <LineChart class="w-4 h-4 text-emerald-500" />
            <h3 class="font-bold text-base sm:text-lg text-slate-900">Weekly Peak Occupancy</h3>
          </div>
          <span class="text-[10px] sm:text-xs font-bold text-slate-400">Peak times per day</span>
        </div>

        <!-- Smooth Premium SVG Line Graph -->
        <div class="flex-1 min-h-[100px] sm:min-h-[140px] relative mt-2">
          <svg viewBox="0 0 360 120" class="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.15" />
                <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Horizontal Grid lines -->
            <line x1="15" y1="15" x2="345" y2="15" stroke="#f1f5f9" stroke-width="1" />
            <line x1="15" y1="52.5" x2="345" y2="52.5" stroke="#f1f5f9" stroke-dasharray="3 3" stroke-width="1" />
            <line x1="15" y1="90" x2="345" y2="90" stroke="#f1f5f9" stroke-width="1" />

            <!-- Filled area path -->
            <path :d="linePoints.areaPath" fill="url(#areaGradient)" />

            <!-- Line path -->
            <path :d="linePoints.path" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" />

            <!-- Highlight Dots -->
            <circle v-for="(p, i) in linePoints.points" :key="i"
              :cx="p.x" :cy="p.y" r="4.5"
              fill="#10b981" stroke="#ffffff" stroke-width="1.5"
              class="transition-all duration-300 ease-out hover:r-7.5 hover:stroke-width-2.5 cursor-pointer"
              style="filter: drop-shadow(0 0 0px rgba(16, 185, 129, 0));"
              :style="{ filter: occupancyLineTooltip && occupancyLineTooltip.label === linePoints.days[i] ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' : 'drop-shadow(0 0 0px rgba(16, 185, 129, 0))' }"
              @mouseenter="(e) => handleOccupancyLineHover(e, p, linePoints.days[i] || '')"
              @mouseleave="handleOccupancyLineLeave" />
          </svg>
        </div>
        <div class="flex justify-between px-2 sm:px-3 text-[9px] sm:text-[10px] font-bold text-slate-400 mt-2">
          <span v-for="d in linePoints.days" :key="d">{{ d }}</span>
        </div>
      </div>

      <!-- Vehicle Type Pie/Donut Chart -->
      <div class="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-1 flex flex-col justify-between">
        <div class="flex justify-between items-center mb-3 sm:mb-4">
          <div class="flex items-center gap-2">
            <PieChart class="w-4 h-4 text-amber-500" />
            <h3 class="font-bold text-base sm:text-lg text-slate-900">Vehicle Breakdown</h3>
          </div>
        </div>

        <div class="flex items-center justify-around gap-3 sm:gap-4 flex-1 py-2">
          <!-- Premium SVG Segmented Donut -->
          <div class="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
            <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
              <!-- Background Circle -->
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" stroke-width="4" />
              <!-- Colored Segments -->
              <circle v-for="seg in vehicleDistribution" :key="seg.type"
                cx="18" cy="18" r="15.915" fill="none"
                :stroke="seg.stroke"
                stroke-width="4.2"
                :stroke-dasharray="seg.strokeDasharray"
                :stroke-dashoffset="seg.strokeDashoffset"
                class="transition-all duration-300 ease-out cursor-pointer hover:stroke-width-5"
                :class="{ 'opacity-100': !pieChartTooltip || pieChartTooltip.type !== seg.type, 'opacity-80 scale-105': pieChartTooltip && pieChartTooltip.type === seg.type }"
                @mouseenter="(e) => handlePieHover(e, seg)"
                @mouseleave="handlePieLeave" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">TOTAL</span>
              <span class="text-lg sm:text-xl font-black text-slate-800 mt-0.5">{{ store.ticketHistory.length }}</span>
            </div>
          </div>

          <!-- Color Legends -->
          <div class="space-y-2 sm:space-y-2.5 text-[10px] sm:text-xs">
            <div v-for="seg in vehicleDistribution" :key="seg.type" class="flex items-center gap-2">
              <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0" :class="seg.bg"></span>
              <div class="min-w-0">
                <p class="font-bold text-slate-800 capitalize leading-none mb-0.5">{{ seg.type?.toLowerCase() }}s</p>
                <p class="text-[9px] sm:text-[10px] font-bold text-slate-400">{{ seg.count }} parked ({{ seg.percentage }}%)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <div class="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-600">
        <p class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">TODAY'S REVENUE</p>
        <div class="flex items-baseline gap-2 sm:gap-3">
          <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">Rs. {{ store.revenueAnalytics?.today?.toFixed(2) ?? '0.00' }}</h3>
          <span class="text-[10px] sm:text-xs font-bold text-green-600 dark:text-green-500 flex items-center gap-0.5"><TrendingUp class="w-3 h-3" /> Live</span>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-600">
        <p class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">3-MONTH REVENUE</p>
        <div class="flex items-baseline gap-2 sm:gap-3">
          <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">Rs. {{ store.revenueAnalytics?.threeMonths?.toFixed(0) ?? '0' }}</h3>
          <span class="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">last 90 days</span>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-600">
        <p class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ACTIVE TICKETS</p>
        <div class="flex items-baseline gap-2 sm:gap-3">
          <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{{ store.revenueAnalytics?.active_tickets ?? 0 }}</h3>
          <span class="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">vehicles parked</span>
        </div>
      </div>
    </div>

    <!-- Active Vehicles Table + Rate Config -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
      <!-- Active Vehicles -->
      <div class="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div class="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h3 class="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">Active Vehicles</h3>
          <span class="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md border border-blue-100 dark:border-blue-800 uppercase tracking-wider w-max">LIVE FEED</span>
        </div>
        <div v-if="store.isLoading" class="py-8 sm:py-10 text-center text-slate-400 dark:text-slate-500">
          <RefreshCcw class="w-5 h-5 animate-spin inline-block mr-2" /> Loading…
        </div>
        <div v-else-if="store.ticketHistory.length === 0" class="py-8 sm:py-10 text-center text-slate-400 dark:text-slate-500 font-medium">
          No active vehicles found.
        </div>
        <div v-else class="overflow-x-auto">
          <div class="min-w-[500px] sm:min-w-[600px]">
            <table class="w-full">
              <thead class="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th class="text-left px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">VEHICLE / LICENSE</th>
                  <th class="text-left px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TYPE</th>
                  <th class="text-left px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CHECK-IN</th>
                  <th class="text-left px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">STATUS</th>
                  <th class="text-left px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ACTION</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 dark:divide-slate-700/50">
                <tr v-for="ticket in store.ticketHistory.slice(0, 8)" :key="ticket._id" class="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                  <td class="px-3 sm:px-5 py-3 sm:py-4">
                    <div class="flex items-center gap-2 sm:gap-3">
                      <div class="w-7 h-7 sm:w-8 sm:h-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                        <Car class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div class="min-w-0">
                        <p class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{{ ticket.license_plate || '—' }}</p>
                        <p class="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate">{{ ticket.ticket_number?.slice(0, 12) || ticket._id?.slice(-8) }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">{{ ticket.vehicle_type || '—' }}</td>
                  <td class="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {{ ticket.check_in_time ? new Date(ticket.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' }}
                  </td>
                  <td class="px-3 sm:px-5 py-3 sm:py-4">
                    <span class="px-2 py-1 border rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max"
                      :class="ticket.status === 'PAID' ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'">
                      <span class="w-1.5 h-1.5 rounded-full" :class="ticket.status === 'PAID' ? 'bg-green-500' : 'bg-blue-600 dark:bg-blue-500'"></span>
                      {{ ticket.status }}
                    </span>
                  </td>
                  <td class="px-3 sm:px-5 py-3 sm:py-4">
                    <button class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"><MoreHorizontal class="w-4 h-4 sm:w-5 sm:h-5" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Rate Config Widget -->
      <div class="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div class="flex justify-between items-center mb-4 sm:mb-6">
          <h3 class="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">Rate Config</h3>
          <button class="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-md"><PenLine class="w-4 h-4 sm:w-5 sm:h-5" /></button>
        </div>
        <div v-if="store.isLoading" class="text-center py-4 sm:py-6 text-slate-400 dark:text-slate-500">
          <RefreshCcw class="w-4 h-4 sm:w-5 sm:h-5 animate-spin inline-block" />
        </div>
        <div v-else-if="store.rates.length === 0" class="text-center py-4 sm:py-6">
          <p class="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium mb-3">No rates configured yet.</p>
        </div>
        <div v-else class="space-y-2 sm:space-y-3">
          <div v-for="rate in store.rates.slice(0, 3)" :key="rate._id || rate.vehicle_type"
            class="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-2.5 sm:p-3 flex justify-between items-center">
            <div>
              <p class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">{{ rate.vehicle_type?.toLowerCase() || 'Rate' }}</p>
              <p class="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">PER {{ rate.billing_unit || 'HOUR' }}</p>
            </div>
            <span class="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">Rs. {{ rate.rate_per_hour ?? rate.amount ?? '—' }}</span>
          </div>
        </div>
        <hr class="my-4 sm:my-5 border-slate-100 dark:border-slate-700" />
        <div>
          <div class="flex justify-between items-center mb-2 sm:mb-3">
            <p class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Dynamic Pricing</p>
            <div class="w-9 h-5 sm:w-10 sm:h-6 bg-blue-600 rounded-full relative cursor-pointer">
              <div class="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full absolute right-0.5 sm:right-1 top-0.5 sm:top-1 shadow-sm"></div>
            </div>
          </div>
          <p class="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Rates increase by 15% when occupancy exceeds 90% capacity.</p>
        </div>
      </div>
    </div>

    <!-- Tooltip Components -->
    <!-- Bar Chart Tooltip -->
    <teleport to="body">
      <transition name="tooltip-fade">
        <div v-if="barChartTooltip"
          class="fixed z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-12px] border border-slate-700"
          :style="{ left: barChartTooltip.x + 'px', top: barChartTooltip.y + 'px' }">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            <div class="text-slate-400 text-[10px] uppercase tracking-wider">{{ barChartTooltip.label }}</div>
          </div>
          <div class="text-xl font-black">{{ barChartTooltip.value }} <span class="text-sm font-semibold text-slate-400">vehicles</span></div>
        </div>
      </transition>
    </teleport>

    <!-- Revenue Line Tooltip -->
    <teleport to="body">
      <transition name="tooltip-fade">
        <div v-if="revenueLineTooltip"
          class="fixed z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-12px] border border-slate-700"
          :style="{ left: revenueLineTooltip.x + 'px', top: revenueLineTooltip.y + 'px' }">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            <div class="text-slate-400 text-[10px] uppercase tracking-wider">{{ revenueLineTooltip.label }}</div>
          </div>
          <div class="text-xl font-black">{{ revenueLineTooltip.value }} <span class="text-sm font-semibold text-slate-400">vehicles</span></div>
        </div>
      </transition>
    </teleport>

    <!-- Occupancy Line Tooltip -->
    <teleport to="body">
      <transition name="tooltip-fade">
        <div v-if="occupancyLineTooltip"
          class="fixed z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-12px] border border-slate-700"
          :style="{ left: occupancyLineTooltip.x + 'px', top: occupancyLineTooltip.y + 'px' }">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div class="text-slate-400 text-[10px] uppercase tracking-wider">{{ occupancyLineTooltip.label }}</div>
          </div>
          <div class="text-xl font-black">{{ occupancyLineTooltip.value }} <span class="text-sm font-semibold text-slate-400">vehicles</span></div>
        </div>
      </transition>
    </teleport>

    <!-- Pie Chart Tooltip -->
    <teleport to="body">
      <transition name="tooltip-fade">
        <div v-if="pieChartTooltip"
          class="fixed z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-12px] border border-slate-700"
          :style="{ left: pieChartTooltip.x + 'px', top: pieChartTooltip.y + 'px' }">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-2 h-2 rounded-full" :class="pieChartTooltip.type === 'CAR' ? 'bg-blue-500' : pieChartTooltip.type === 'BIKE' ? 'bg-emerald-500' : 'bg-amber-500'"></div>
            <div class="text-slate-400 text-[10px] uppercase tracking-wider">{{ pieChartTooltip.type }}</div>
          </div>
          <div class="text-xl font-black">{{ pieChartTooltip.count }} <span class="text-sm font-semibold text-slate-400">vehicles</span></div>
          <div class="text-emerald-400 text-lg font-black">{{ pieChartTooltip.percentage }}%</div>
        </div>
      </transition>
    </teleport>
  </div>
</template>
