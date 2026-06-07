<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { toast } from 'vue3-toastify';
import { Car, Clock, DollarSign, Search, Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-vue-next';
import { parkingEndpoints } from '../../utils/endpoints';

interface Ticket {
  _id: string;
  ticket_number: string;
  license_plate: string;
  vehicle_type: string;
  check_in_time: string;
  check_out_time?: string;
  fare_amount: number;
  discount_amount: number;
  penalty_amount: number;
  status: 'ACTIVE' | 'PENDING_PAYMENT' | 'PAID';
  payment_method?: string;
}

const activeTab = ref<'checkin' | 'checkout' | 'payment'>('checkin');
const isLoading = ref(false);
const searchQuery = ref('');
const activeTickets = ref<Ticket[]>([]);
const pendingPaymentTickets = ref<Ticket[]>([]);

const checkInData = ref({
  license_plate: '',
  vehicle_type: 'CAR',
  customer_code: '',
  notes: '',
});

const checkOutData = ref({
  ticket_id: '',
});

const paymentData = ref({
  ticket_id: '',
  payment_method: 'CASH',
  amount_received: 0,
});

const filteredActiveTickets = computed(() => {
  if (!searchQuery.value) return activeTickets.value;
  const query = searchQuery.value.toLowerCase();
  return activeTickets.value.filter(t =>
    t.ticket_number.toLowerCase().includes(query) ||
    t.license_plate.toLowerCase().includes(query)
  );
});

const fetchActiveTickets = async () => {
  isLoading.value = true;
  try {
    const data = await parkingEndpoints.getTickets('?status=ACTIVE');
    activeTickets.value = data.data || [];
  } catch (error: any) {
    toast.error(error.message || 'Failed to fetch active tickets');
  } finally {
    isLoading.value = false;
  }
};

const fetchPendingPaymentTickets = async () => {
  isLoading.value = true;
  try {
    const data = await parkingEndpoints.getTickets('?status=PENDING_PAYMENT');
    pendingPaymentTickets.value = data.data || [];
  } catch (error: any) {
    toast.error(error.message || 'Failed to fetch pending payment tickets');
  } finally {
    isLoading.value = false;
  }
};

const handleCheckIn = async () => {
  if (!checkInData.value.license_plate) {
    toast.error('License plate is required');
    return;
  }
  isLoading.value = true;
  try {
    await parkingEndpoints.checkIn(checkInData.value);
    toast.success('Vehicle checked in successfully');
    checkInData.value = {
      license_plate: '',
      vehicle_type: 'CAR',
      customer_code: '',
      notes: '',
    };
    await fetchActiveTickets();
  } catch (error: any) {
    toast.error(error.message || 'Failed to check in vehicle');
  } finally {
    isLoading.value = false;
  }
};

const handleCheckOut = async () => {
  if (!checkOutData.value.ticket_id) {
    toast.error('Ticket ID is required');
    return;
  }
  isLoading.value = true;
  try {
    await parkingEndpoints.checkOut(checkOutData.value);
    toast.success('Vehicle checked out successfully');
    checkOutData.value.ticket_id = '';
    await fetchActiveTickets();
    await fetchPendingPaymentTickets();
  } catch (error: any) {
    toast.error(error.message || 'Failed to check out vehicle');
  } finally {
    isLoading.value = false;
  }
};

const handlePayment = async () => {
  if (!paymentData.value.ticket_id) {
    toast.error('Ticket ID is required');
    return;
  }
  isLoading.value = true;
  try {
    await parkingEndpoints.processPayment(paymentData.value);
    toast.success('Payment processed successfully');
    paymentData.value = {
      ticket_id: '',
      payment_method: 'CASH',
      amount_received: 0,
    };
    await fetchPendingPaymentTickets();
  } catch (error: any) {
    toast.error(error.message || 'Failed to process payment');
  } finally {
    isLoading.value = false;
  }
};

const selectTicketForCheckout = (ticket: Ticket) => {
  checkOutData.value.ticket_id = ticket.ticket_number;
  activeTab.value = 'checkout';
};

const selectTicketForPayment = (ticket: Ticket) => {
  paymentData.value.ticket_id = ticket.ticket_number;
  paymentData.value.amount_received = ticket.fare_amount + ticket.penalty_amount - ticket.discount_amount;
  activeTab.value = 'payment';
};

onMounted(() => {
  fetchActiveTickets();
  fetchPendingPaymentTickets();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Parking Operations</h2>
      <p class="text-slate-500 dark:text-slate-400">Manage vehicle check-in, check-out, and payments</p>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
      <button @click="activeTab = 'checkin'"
              :class="activeTab === 'checkin' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'"
              class="flex-1 min-w-max px-4 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2">
        <Car class="w-4 h-4" />
        <span class="hidden sm:inline">Check-In</span>
        <span class="sm:hidden">In</span>
      </button>
      <button @click="activeTab = 'checkout'"
              :class="activeTab === 'checkout' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'"
              class="flex-1 min-w-max px-4 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2">
        <ArrowRight class="w-4 h-4" />
        <span class="hidden sm:inline">Check-Out</span>
        <span class="sm:hidden">Out</span>
      </button>
      <button @click="activeTab = 'payment'"
              :class="activeTab === 'payment' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'"
              class="flex-1 min-w-max px-4 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2">
        <DollarSign class="w-4 h-4" />
        <span class="hidden sm:inline">Payment</span>
        <span class="sm:hidden">Pay</span>
      </button>
    </div>

    <!-- Check-In Tab -->
    <div v-if="activeTab === 'checkin'" class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Vehicle Check-In</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">License Plate</label>
          <input v-model="checkInData.license_plate" type="text" placeholder="ABC-1234"
                 class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 uppercase" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vehicle Type</label>
          <select v-model="checkInData.vehicle_type"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100">
            <option value="CAR">Car</option>
            <option value="MOTORCYCLE">Motorcycle</option>
            <option value="TRUCK">Truck</option>
            <option value="BUS">Bus</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Code (Optional)</label>
          <input v-model="checkInData.customer_code" type="text" placeholder="CUST-001"
                 class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 uppercase" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
          <input v-model="checkInData.notes" type="text" placeholder="Additional notes"
                 class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
        </div>
      </div>
      <button @click="handleCheckIn" :disabled="isLoading"
              class="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
        <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
        <span v-else>Check In Vehicle</span>
      </button>
    </div>

    <!-- Check-Out Tab -->
    <div v-if="activeTab === 'checkout'" class="space-y-6">
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Check-Out</h3>
        <div class="flex flex-col sm:flex-row gap-2">
          <input v-model="checkOutData.ticket_id" type="text" placeholder="Enter ticket number or license plate"
                 class="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
          <button @click="handleCheckOut" :disabled="isLoading"
                  class="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
            <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
            <span v-else>Check Out</span>
          </button>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div class="p-4 border-b border-slate-200 dark:border-slate-700">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Active Vehicles</h3>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input v-model="searchQuery" type="text" placeholder="Search..."
                     class="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 w-full sm:w-48" />
            </div>
          </div>
        </div>
        <div class="divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
          <div v-if="filteredActiveTickets.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">
            No active vehicles
          </div>
          <div v-for="ticket in filteredActiveTickets" :key="ticket._id"
               class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <Car class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div class="font-medium text-slate-900 dark:text-slate-100">{{ ticket.license_plate }}</div>
                  <div class="text-sm text-slate-500 dark:text-slate-400">{{ ticket.ticket_number }} • {{ ticket.vehicle_type }}</div>
                </div>
              </div>
              <div class="flex items-center justify-between sm:justify-end gap-3">
                <div class="text-right">
                  <div class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    {{ new Date(ticket.check_in_time).toLocaleTimeString() }}
                  </div>
                  <div class="text-xs text-slate-400 dark:text-slate-500">
                    {{ new Date(ticket.check_in_time).toLocaleDateString() }}
                  </div>
                </div>
                <button @click="selectTicketForCheckout(ticket)"
                        class="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
                  <ArrowRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Tab -->
    <div v-if="activeTab === 'payment'" class="space-y-6">
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Process Payment</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ticket Number</label>
            <input v-model="paymentData.ticket_id" type="text" placeholder="Enter ticket number"
                   class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
            <select v-model="paymentData.payment_method"
                    class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100">
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount Received</label>
            <input v-model.number="paymentData.amount_received" type="number" min="0" step="0.01"
                   class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
        </div>
        <button @click="handlePayment" :disabled="isLoading"
                class="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          <span v-else>Process Payment</span>
        </button>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div class="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Pending Payments</h3>
        </div>
        <div class="divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
          <div v-if="pendingPaymentTickets.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">
            No pending payments
          </div>
          <div v-for="ticket in pendingPaymentTickets" :key="ticket._id"
               class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <DollarSign class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div class="font-medium text-slate-900 dark:text-slate-100">{{ ticket.license_plate }}</div>
                  <div class="text-sm text-slate-500 dark:text-slate-400">{{ ticket.ticket_number }}</div>
                </div>
              </div>
              <div class="flex items-center justify-between sm:justify-end gap-3">
                <div class="text-right">
                  <div class="font-semibold text-slate-900 dark:text-slate-100">
                    ${{ (ticket.fare_amount + ticket.penalty_amount - ticket.discount_amount).toFixed(2) }}
                  </div>
                  <div class="text-xs text-slate-400 dark:text-slate-500">
                    Fare: ${{ ticket.fare_amount.toFixed(2) }}
                  </div>
                </div>
                <button @click="selectTicketForPayment(ticket)"
                        class="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
                  <DollarSign class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
