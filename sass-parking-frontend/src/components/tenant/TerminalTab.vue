<script setup lang="ts">
import { ref } from 'vue';
import { useTenantStore } from '../../stores/tenant';
import { LogIn, LogOut, QrCode, Banknote, CreditCard, Smartphone, Car, MoreHorizontal } from 'lucide-vue-next';

const store = useTenantStore();

const checkInMode = ref<'MANUAL' | 'QR'>('MANUAL');
const checkInForm = ref({ vehicle_type: 'CAR', license_plate: '', customer_code: '' });
const checkOutCode = ref('');

const paymentForm = ref({ ticket_id: '', amount_received: 0, payment_method: 'CASH' });
const pendingCheckout = ref<any>(null);

const handleCheckIn = async () => {
  const payload: any = { vehicle_type: checkInForm.value.vehicle_type };
  if (checkInMode.value === 'MANUAL') payload.license_plate = checkInForm.value.license_plate;
  if (checkInMode.value === 'QR') payload.customer_code = checkInForm.value.customer_code;
  
  const ok = await store.checkInVehicle(payload);
  if (ok) {
    checkInForm.value.license_plate = '';
    checkInForm.value.customer_code = '';
  }
};

const handleCheckOutScan = async () => {
  if (!checkOutCode.value) return;
  const summary = await store.checkOutVehicle(checkOutCode.value);
  if (summary) {
    pendingCheckout.value = summary;
    paymentForm.value.ticket_id = summary.ticket_id || summary._id;
    paymentForm.value.amount_received = summary.total_amount ?? summary.fare_amount ?? 0;
  }
};

const handleProcessPayment = async () => {
  if (!pendingCheckout.value) return;
  const ok = await store.processPayment({
    ticket_id: paymentForm.value.ticket_id,
    payment_method: paymentForm.value.payment_method,
    amount_received: paymentForm.value.payment_method === 'CASH' ? paymentForm.value.amount_received : undefined
  });
  if (ok) {
    pendingCheckout.value = null;
    checkOutCode.value = '';
  }
};
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-slate-900">Terminal & Operations</h2>
      <p class="text-slate-500 text-sm mt-1">Manual overrides for vehicle entry, exit, and payments.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- CHECK IN BLOCK -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
          <div class="p-2 bg-blue-50 text-blue-600 rounded-lg"><LogIn class="w-5 h-5" /></div>
          <h3 class="font-bold text-lg text-slate-900">New Entry</h3>
        </div>

        <div class="flex gap-2 mb-4 bg-slate-50 p-1 rounded-lg">
          <button @click="checkInMode = 'MANUAL'" :class="['flex-1 py-1.5 text-sm font-semibold rounded-md', checkInMode === 'MANUAL' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500']">Standard</button>
          <button @click="checkInMode = 'QR'" :class="['flex-1 py-1.5 text-sm font-semibold rounded-md', checkInMode === 'QR' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500']">Customer QR</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase block mb-1">Vehicle Type</label>
            <select v-model="checkInForm.vehicle_type" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500">
              <option value="CAR">Car 🚗</option>
              <option value="BIKE">Motorbike 🏍️</option>
              <option value="TRUCK">Truck 🚛</option>
            </select>
          </div>

          <div v-if="checkInMode === 'MANUAL'">
            <label class="text-xs font-bold text-slate-500 uppercase block mb-1">License Plate</label>
            <input v-model="checkInForm.license_plate" type="text" placeholder="BA-12-PA-3456" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 uppercase" />
          </div>

          <div v-if="checkInMode === 'QR'">
            <label class="text-xs font-bold text-slate-500 uppercase block mb-1">Customer Code / QR payload</label>
            <input v-model="checkInForm.customer_code" type="text" placeholder="Scan QR..." class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
          </div>

          <button @click="handleCheckIn" :disabled="store.isLoading" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm mt-2 flex items-center justify-center gap-2">
            <QrCode class="w-4 h-4" /> Generate Ticket
          </button>
        </div>
      </div>

      <!-- CHECK OUT BLOCK -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
          <div class="p-2 bg-green-50 text-green-600 rounded-lg"><LogOut class="w-5 h-5" /></div>
          <h3 class="font-bold text-lg text-slate-900">Process Exit / Payment</h3>
        </div>

        <div v-if="!pendingCheckout" class="space-y-4">
          <div>
            <label class="text-xs font-bold text-slate-500 uppercase block mb-1">Ticket Number / License Plate</label>
            <div class="flex gap-2">
              <input v-model="checkOutCode" type="text" placeholder="Enter ID to scan" class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-500 uppercase" />
              <button @click="handleCheckOutScan" class="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm">Scan</button>
            </div>
          </div>
          
          <!-- Quick lost ticket button -->
          <div class="mt-4 pt-4 border-t border-slate-100 text-center">
            <button class="text-red-500 hover:text-red-700 text-sm font-bold underline">Lost Ticket Override</button>
          </div>
        </div>

        <div v-else class="space-y-4 animate-in fade-in">
          <!-- Premium Hourly Calculations Breakdown Receipt -->
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
            <div class="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span class="font-black text-slate-900 uppercase tracking-wide">{{ pendingCheckout.license_plate }}</span>
              <span class="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-black uppercase tracking-wider">
                {{ pendingCheckout.vehicle_type }}
              </span>
            </div>
            
            <div class="space-y-1.5 text-xs text-slate-600">
              <div class="flex justify-between">
                <span>Check-In Time:</span>
                <span class="font-semibold text-slate-800">
                  {{ new Date(pendingCheckout.check_in_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
              <div class="flex justify-between" v-if="pendingCheckout.check_out_time">
                <span>Check-Out Time:</span>
                <span class="font-semibold text-slate-800">
                  {{ new Date(pendingCheckout.check_out_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Total Duration:</span>
                <span class="font-semibold text-slate-800">
                  {{ Math.floor((pendingCheckout.duration_minutes || 0) / 60) }}h {{ Math.round((pendingCheckout.duration_minutes || 0) % 60) }}m
                </span>
              </div>
              <div class="flex justify-between" v-if="pendingCheckout.rate_per_hour">
                <span>Hourly Parking Rate:</span>
                <span class="font-semibold text-slate-800">Rs. {{ pendingCheckout.rate_per_hour }} / hr</span>
              </div>
            </div>

            <!-- Detailed Cost Breakdown -->
            <div class="pt-2 border-t border-dashed border-slate-300 space-y-1 text-xs">
              <div class="flex justify-between text-slate-500">
                <span>Subtotal (Duration × Rate):</span>
                <span class="font-semibold">Rs. {{ pendingCheckout.subtotal ?? pendingCheckout.fare_amount ?? 0 }}</span>
              </div>
              <div class="flex justify-between text-green-600 font-semibold" v-if="pendingCheckout.discount">
                <span>Discount Applied:</span>
                <span>- Rs. {{ pendingCheckout.discount }}</span>
              </div>
              <div class="flex justify-between text-red-500 font-semibold" v-if="pendingCheckout.penalty_amount">
                <span>Lost Penalty:</span>
                <span>+ Rs. {{ pendingCheckout.penalty_amount }}</span>
              </div>
              <div class="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                <span>Total Exit Payable:</span>
                <span class="text-green-600 font-black text-base">Rs. {{ pendingCheckout.total_amount ?? pendingCheckout.fare_amount ?? 0 }}</span>
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-500 uppercase block mb-1">Payment Method</label>
            <div class="grid grid-cols-3 gap-2">
              <button @click="paymentForm.payment_method = 'CASH'" :class="['py-2 border rounded-lg text-xs font-bold flex flex-col items-center gap-1', paymentForm.payment_method === 'CASH' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500']"><Banknote class="w-4 h-4"/> Cash</button>
              <button @click="paymentForm.payment_method = 'CARD'" :class="['py-2 border rounded-lg text-xs font-bold flex flex-col items-center gap-1', paymentForm.payment_method === 'CARD' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500']"><CreditCard class="w-4 h-4"/> Card</button>
              <button @click="paymentForm.payment_method = 'ESEWA'" :class="['py-2 border rounded-lg text-xs font-bold flex flex-col items-center gap-1', paymentForm.payment_method === 'ESEWA' ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500']"><Smartphone class="w-4 h-4"/> eSewa</button>
            </div>
          </div>

          <div v-if="paymentForm.payment_method === 'CASH'">
            <label class="text-xs font-bold text-slate-500 uppercase block mb-1">Amount Received</label>
            <input v-model.number="paymentForm.amount_received" type="number" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-500" />
            <p v-if="paymentForm.amount_received > (pendingCheckout.total_amount ?? pendingCheckout.fare_amount ?? 0)" class="text-xs font-bold text-slate-500 mt-1 text-right">Change: Rs. {{ paymentForm.amount_received - (pendingCheckout.total_amount ?? pendingCheckout.fare_amount ?? 0) }}</p>
          </div>

          <div class="flex gap-2 pt-2">
            <button @click="handleProcessPayment" :disabled="store.isLoading" class="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm">Confirm Payment</button>
            <button @click="pendingCheckout = null" class="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
