# Tenant Settings Management (Backend Documentation)

This document details the backend architectural flow for how a `TENANT_OWNER` manages their facility settings, profile data, and subscription configurations in the ParkSaaS API.

## 1. Overview of Tenant Settings
Unlike global system configurations, a Tenant's settings are strictly localized to their business (e.g., their corporate address, contact details, dynamic pricing rules, and staff constraints).

All operations related to a Tenant's own settings are handled via the `/api/v1/tenants/me` endpoint block.

## 2. API Endpoints

### `GET /api/v1/tenants/me`
Retrieves the current Tenant's company profile and active status.

- **Role Required**: `TENANT_OWNER`
- **Middleware Chain**:
  1. `authenticate` (Validates JWT)
  2. `requireRole(UserRole.TENANT_OWNER)` (Ensures caller is an owner)
  3. `tenantMiddleware` (Injects the `X-Tenant-ID` into `req.tenant`)
- **Controller Action**: `getMyTenant`
- **Returned Data**:
  - `name`: Business / Company Name
  - `corporate_email`: Registered business email (Immutable by tenant)
  - `ownerName`: Primary account holder
  - `contactNumber`: Phone number
  - `address`: Physical facility location
  - `status`: e.g., `ACTIVE` or `SUSPENDED`
  - `subscriptionPlan`: e.g., `BASIC`, `PRO`, `ENTERPRISE`

### `PUT /api/v1/tenants/me`
Allows the Tenant Owner to update their operational settings.

- **Role Required**: `TENANT_OWNER`
- **Validation**: Strict validation via `updateMyTenantSchema` (Zod). 
  - Prevents the tenant from modifying restricted fields like `status` or `subscriptionPlan` (which require a `SUPER_ADMIN`).
- **Allowed Updatable Fields**:
  - `name` (string)
  - `contactNumber` (string)
  - `address` (string)
  - `ownerName` (string)
- **Database Operation**:
  ```typescript
  await Tenant.findByIdAndUpdate(
    req.tenant.tenantId, // Safely extracted from JWT/Header
    { $set: updatePayload },
    { new: true }
  );
  ```

## 3. Security Considerations
- **No ID in Payload**: The `PUT` and `GET` requests do **not** take a `tenant_id` parameter in the URL or Body. This physically prevents a Tenant Admin from attempting to modify `/api/v1/tenants/another-id`. The backend exclusively relies on `req.tenant.tenantId` injected by the middleware.
- **Immutable Financial Blocks**: Tenant Admins cannot alter their `subscriptionPlan` or `total_capacity` via this endpoint. Upgrades must be routed through the billing service or modified by a `SUPER_ADMIN`.

## 4. Frontend Integration
On the frontend (`sass-parking-frontend`), these endpoints map directly to the **Settings Tab** (`activeTab === 'settings'`) inside `TenantDashboardView.vue`.
The data is centrally managed by the Pinia `tenant.ts` store via the `fetchProfile()` and `updateProfile()` actions, ensuring that changes instantly reflect across the dashboard header and sidebars.

---

## 5. Staff Management Settings

### `POST /api/v1/tenants/staff`
Creates a new `GATE_STAFF` operator account scoped to the calling Tenant's `tenant_id`.

- **Role Required**: `TENANT_OWNER`
- **Validation Schema**: `createStaffSchema`
  - `name` (required, string)
  - `email` (required, valid email format)
  - `password` (required, min 8 characters)
- **Controller Logic** (`createStaff`):
  1. Checks if a user with the given `email` already exists globally (not just within tenant). Returns `409 Conflict` if found.
  2. Hashes the password using `bcrypt` with configurable salt rounds (`env.BCRYPT_ROUNDS`).
  3. Creates the user document with `role: UserRole.GATE_STAFF` and `tenant_id` injected from `req.tenant.tenantId`.
- **Returned Data** (password hash is never returned):
  ```json
  {
    "success": true,
    "data": {
      "id": "...",
      "name": "Jane Doe",
      "email": "jane@facility.com",
      "role": "GATE_STAFF"
    }
  }
  ```

### `GET /api/v1/tenants/staff`
Returns all gate staff belonging to the calling Tenant.

- **Role Required**: `TENANT_OWNER`
- **Controller Logic** (`getStaff`):
  ```typescript
  User.find({ tenant_id: req.tenant!.tenantId, role: UserRole.GATE_STAFF })
    .select('-password_hash -refresh_token') // Sensitive fields always stripped
    .lean()
  ```
- **Note**: Tenant Admins can only see their own staff — the `tenant_id` filter ensures this strictly.

---

## 6. Rate Configuration Settings

Rate configuration is managed through a separate route group at `/api/v1/rates`.

### `GET /api/v1/rates`
Fetches all parking rates scoped to the calling Tenant.

### `POST /api/v1/rates`
Creates a new rate entry for a vehicle type that does not yet exist for this tenant.

- **Required Fields**:
  - `vehicle_type`: Must be **strictly uppercase** (e.g., `CAR`, `BIKE`, `TRUCK`). Lowercase values return a `400 Bad Request`.
  - `rate_per_hour`: A positive number.
- **Optional Fields**: `grace_period_minutes`, `lost_ticket_penalty`

### `PATCH /api/v1/rates/:vehicle_type`
Updates an existing rate by its vehicle type identifier.

- **URL Param**: `:vehicle_type` must be **uppercase** (e.g., `/api/v1/rates/CAR`)
- **Updatable Fields**: `rate_per_hour`, `grace_period_minutes`, `lost_ticket_penalty`

> **Frontend Upsert Pattern**: The `upsertRate()` action in `tenant.ts` attempts `PATCH` first. If the backend returns a `404` (rate not yet created), it falls back to `POST` with the full payload including `vehicle_type`.

---

## 7. Complete Middleware Chain

For every Tenant settings request, the following middleware chain executes in order:

```
Request
  ↓
authenticate         → Validates Bearer token, attaches req.user (id, role, tenantId)
  ↓
requireRole(...)     → Guards the route; returns 403 if role doesn't match
  ↓
tenantMiddleware     → Resolves X-Tenant-ID header OR falls back to req.user.tenantId
                       Populates req.tenant = { tenantId, tenantName }
  ↓
validate(schema)     → (If applicable) runs Zod schema; returns 400 with field errors
  ↓
Controller Function  → Executes business logic; always scopes DB queries to req.tenant.tenantId
```

---

## 8. Error Codes Reference

| Status | Error Class       | When It Occurs                                              |
|--------|-------------------|-------------------------------------------------------------|
| `400`  | `ValidationError` | Invalid payload (wrong type, missing required field, lowercase vehicle_type) |
| `401`  | `Unauthorized`    | Missing or expired JWT token                                |
| `403`  | `Forbidden`       | Correct JWT, but wrong role (e.g., `GATE_STAFF` on `/me`)  |
| `404`  | `NotFoundError`   | Rate or Tenant record not found in DB                       |
| `409`  | `ConflictError`   | Staff email already registered in the system                |
| `500`  | Internal Error    | Unhandled database or server error                          |

---

## 9. Immutable Fields (Protected at Controller Level)

The following fields are explicitly deleted from the request payload before any DB update in `updateMyTenant`:

```typescript
delete updates.status;           // Only SUPER_ADMIN can suspend/activate a tenant
delete updates.corporate_email;  // Account email is frozen after registration
delete updates.total_capacity;   // Physical capacity is set during provisioning
```

This means even if a frontend client sends these fields in the body, the backend silently discards them before saving — providing a defense-in-depth layer beyond just Zod validation.
