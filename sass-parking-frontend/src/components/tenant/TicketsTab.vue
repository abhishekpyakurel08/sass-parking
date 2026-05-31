<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTenantStore } from '../../stores/tenant';
import {
  Ticket, Search, Filter, X, Car, Clock, CreditCard,
  Banknote, Smartphone, ChevronRight, RefreshCcw,
  CheckCircle2, AlertCircle, Circle, ChevronLeft, ChevronRight as ChevRight
} from 'lucide-vue-next';

const store = useTenantStore();

// Tooltip state
const ticketTooltip = ref<{ x: number; y: number; ticket: any } | null>(null);

// Filters
const search = ref('');
const statusFilter = ref<'ALL' | 'ACTIVE' | 'PENDING_PAYMENT' | 'PAID'>('ALL');

// Detail panel
const selectedTicket = ref<any>(null);
const showDetail = ref(false);

const openDetail = (ticket: any) => {
  selectedTicket.value = ticket;
  showDetail.value = true;
};
const closeDetail = () => { showDetail.value = false; setTimeout(() => { selectedTicket.value = null; }, 300); };

// Pagination
const currentPage = ref(1);

const applyFilter = async (status: typeof statusFilter.value) => {
  statusFilter.value = status;
  currentPage.value = 1;
  await store.fetchTicketHistory(1, status === 'ALL' ? undefined : status);
};

const goToPage = async (page: number) => {
  if (page < 1 || page > store.ticketPagination.totalPages) return;
  currentPage.value = page;
  await store.fetchTicketHistory(page, statusFilter.value === 'ALL' ? undefined : statusFilter.value);
};

onMounted(() => store.fetchTicketHistory(1));

const filteredTickets = computed(() => {
  if (!search.value) return store.ticketHistory;
  const q = search.value.toLowerCase();
  return store.ticketHistory.filter((t: any) =>
    t.license_plate?.toLowerCase().includes(q) ||
    t.ticket_number?.toLowerCase().includes(q) ||
    t.vehicle_type?.toLowerCase().includes(q)
  );
});

const statusStyles: Record<string, string> = {
  ACTIVE:           'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  PENDING_PAYMENT:  'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
  PAID:             'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
  EXPIRED:          'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700',
};

const statusIcons: Record<string, any> = {
  ACTIVE:           Circle,
  PENDING_PAYMENT:  AlertCircle,
  PAID:             CheckCircle2,
};

const paymentIcon: Record<string, any> = {
  CASH:   Banknote,
  CARD:   CreditCard,
  ESEWA:  Smartphone,
  KHALTI: Smartphone,
};

const formatTime = (iso: string) =>
  iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const duration = (check_in: string, check_out?: string) => {
  if (!check_in) return '—';
  const end = check_out ? new Date(check_out) : new Date();
  const mins = Math.round((end.getTime() - new Date(check_in).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const statuses = ['ALL', 'ACTIVE', 'PENDING_PAYMENT', 'PAID'] as const;

// Hover event handlers
const handleTicketHover = (event: MouseEvent, ticket: any) => {
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  ticketTooltip.value = {
    x: rect.left + rect.width / 2,
    y: rect.top,
    ticket
  };
};

const handleTicketLeave = () => {
  ticketTooltip.value = null;
};
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-4 sm:space-y-5">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Parking Tickets</h2>
        <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
          {{ store.ticketPagination.total }} total tickets
        </p>
      </div>
      <button @click="store.fetchTicketHistory(currentPage)" class="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto">
        <RefreshCcw class="w-4 h-4" :class="store.isLoading ? 'animate-spin' : ''" /> Refresh
      </button>
    </div>

    <!-- Filters row -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Search -->
      <div class="relative flex-1 max-w-sm w-full">
        <Search class="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input v-model="search" type="text" placeholder="Search by plate, ticket #…"
          class="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
      </div>
      <!-- Status pills -->
      <div class="flex gap-1.5 flex-wrap">
        <button v-for="s in statuses" :key="s"
          @click="applyFilter(s)"
          :class="[
            'px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border transition-all',
            statusFilter === s
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          ]">
          {{ s.replace('_', ' ') }}
        </button>
      </div>
    </div>

    <!-- Table card -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <!-- Loading -->
      <div v-if="store.isLoading" class="py-12 sm:py-16 text-center text-slate-400 dark:text-slate-500">
        <RefreshCcw class="w-5 h-5 sm:w-6 sm:h-6 animate-spin inline-block mb-2" />
        <p class="text-xs sm:text-sm font-medium">Loading tickets…</p>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredTickets.length === 0" class="py-12 sm:py-16 text-center">
        <Ticket class="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p class="text-slate-500 dark:text-slate-400 font-semibold text-sm sm:text-base">No tickets found</p>
        <p class="text-slate-400 dark:text-slate-500 text-xs sm:text-sm mt-1">Try adjusting your filter or search.</p>
      </div>

      <!-- Data table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left min-w-[500px] sm:min-w-[640px]">
          <thead class="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
            <tr>
              <th class="px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket / Vehicle</th>
              <th class="px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
              <th class="px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Check-In</th>
              <th class="px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
              <th class="px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
              <th class="px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th class="px-3 sm:px-5 py-3 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-700/50">
            <tr v-for="ticket in filteredTickets" :key="ticket._id"
              class="hover:bg-slate-50/60 dark:hover:bg-slate-700/60 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-sm"
              @click="openDetail(ticket)"
              @mouseenter="(e) => handleTicketHover(e, ticket)"
              @mouseleave="handleTicketLeave">
              <td class="px-3 sm:px-5 py-3 sm:py-4">
                <div class="flex items-center gap-2 sm:gap-3">
                  <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Car class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{{ ticket.license_plate || '—' }}</p>
                    <p class="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">{{ ticket.ticket_number?.slice(0,16) || ticket._id?.slice(-10) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 sm:px-5 py-3 sm:py-4">
                <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[9px] sm:text-[10px] font-black uppercase">{{ ticket.vehicle_type || '—' }}</span>
              </td>
              <td class="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">{{ formatTime(ticket.check_in_time) }}</td>
              <td class="px-3 sm:px-5 py-3 sm:py-4">
                <span class="flex items-center gap-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <Clock class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-500" />
                  {{ duration(ticket.check_in_time, ticket.check_out_time) }}
                </span>
              </td>
              <td class="px-3 sm:px-5 py-3 sm:py-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {{ ticket.fare_amount != null ? `Rs. ${ticket.fare_amount}` : '—' }}
              </td>
              <td class="px-3 sm:px-5 py-3 sm:py-4">
                <span :class="['px-2 py-1 border rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max', statusStyles[ticket.status] || 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700']">
                  <component :is="statusIcons[ticket.status] || Circle" class="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {{ ticket.status }}
                </span>
              </td>
              <td class="px-3 sm:px-5 py-3 sm:py-4">
                <ChevronRight class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="store.ticketPagination.totalPages > 1"
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
        <p class="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
          Page {{ currentPage }} of {{ store.ticketPagination.totalPages }}
          <span class="text-slate-400 dark:text-slate-500">({{ store.ticketPagination.total }} total)</span>
        </p>
        <div class="flex gap-1 justify-center sm:justify-start">
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">
            <ChevronLeft class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= store.ticketPagination.totalPages"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">
            <ChevRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Detail Slide-Over Panel ───────────────────────────────── -->
    <Teleport to="body">
      <!-- Overlay -->
      <Transition name="fade">
        <div v-if="showDetail" @click="closeDetail"
          class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
      </Transition>

      <!-- Panel -->
      <Transition name="slide-right">
        <aside v-if="showDetail && selectedTicket"
          class="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col overflow-y-auto border-l border-slate-200 dark:border-slate-800">

          <!-- Panel Header -->
          <div class="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              <p class="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ticket Detail</p>
              <p class="font-black text-slate-900 dark:text-slate-100 text-base sm:text-lg mt-0.5">{{ selectedTicket.license_plate || 'Unknown' }}</p>
            </div>
            <button @click="closeDetail" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors">
              <X class="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <!-- Status Badge -->
          <div class="px-4 sm:px-6 pt-4 sm:pt-5">
            <span :class="['px-3 sm:px-4 py-2 border rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-sm', statusStyles[selectedTicket.status]]">
              <component :is="statusIcons[selectedTicket.status] || Circle" class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {{ selectedTicket.status }}
            </span>
          </div>

          <!-- Ticket Info -->
          <div class="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 flex-1">
            <!-- Ticket ID -->
            <div class="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm">
              <p class="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Ticket Number</p>
              <p class="font-mono text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 break-all tracking-wide">{{ selectedTicket.ticket_number || selectedTicket._id }}</p>
            </div>

            <!-- Timing block -->
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 sm:p-5 shadow-sm">
                <p class="text-[9px] sm:text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider mb-2">Check-In</p>
                <p class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{{ formatTime(selectedTicket.check_in_time) }}</p>
              </div>
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 sm:p-5 shadow-sm">
                <p class="text-[9px] sm:text-[10px] font-bold text-purple-400 dark:text-purple-500 uppercase tracking-wider mb-2">Check-Out</p>
                <p class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{{ selectedTicket.check_out_time ? formatTime(selectedTicket.check_out_time) : 'Still Active' }}</p>
              </div>
            </div>

            <!-- Duration + Vehicle -->
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
              <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 sm:p-5 shadow-sm">
                <p class="text-[9px] sm:text-[10px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-wider mb-2">Duration</p>
                <p class="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">{{ duration(selectedTicket.check_in_time, selectedTicket.check_out_time) }}</p>
              </div>
              <div class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 sm:p-5 shadow-sm">
                <p class="text-[9px] sm:text-[10px] font-bold text-amber-400 dark:text-amber-500 uppercase tracking-wider mb-2">Vehicle Type</p>
                <p class="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 uppercase">{{ selectedTicket.vehicle_type || '—' }}</p>
              </div>
            </div>

            <!-- Fare -->
            <div v-if="selectedTicket.fare_amount != null" class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50 border-2 border-green-200 dark:border-green-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
              <div>
                <p class="text-[9px] sm:text-[10px] font-bold text-green-500 dark:text-green-600 uppercase tracking-wider mb-1">Total Fare</p>
                <p class="text-3xl sm:text-4xl font-black text-green-700 dark:text-green-400">Rs. {{ selectedTicket.fare_amount }}</p>
              </div>
              <div v-if="selectedTicket.payment_method" class="flex items-center gap-2 sm:gap-3 bg-white dark:bg-slate-800 px-3 sm:px-4 py-2 rounded-xl shadow-sm">
                <component :is="paymentIcon[selectedTicket.payment_method] || CreditCard" class="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-500" />
                <span class="text-xs sm:text-sm font-bold uppercase text-slate-900 dark:text-slate-100">{{ selectedTicket.payment_method }}</span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="selectedTicket.notes" class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 sm:p-5 shadow-sm">
              <p class="text-[9px] sm:text-[10px] font-bold text-amber-500 dark:text-amber-600 uppercase tracking-wider mb-2">Notes</p>
              <p class="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-400 leading-relaxed">{{ selectedTicket.notes }}</p>
            </div>

            <!-- Operator / Staff -->
            <div v-if="selectedTicket.operator_id" class="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
              <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg shadow-blue-300/50">
                {{ selectedTicket.operator_id?.toString().slice(-2) }}
              </div>
              <div>
                <p class="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Processed by</p>
                <p class="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">Gate Staff</p>
              </div>
            </div>
          </div>
        </aside>
      </Transition>
    </Teleport>

    <!-- Ticket Tooltip -->
    <teleport to="body">
      <transition name="tooltip-fade">
        <div v-if="ticketTooltip"
          class="fixed z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-12px] border border-slate-700 min-w-[200px]"
          :style="{ left: ticketTooltip.x + 'px', top: ticketTooltip.y + 'px' }">
          <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
            <div class="w-2 h-2 rounded-full" :class="ticketTooltip.ticket.status === 'PAID' ? 'bg-green-500' : ticketTooltip.ticket.status === 'PENDING_PAYMENT' ? 'bg-amber-500' : 'bg-blue-500'"></div>
            <div class="text-slate-400 text-[10px] uppercase tracking-wider">{{ ticketTooltip.ticket.status }}</div>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-400">Plate:</span>
              <span class="font-bold">{{ ticketTooltip.ticket.license_plate || '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Duration:</span>
              <span class="font-bold">{{ duration(ticketTooltip.ticket.check_in_time, ticketTooltip.ticket.check_out_time) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Amount:</span>
              <span class="font-bold text-emerald-400">{{ ticketTooltip.ticket.fare_amount != null ? `Rs. ${ticketTooltip.ticket.fare_amount}` : '—' }}</span>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
