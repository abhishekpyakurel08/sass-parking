<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { toast } from 'vue3-toastify';
import { Plus, Search, Edit, Trash2, QrCode, Loader2, MoreVertical } from 'lucide-vue-next';
import { customerEndpoints } from '../../utils/endpoints';

interface Customer {
  _id: string;
  name: string;
  customer_code: string;
  email?: string;
  phone_number?: string;
  discount_percentage: number;
  status: 'ACTIVE' | 'INACTIVE';
  qr_data: string;
  created_at: string;
}

const customers = ref<Customer[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedCustomer = ref<Customer | null>(null);

const formData = ref({
  name: '',
  customer_code: '',
  email: '',
  phone_number: '',
  discount_percentage: 0,
});

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value;
  const query = searchQuery.value.toLowerCase();
  return customers.value.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.customer_code.toLowerCase().includes(query) ||
    c.email?.toLowerCase().includes(query) ||
    c.phone_number?.toLowerCase().includes(query)
  );
});

const fetchCustomers = async () => {
  isLoading.value = true;
  try {
    const data = await customerEndpoints.getAll();
    customers.value = data.data || [];
  } catch (error: any) {
    toast.error(error.message || 'Failed to fetch customers');
  } finally {
    isLoading.value = false;
  }
};

const openCreateModal = () => {
  formData.value = {
    name: '',
    customer_code: '',
    email: '',
    phone_number: '',
    discount_percentage: 0,
  };
  showCreateModal.value = true;
};

const openEditModal = (customer: Customer) => {
  selectedCustomer.value = customer;
  formData.value = {
    name: customer.name,
    customer_code: customer.customer_code,
    email: customer.email || '',
    phone_number: customer.phone_number || '',
    discount_percentage: customer.discount_percentage,
  };
  showEditModal.value = true;
};

const openDeleteModal = (customer: Customer) => {
  selectedCustomer.value = customer;
  showDeleteModal.value = true;
};

const createCustomer = async () => {
  try {
    await customerEndpoints.create(formData.value);
    toast.success('Customer created successfully');
    showCreateModal.value = false;
    await fetchCustomers();
  } catch (error: any) {
    toast.error(error.message || 'Failed to create customer');
  }
};

const updateCustomer = async () => {
  if (!selectedCustomer.value) return;
  try {
    await customerEndpoints.update(selectedCustomer.value._id, formData.value);
    toast.success('Customer updated successfully');
    showEditModal.value = false;
    await fetchCustomers();
  } catch (error: any) {
    toast.error(error.message || 'Failed to update customer');
  }
};

const deleteCustomer = async () => {
  if (!selectedCustomer.value) return;
  try {
    await customerEndpoints.delete(selectedCustomer.value._id);
    toast.success('Customer deleted successfully');
    showDeleteModal.value = false;
    await fetchCustomers();
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete customer');
  }
};

const regenerateQrCode = async (customer: Customer) => {
  try {
    await customerEndpoints.regenerateQr(customer._id);
    toast.success('QR code regenerated successfully');
    await fetchCustomers();
  } catch (error: any) {
    toast.error(error.message || 'Failed to regenerate QR code');
  }
};

onMounted(() => {
  fetchCustomers();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Customers</h2>
        <p class="text-slate-500 dark:text-slate-400">Manage your registered customers and their QR codes</p>
      </div>
      <button @click="openCreateModal"
              class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
        <Plus class="w-4 h-4" />
        Add Customer
      </button>
    </div>

    <!-- Search -->
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input v-model="searchQuery"
             type="text"
             placeholder="Search customers by name, code, email, or phone..."
             class="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Loader2 class="w-6 h-6 text-emerald-600 animate-spin mr-2" />
      <span class="text-slate-500 dark:text-slate-400">Loading customers...</span>
    </div>

    <!-- Customers Table -->
    <div v-else class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Discount</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr v-for="customer in filteredCustomers" :key="customer._id" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <span class="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                      {{ customer.name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div>
                    <div class="font-medium text-slate-900 dark:text-slate-100">{{ customer.name }}</div>
                    <div class="text-sm text-slate-500 dark:text-slate-400">{{ customer.customer_code }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-slate-900 dark:text-slate-100">{{ customer.email || '-' }}</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">{{ customer.phone_number || '-' }}</div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                  {{ customer.discount_percentage }}% OFF
                </span>
              </td>
              <td class="px-6 py-4">
                <span :class="customer.status === 'ACTIVE' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ customer.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="regenerateQrCode(customer)"
                          title="Regenerate QR Code"
                          class="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
                    <QrCode class="w-4 h-4" />
                  </button>
                  <button @click="openEditModal(customer)"
                          title="Edit Customer"
                          class="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                    <Edit class="w-4 h-4" />
                  </button>
                  <button @click="openDeleteModal(customer)"
                          title="Delete Customer"
                          class="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                No customers found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
        <div v-for="customer in filteredCustomers" :key="customer._id" class="p-4 space-y-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <span class="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  {{ customer.name.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div>
                <div class="font-medium text-slate-900 dark:text-slate-100">{{ customer.name }}</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">{{ customer.customer_code }}</div>
              </div>
            </div>
            <span :class="customer.status === 'ACTIVE' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
              {{ customer.status }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-slate-500 dark:text-slate-400">Email:</span>
              <span class="text-slate-900 dark:text-slate-100 ml-1">{{ customer.email || '-' }}</span>
            </div>
            <div>
              <span class="text-slate-500 dark:text-slate-400">Phone:</span>
              <span class="text-slate-900 dark:text-slate-100 ml-1">{{ customer.phone_number || '-' }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
              {{ customer.discount_percentage }}% OFF
            </span>
            <div class="flex items-center gap-1">
              <button @click="regenerateQrCode(customer)"
                      class="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
                <QrCode class="w-4 h-4" />
              </button>
              <button @click="openEditModal(customer)"
                      class="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                <Edit class="w-4 h-4" />
              </button>
              <button @click="openDeleteModal(customer)"
                      class="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div v-if="filteredCustomers.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">
          No customers found
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
        <div class="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Add New Customer</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
            <input v-model="formData.name" type="text" required
                   class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Code</label>
            <input v-model="formData.customer_code" type="text" required
                   class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100 uppercase" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input v-model="formData.email" type="email"
                   class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input v-model="formData.phone_number" type="tel"
                   class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discount Percentage</label>
            <input v-model.number="formData.discount_percentage" type="number" min="0" max="100"
                   class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
        </div>
        <div class="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button @click="showCreateModal = false"
                  class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button @click="createCustomer"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
            Create Customer
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
        <div class="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Customer</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
            <input v-model="formData.name" type="text" required
                   class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input v-model="formData.email" type="email"
                   class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input v-model="formData.phone_number" type="tel"
                   class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discount Percentage</label>
            <input v-model.number="formData.discount_percentage" type="number" min="0" max="100"
                   class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
        </div>
        <div class="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button @click="showEditModal = false"
                  class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button @click="updateCustomer"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
            Update Customer
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
        <div class="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Delete Customer</h3>
        </div>
        <div class="p-6">
          <p class="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete <span class="font-semibold text-slate-900 dark:text-slate-100">{{ selectedCustomer?.name }}</span>?
            This action cannot be undone.
          </p>
        </div>
        <div class="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button @click="showDeleteModal = false"
                  class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button @click="deleteCustomer"
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            Delete Customer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
