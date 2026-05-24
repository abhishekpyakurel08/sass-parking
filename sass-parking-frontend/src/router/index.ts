import { createRouter, createWebHistory } from "vue-router";

import LandingView from "../views/landing/LandingView.vue";
import LoginView from "../views/auth/LoginView.vue";
import OperatorDashboardView from "../views/operator/DashboardView.vue";
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
  },
  {
    path: "/operator",
    name: "operator-dashboard",
    component: OperatorDashboardView,
  },
  {
    path: "/tenant",
    name: "tenant-dashboard",
    component: TenantDashboardView,
  },
  {
    path: "/superadmin",
    name: "superadmin-dashboard",
    component: SuperadminDashboardView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
