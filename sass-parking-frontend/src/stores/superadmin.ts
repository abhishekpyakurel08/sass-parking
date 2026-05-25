import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { toast } from "vue3-toastify";

export const useSuperadminStore = defineStore("superadmin", () => {
  const activeTab = ref<
    "overview" | "tenants" | "users" | "plans" | "logs" | "settings"
  >("overview");
  const isLoading = ref(false);

  // --- Mock Data Initialization ---
  const initialStats = {
    activeTenants: 14,
    totalUsers: 84,
    monthlyRecurringRevenue: 184500.0,
    totalSessionsLogged: 32410,
    tierDistribution: [
      { name: "Basic", count: 8, percentage: 57 },
      { name: "Premium", count: 4, percentage: 28 },
      { name: "Enterprise", count: 2, percentage: 15 },
    ],
  };

  const initialTenants = [
    {
      _id: "tn_01",
      companyName: "Apex Parking Solutions",
      ownerName: "Sarah Jenkins",
      email: "sarah@apexparking.com",
      contactNumber: "+94 77 123 4567",
      address: "24 Galle Road, Colombo 03",
      subscriptionPlan: "PREMIUM",
      maxStaffLimit: 12,
      status: "ACTIVE",
      createdAt: "2024-08-12T08:30:00.000Z",
    },
    {
      _id: "tn_02",
      companyName: "Metro Transit Bays",
      ownerName: "Rohan De Silva",
      email: "rohan@metrotransit.lk",
      contactNumber: "+94 71 987 6543",
      address: "102 Kandy Road, Kurunegala",
      subscriptionPlan: "BASIC",
      maxStaffLimit: 5,
      status: "ACTIVE",
      createdAt: "2024-09-01T10:15:00.000Z",
    },
    {
      _id: "tn_03",
      companyName: "Capital Mall Plaza",
      ownerName: "Dilan Perera",
      email: "facilities@capitalplaza.com",
      contactNumber: "+94 11 234 5678",
      address: "45 Lotus Road, Colombo 01",
      subscriptionPlan: "ENTERPRISE",
      maxStaffLimit: 30,
      status: "ACTIVE",
      createdAt: "2023-11-15T14:20:00.000Z",
    },
    {
      _id: "tn_04",
      companyName: "Oceanic Leisure Arena",
      ownerName: "Marina Fernando",
      email: "billing@oceanic.lk",
      contactNumber: "+94 91 555 4321",
      address: "88 Marine Drive, Galle",
      subscriptionPlan: "BASIC",
      maxStaffLimit: 5,
      status: "SUSPENDED",
      createdAt: "2024-02-28T09:00:00.000Z",
    },
  ];

  const initialUsers = [
    {
      _id: "usr_101",
      name: "Sarah Jenkins",
      email: "sarah@apexparking.com",
      role: "TENANT_OWNER",
      tenantId: "tn_01",
      tenantName: "Apex Parking Solutions",
      apiKey: "pk_live_apex_8829f82d",
      createdAt: "2024-08-12T08:32:00.000Z",
    },
    {
      _id: "usr_102",
      name: "Kusal Mendis",
      email: "kusal@apexparking.com",
      role: "GATE_STAFF",
      tenantId: "tn_01",
      tenantName: "Apex Parking Solutions",
      apiKey: "pk_live_apex_staff_991a",
      createdAt: "2024-08-15T11:00:00.000Z",
    },
    {
      _id: "usr_103",
      name: "Rohan De Silva",
      email: "rohan@metrotransit.lk",
      role: "TENANT_OWNER",
      tenantId: "tn_02",
      tenantName: "Metro Transit Bays",
      apiKey: "pk_live_metro_431102cd",
      createdAt: "2024-09-01T10:18:00.000Z",
    },
    {
      _id: "usr_104",
      name: "Nipuna Bandara",
      email: "nipuna@metrotransit.lk",
      role: "GATE_STAFF",
      tenantId: "tn_02",
      tenantName: "Metro Transit Bays",
      apiKey: "pk_live_metro_staff_1082",
      createdAt: "2024-09-02T06:45:00.000Z",
    },
  ];

  const initialPlans = [
    {
      _id: "pl_01",
      name: "Basic Module",
      priceMonthly: 12500.0,
      maxStaff: 5,
      maxSlots: 50,
      features: "Single Gate Entry/Exit, Core Reporting, Ticket Generation",
    },
    {
      _id: "pl_02",
      name: "Premium Suite",
      priceMonthly: 35000.0,
      maxStaff: 15,
      maxSlots: 200,
      features:
        "Multi-Gate Sync, Automated Rate Computations, Webhook Integration, Analytics Engine",
    },
    {
      _id: "pl_03",
      name: "Enterprise Level",
      priceMonthly: 85000.0,
      maxStaff: 50,
      maxSlots: 1000,
      features:
        "Dedicated DB Cluster, API POS Access, Custom Branded Tickets, 24/7 Priority Support",
    },
  ];

  const initialLogs = [
    {
      _id: "log_01",
      timestamp: "2025-01-20T11:45:00.000Z",
      action: "TENANT_PROVISIONED",
      triggeredBy: "Platform Admin",
      targetId: "tn_02",
    },
    {
      _id: "log_02",
      timestamp: "2025-01-20T09:12:15.000Z",
      action: "TENANT_SUSPENDED",
      triggeredBy: "Platform Admin",
      targetId: "tn_04",
    },
    {
      _id: "log_03",
      timestamp: "2025-01-19T14:22:10.000Z",
      action: "PLAN_CREATED",
      triggeredBy: "Billing System",
      targetId: "pl_03",
    },
    {
      _id: "log_04",
      timestamp: "2025-01-19T08:05:00.000Z",
      action: "GLOBAL_SETTINGS_CHANGED",
      triggeredBy: "Super User",
      targetId: "sys_config",
    },
  ];

  // --- Reactive States ---
  const stats = ref<typeof initialStats | null>(null);
  const tenants = ref<typeof initialTenants>([]);
  const globalUsers = ref<typeof initialUsers>([]);
  const pricingPlans = ref<typeof initialPlans>([]);
  const auditLogs = ref<typeof initialLogs>([]);

  const globalSettings = reactive({
    maintenanceMode: false,
    globalRateFormula: "BASE_HOUR_FACTOR_1.2",
    smsGatewayUrl: "https://sms.platform-api.net/v2/send",
  });

  // Helper function to simulate network response times
  const delay = (ms: number = 400) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // --- Actions with Fallback Mock Fetch Implementation ---
  const fetchPlatformStats = async () => {
    isLoading.value = true;
    await delay();
    stats.value = { ...initialStats };
    isLoading.value = false;
  };

  const fetchTenants = async () => {
    isLoading.value = true;
    await delay();
    if (tenants.value.length === 0) {
      tenants.value = [...initialTenants];
    }
    isLoading.value = false;
  };

  const createTenant = async (tenantData: any) => {
    isLoading.value = true;
    await delay(600);
    try {
      const newTenant = {
        _id: `tn_${Date.now().toString().slice(-4)}`,
        companyName: tenantData.companyName,
        ownerName: tenantData.ownerName,
        email: tenantData.email,
        contactNumber: tenantData.contactNumber,
        address: tenantData.address,
        subscriptionPlan: tenantData.subscriptionPlan,
        maxStaffLimit: Number(tenantData.maxStaffLimit),
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      tenants.value.unshift(newTenant);

      // Auto-add dynamic log
      auditLogs.value.unshift({
        _id: `log_${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        action: "TENANT_PROVISIONED",
        triggeredBy: "Platform Admin",
        targetId: newTenant._id,
      });

      // Update Local Stats Counter
      if (stats.value) {
        stats.value.activeTenants += 1;
      }

      toast.success("Tenant facility deployed and synchronized");
      return true;
    } catch {
      toast.error("Error during tenant provisioning");
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const updateTenantStatus = async (tenantId: string, status: string) => {
    isLoading.value = true;
    await delay(300);
    const tenant = tenants.value.find((t) => t._id === tenantId);
    if (tenant) {
      tenant.status = status;
      auditLogs.value.unshift({
        _id: `log_${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        action: status === "ACTIVE" ? "TENANT_REACTIVATED" : "TENANT_SUSPENDED",
        triggeredBy: "Platform Admin",
        targetId: tenantId,
      });
      toast.success(`Tenant facility state set to ${status}`);
    } else {
      toast.error("Tenant target not found");
    }
    isLoading.value = false;
  };

  const fetchGlobalUsers = async () => {
    isLoading.value = true;
    await delay();
    if (globalUsers.value.length === 0) {
      globalUsers.value = [...initialUsers];
    }
    isLoading.value = false;
  };

  const createGlobalUser = async (userData: any) => {
    isLoading.value = true;
    await delay(500);
    const associatedTenant = tenants.value.find(
      (t) => t._id === userData.tenantId,
    );

    const newUser = {
      _id: `usr_${Date.now().toString().slice(-3)}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      tenantId: userData.tenantId,
      tenantName: associatedTenant
        ? associatedTenant.companyName
        : "External Pool",
      apiKey:
        userData.role === "TENANT_OWNER"
          ? `pk_live_${userData.name.toLowerCase().split(" ")[0]}_${Math.random().toString(16).slice(2, 10)}`
          : "N/A",
      createdAt: new Date().toISOString(),
    };

    globalUsers.value.unshift(newUser);

    if (stats.value) {
      stats.value.totalUsers += 1;
    }

    toast.success("Access keys generated & credentials sent");
    isLoading.value = false;
    return true;
  };

  const fetchPricingPlans = async () => {
    isLoading.value = true;
    await delay();
    if (pricingPlans.value.length === 0) {
      pricingPlans.value = [...initialPlans];
    }
    isLoading.value = false;
  };

  const createPlan = async (planData: any) => {
    isLoading.value = true;
    await delay(500);
    const newPlan = {
      _id: `pl_${Date.now().toString().slice(-3)}`,
      name: planData.name,
      priceMonthly: Number(planData.priceMonthly),
      maxStaff: Number(planData.maxStaff),
      maxSlots: Number(planData.maxSlots),
      features: planData.features,
    };
    pricingPlans.value.push(newPlan);
    toast.success("SaaS structural tier published");
    isLoading.value = false;
    return true;
  };

  const fetchAuditLogs = async () => {
    isLoading.value = true;
    await delay();
    if (auditLogs.value.length === 0) {
      auditLogs.value = [...initialLogs];
    }
    isLoading.value = false;
  };

  const fetchGlobalSettings = async () => {
    isLoading.value = true;
    await delay();
    isLoading.value = false;
  };

  const updateGlobalSettings = async () => {
    isLoading.value = true;
    await delay(400);
    toast.success("Global platform properties updated");
    isLoading.value = false;
  };

  return {
    activeTab,
    isLoading,
    stats,
    tenants,
    globalUsers,
    pricingPlans,
    auditLogs,
    globalSettings,
    fetchPlatformStats,
    fetchTenants,
    createTenant,
    updateTenantStatus,
    fetchGlobalUsers,
    createGlobalUser,
    fetchPricingPlans,
    createPlan,
    fetchAuditLogs,
    fetchGlobalSettings,
    updateGlobalSettings,
  };
});
