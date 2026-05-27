<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTenantStore } from '../../stores/tenant';
import {
  Ticket, Search, Filter, X, Car, Clock, CreditCard,
  Banknote, Smartphone, ChevronRight, RefreshCcw,
  CheckCircle2, AlertCircle, Circle, ChevronLeft, ChevronRight as ChevRight
} from 'lucide-vue-next';

const store = useTenantStore();

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
  ACTIVE:           'text-blue-700 bg-blue-50 border-blue-200',
  PENDING_PAYMENT:  'text-amber-700 bg-amber-50 border-amber-200',
  PAID:             'text-green-700 bg-green-50 border-green-200',
  EXPIRED:          'text-slate-600 bg-slate-50 border-slate-200',
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
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-5">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Parking Tickets</h2>
        <p class="text-slate-500 text-sm mt-0.5">
          {{ store.ticketPagination.total }} total tickets
        </p>
      </div>
      <button @click="store.fetchTicketHistory(currentPage)" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
        <RefreshCcw class="w-4 h-4" :class="store.isLoading ? 'animate-spin' : ''" /> Refresh
      </button>
    </div>

    <!-- Filters row -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Search -->
      <div class="relative flex-1 max-w-sm">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input v-model="search" type="text" placeholder="Search by plate, ticket #…"
          class="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <!-- Status pills -->
      <div class="flex gap-1.5 flex-wrap">
        <button v-for="s in statuses" :key="s"
          @click="applyFilter(s)"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
            statusFilter === s
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
          ]">
          {{ s.replace('_', ' ') }}
        </button>
      </div>
    </div>

    <!-- Table card -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <!-- Loading -->
      <div v-if="store.isLoading" class="py-16 text-center text-slate-400">
        <RefreshCcw class="w-6 h-6 animate-spin inline-block mb-2" />
        <p class="text-sm font-medium">Loading tickets…</p>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredTickets.length === 0" class="py-16 text-center">
        <Ticket class="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p class="text-slate-500 font-semibold">No tickets found</p>
        <p class="text-slate-400 text-sm mt-1">Try adjusting your filter or search.</p>
      </div>

      <!-- Data table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left min-w-[640px]">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ticket / Vehicle</th>
              <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Check-In</th>
              <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
              <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
              <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="ticket in filteredTickets" :key="ticket._id"
              class="hover:bg-slate-50/60 cursor-pointer transition-colors"
              @click="openDetail(ticket)">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Car class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="font-bold text-sm text-slate-900">{{ ticket.license_plate || '—' }}</p>
                    <p class="text-[10px] text-slate-400 font-mono">{{ ticket.ticket_number?.slice(0,16) || ticket._id?.slice(-10) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">{{ ticket.vehicle_type || '—' }}</span>
              </td>
              <td class="px-5 py-4 text-sm text-slate-600">{{ formatTime(ticket.check_in_time) }}</td>
              <td class="px-5 py-4">
                <span class="flex items-center gap-1 text-sm text-slate-600">
                  <Clock class="w-3.5 h-3.5 text-slate-400" />
                  {{ duration(ticket.check_in_time, ticket.check_out_time) }}
                </span>
              </td>
              <td class="px-5 py-4 font-bold text-sm text-slate-900">
                {{ ticket.fare_amount != null ? `Rs. ${ticket.fare_amount}` : '—' }}
              </td>
              <td class="px-5 py-4">
                <span :class="['px-2 py-1 border rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max', statusStyles[ticket.status] || 'text-slate-500 bg-slate-50 border-slate-200']">
                  <component :is="statusIcons[ticket.status] || Circle" class="w-3 h-3" />
                  {{ ticket.status }}
                </span>
              </td>
              <td class="px-5 py-4">
                <ChevronRight class="w-4 h-4 text-slate-400" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="store.ticketPagination.totalPages > 1"
        class="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
        <p class="text-xs text-slate-500">
          Page {{ currentPage }} of {{ store.ticketPagination.totalPages }}
          <span class="text-slate-400">({{ store.ticketPagination.total }} total)</span>
        </p>
        <div class="flex gap-1">
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1"
            class="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= store.ticketPagination.totalPages"
            class="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40">
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
          class="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-y-auto">

          <!-- Panel Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
            <div>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Detail</p>
              <p class="font-black text-slate-900 text-lg mt-0.5">{{ selectedTicket.license_plate || 'Unknown' }}</p>
            </div>
            <button @click="closeDetail" class="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Status Badge -->
          <div class="px-6 pt-5">
            <span :class="['px-3 py-1.5 border rounded-lg text-xs font-black uppercase tracking-wider inline-flex items-center gap-2', statusStyles[selectedTicket.status]]">
              <component :is="statusIcons[selectedTicket.status] || Circle" class="w-3.5 h-3.5" />
              {{ selectedTicket.status }}
            </span>
          </div>

          <!-- Ticket Info -->
          <div class="px-6 py-5 space-y-5 flex-1">
            <!-- Ticket ID -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ticket Number</p>
              <p class="font-mono text-sm font-bold text-slate-800 break-all">{{ selectedTicket.ticket_number || selectedTicket._id }}</p>
            </div>

            <!-- Timing block -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check-In</p>
                <p class="text-sm font-semibold text-slate-900">{{ formatTime(selectedTicket.check_in_time) }}</p>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check-Out</p>
                <p class="text-sm font-semibold text-slate-900">{{ selectedTicket.check_out_time ? formatTime(selectedTicket.check_out_time) : 'Still Active' }}</p>
              </div>
            </div>

            <!-- Duration + Vehicle -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p class="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Duration</p>
                <p class="text-xl font-black text-blue-700">{{ duration(selectedTicket.check_in_time, selectedTicket.check_out_time) }}</p>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle Type</p>
                <p class="text-sm font-black text-slate-900 uppercase">{{ selectedTicket.vehicle_type || '—' }}</p>
              </div>
            </div>

            <!-- Fare -->
            <div v-if="selectedTicket.fare_amount != null" class="bg-green-50 border border-green-200 rounded-xl p-5 flex justify-between items-center">
              <div>
                <p class="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Total Fare</p>
                <p class="text-3xl font-black text-green-700">Rs. {{ selectedTicket.fare_amount }}</p>
              </div>
              <div v-if="selectedTicket.payment_method" class="flex items-center gap-2 text-green-600">
                <component :is="paymentIcon[selectedTicket.payment_method] || CreditCard" class="w-5 h-5" />
                <span class="text-xs font-bold uppercase">{{ selectedTicket.payment_method }}</span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="selectedTicket.notes" class="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p class="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Notes</p>
              <p class="text-sm text-amber-800">{{ selectedTicket.notes }}</p>
            </div>

            <!-- Operator / Staff -->
            <div v-if="selectedTicket.operator_id" class="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                {{ selectedTicket.operator_id?.toString().slice(-2) }}
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase">Processed by</p>
                <p class="text-sm font-bold text-slate-900">Gate Staff</p>
              </div>
            </div>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
