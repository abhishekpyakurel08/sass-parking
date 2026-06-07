import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

import LandingView from "../views/landing/LandingView.vue";
import LoginView from "../views/auth/LoginView.vue";
import TenantDashboardView from "../views/tenant/TenantDashboardView.vue";
import SuperadminDashboardView from "../views/SuperAdminDashboard/SuperadminDashboard.vue";

const routes = [
  {
    path: "/",
    name: "landing",
    component: LandingView,
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: "/verify-email",
    name: "verify-email",
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: "/reset-password",
    name: "reset-password",
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: "/tenant",
    name: "tenant-dashboard",
    component: TenantDashboardView,
    meta: { requiresAuth: true, role: 'TENANT_OWNER' },
  },
  {
    path: "/tenant/:slug",
    name: "tenant-dashboard-slug",
    component: TenantDashboardView,
    meta: { requiresAuth: true, role: 'TENANT_OWNER' },
  },
  {
    path: "/superadmin",
    name: "superadmin-dashboard",
    component: SuperadminDashboardView,
    meta: { requiresAuth: true, role: 'SUPER_ADMIN' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated();
  const userRole = authStore.user?.role;
  const userSlug = authStore.user?.slug;

  // Protect routes that require authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: "login" });
  }

  // Prevent authenticated users from visiting guest-only pages (like login)
  if (to.meta.guestOnly && isAuthenticated) {
    if (userRole === 'SUPER_ADMIN') return next({ name: "superadmin-dashboard" });
    if (userRole === 'TENANT_OWNER') {
      if (userSlug) return next({ name: "tenant-dashboard-slug", params: { slug: userSlug } });
      return next({ name: "tenant-dashboard" });
    }
    return next({ name: "landing" });
  }

  // Protect routes based on role authorization
  if (to.meta.role && to.meta.role !== userRole) {
    if (userRole === 'SUPER_ADMIN') return next({ name: "superadmin-dashboard" });
    if (userRole === 'TENANT_OWNER') {
      if (userSlug) return next({ name: "tenant-dashboard-slug", params: { slug: userSlug } });
      return next({ name: "tenant-dashboard" });
    }
    return next({ name: "login" });
  }

  next();
});

export default router;
