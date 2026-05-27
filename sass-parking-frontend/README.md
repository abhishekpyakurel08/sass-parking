# ParkSaaS Frontend Architecture & UI Guide

The ParkSaaS frontend is a **Vue 3** application built with the **Composition API** (`<script setup>`) and **TypeScript**. It utilizes **Vite** for fast HMR and optimized production builds.

## 1. Architectural Philosophy
The application strictly follows a "smart container / dumb component" hybrid pattern, optimized heavily with global state to avoid "prop drilling" (passing properties down multiple layers of components unnecessarily).

### State Management vs. Prop Drilling
Instead of passing `activeTab`, `isLoading`, and `rates` through multiple component layers (e.g., passing them from `TenantDashboardView.vue` to every single child widget), we use **Pinia Stores**:
- `auth.ts`: Handles JWT session, user roles (`SUPER_ADMIN`, `TENANT_OWNER`), and login/logout logic.
- `tenant.ts`: Encapsulates all data related to the tenant dashboard (tickets, staff, rates, analytics).
- `superadmin.ts`: Encapsulates global platform stats, cross-tenant management, and platform pricing plans.

**Why this is better:**
Components simply import the store (`const store = useTenantStore()`) and access strictly typed data directly (`store.rates`). This eliminates messy properties and allows the UI to instantly react when data changes from any location.

## 2. Component Structure
The UI is divided into distinct, role-isolated views:

### `src/views/landing/`
- Contains `LandingView.vue`, along with shared public components like `NavBar.vue` and `AppFooter.vue`. These are optimized for SEO, marketing aesthetics, and fast initial load times.

### `src/views/tenant/`
- `TenantDashboardView.vue`: The central hub for `TENANT_OWNER` operations.
- Uses a unified monolithic file structure for its tab content (`v-if="activeTab === 'tickets'"`). Because Vue 3 compiler is highly efficient, having standard template conditionals mapped to query parameters provides a seamless, SPA-like experience without the heavy memory footprint of deep router nesting.

### `src/views/SuperAdminDashboard/`
- `SuperadminDashboard.vue`: The global management console.
- **Modular Design**: Unlike the tenant dashboard, the Super Admin console breaks its tabs into modular files (`overviewtab.vue`, `tenentstab.vue`, `settingstab.vue`). This makes the vast amount of administrative capabilities easier to maintain and prevents the parent file from bloating.

## 3. Styling & Responsive UI Implementation

The platform uses **Tailwind CSS** for a utility-first styling approach, ensuring a 100% custom and premium aesthetic.

### Key Aesthetic Principles
- **Modern Color Palette**: Heavy use of `slate-50` for backgrounds, crisp `bg-white` for cards, and vibrant `blue-600` for primary actions.
- **Soft Shadows & Borders**: Elements use `shadow-sm` and `border-slate-200` to create subtle depth without harsh contrasts.
- **Micro-Interactions**: Hover states (`hover:bg-slate-100`, `hover:text-blue-600`) and transitions (`transition-all duration-300`) make the interface feel responsive and alive.
- **Iconography**: Integrated with `lucide-vue-next` for sharp, consistent, modern SVG icons.

### Responsive Design (Mobile-First)
The UI heavily utilizes Tailwind's responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`) to adapt layouts:

1. **The Navigation Drawer Pattern**:
   - On Desktop (`lg:` and up): The sidebar (`<aside>`) is statically mounted (`lg:static`) and takes up 64 units (`w-64`).
   - On Mobile: The sidebar becomes an off-canvas drawer (`fixed inset-y-0 left-0 -translate-x-full`). 
   - A hamburger menu in the header toggles a `sidebarOpen` ref.
   - When opened on mobile, a `<Transition>` wraps a backdrop blur (`bg-black/40 backdrop-blur-sm`) that the user can click to dismiss the drawer.

2. **Adaptive Grids**:
   - Analytics cards stack vertically on phones (`grid-cols-1`).
   - On tablets (`sm:`), they expand into 3 columns (`sm:grid-cols-3`).
   - Main content areas use a 3-column split on large monitors (`xl:grid-cols-3`), placing the main tables in a 2-column span (`xl:col-span-2`) and auxiliary widgets (like Rate Config) in the remaining column.

3. **Data Tables**:
   - Tables are wrapped in `<div class="overflow-x-auto">`. This ensures that on small screens, the tables can be horizontally scrolled natively without breaking the rigid layout of the dashboard itself.

## 4. API Integration & Reactivity
Data fetching is heavily intertwined with the UI's reactive properties:
- Fetch states (`store.isLoading`) automatically toggle `<RefreshCcw class="animate-spin" />` loading indicators in the UI.
- Fallback states (`v-else-if="store.rates.length === 0"`) present clear, actionable "Empty State" UI blocks to the user rather than blank screens, guiding them to "Initialize Defaults" or "Add Item".
