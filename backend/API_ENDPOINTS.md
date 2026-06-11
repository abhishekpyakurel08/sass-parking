# ParkSaaS Pro API Endpoints Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Most endpoints require authentication via Bearer token in the `Authorization` header:
```
Authorization: Bearer <token>
```

Some endpoints support API key authentication:
```
Authorization: Bearer pk_<api_key>
```

---

## Endpoints

### Health & Root

#### GET `/`
Welcome endpoint

**Response:**
```json
{
  "success": true,
  "message": "Welcome to ParkSaaS Pro API",
  "version": "1.0.0",
  "health": "/health"
}
```

#### GET `/health`
Health check endpoint

**Response:**
```json
{
  "success": true,
  "services": {
    "database": "ok",
    "cache": "ok"
  },
  "uptime": 123.45,
  "memory": {},
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

### Authentication (`/api/v1/auth`)

#### POST `/auth/register`
Register a new user

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### POST `/auth/login`
Login user

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST `/auth/refresh`
Refresh access token

**Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### POST `/auth/logout`
Logout user (authenticated)

**Headers:**
```
Authorization: Bearer <token>
```

#### GET `/auth/verify-email`
Verify email address

**Query Params:**
- `token` - Verification token

**Rate Limit:** 5 requests per hour

---

### User (`/api/v1/user`)

#### POST `/user/auth/onboard`
Register tenant owner (public)

**Body:**
```json
{
  "email": "owner@example.com",
  "password": "password123",
  "name": "Tenant Owner",
  "tenantName": "My Parking Lot"
}
```

#### POST `/user/auth/login`
Login user

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST `/user/auth/pos-login`
POS login for gate staff

**Body:**
```json
{
  "email": "staff@example.com",
  "password": "password123"
}
```

#### POST `/user/auth/logout`
Logout user

#### GET `/user/me`
Get current user profile

**Headers:**
```
Authorization: Bearer <token>
```

#### POST `/user/auth/resend-verification`
Resend email verification

**Headers:**
```
Authorization: Bearer <token>
```

#### POST `/user/auth/verify-email`
Verify email (POST)

#### GET `/user/auth/verify-email`
Verify email (GET)

#### POST `/user/auth/forgot-password`
Initiate password reset

**Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST `/user/auth/reset-password`
Reset password with token

**Body:**
```json
{
  "token": "reset_token",
  "password": "new_password123"
}
```

---

### Tenants (`/api/v1/tenants`)

#### GET `/tenants/slug/:slug`
Get tenant by slug (public)

**Params:**
- `slug` - Tenant slug

#### GET `/tenants/me`
Get my tenant details

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### PUT `/tenants/me`
Update my tenant

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### GET `/tenants/staff`
Get all staff members

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### POST `/tenants/staff`
Create new staff member

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

**Body:**
```json
{
  "name": "Staff Name",
  "email": "staff@example.com",
  "role": "GATE_STAFF"
}
```

#### PATCH `/tenants/staff/:id`
Update staff member

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### DELETE `/tenants/staff/:id`
Delete staff member

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### POST `/tenants/staff/:id/regenerate-api-key`
Regenerate staff API key

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### GET `/tenants`
Get all tenants (super admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Role:** SUPER_ADMIN

#### POST `/tenants`
Create new tenant (super admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Role:** SUPER_ADMIN

#### PATCH `/tenants/:id`
Update tenant (super admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Role:** SUPER_ADMIN

#### DELETE `/tenants/:id`
Delete tenant (super admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Role:** SUPER_ADMIN

---

### Parking (`/api/v1/parking`)

#### POST `/parking/check-in`
Check in vehicle

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

**Body:**
```json
{
  "vehicleNumber": "ABC123",
  "vehicleType": "CAR",
  "customerPhone": "+1234567890"
}
```

#### POST `/parking/check-out`
Check out vehicle

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

**Body:**
```json
{
  "ticketId": "ticket_id_here"
}
```

#### POST `/parking/lost-ticket`
Handle lost ticket

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

**Body:**
```json
{
  "vehicleNumber": "ABC123",
  "estimatedEntryTime": "2024-01-01T10:00:00Z"
}
```

#### POST `/parking/process-payment`
Process payment

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

**Body:**
```json
{
  "ticketId": "ticket_id_here",
  "amount": 10.50,
  "paymentMethod": "CASH"
}
```

#### POST `/parking/scan`
Scan ticket/QR code

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

**Body:**
```json
{
  "qrCode": "qr_code_data"
}
```

#### GET `/parking/tickets`
Get all tickets

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

#### GET `/parking/export`
Export parking report

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### GET `/parking/:id/receipt`
Get ticket receipt

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

---

### Rates (`/api/v1/rates`)

#### POST `/rates`
Create parking rate

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

**Body:**
```json
{
  "vehicleType": "CAR",
  "hourlyRate": 5.00,
  "dailyRate": 25.00
}
```

#### GET `/rates`
Get all rates

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER, GATE_STAFF

#### GET `/rates/:vehicle_type`
Get rate by vehicle type

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER, GATE_STAFF

#### PATCH `/rates/:vehicle_type`
Update rate

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### DELETE `/rates/:vehicle_type`
Delete rate

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

---

### Analytics (`/api/v1/analytics`)

#### GET `/analytics/global`
Get global analytics (super admin only)

**Headers:**
```
Authorization: Bearer <token>
```

**Role:** SUPER_ADMIN

#### GET `/analytics/tenant`
Get tenant analytics

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER, GATE_STAFF

---

### Customers (`/api/v1/customers`)

#### POST `/customers`
Create customer

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

**Body:**
```json
{
  "name": "Customer Name",
  "phone": "+1234567890",
  "email": "customer@example.com",
  "vehicleNumber": "ABC123"
}
```

#### GET `/customers`
Get all customers

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### GET `/customers/:id`
Get customer by ID

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### PATCH `/customers/:id`
Update customer

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### DELETE `/customers/:id`
Delete customer

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

#### POST `/customers/:id/regenerate-qr`
Regenerate customer QR code

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER

---

### Audit Logs (`/api/v1/audit-logs`)

#### GET `/audit-logs`
Get audit logs

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER, SUPER_ADMIN

---

### Sync (`/api/v1/sync`)

#### POST `/sync/batch`
Sync batch for offline mobile app

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

**Body:**
```json
{
  "operations": [
    {
      "type": "check-in",
      "data": {},
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ]
}
```

---

### API Keys (`/api/v1/api-keys`)

#### POST `/api-keys`
Create API key

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER, GATE_STAFF

#### GET `/api-keys`
Get API keys

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER, GATE_STAFF

#### PATCH `/api-keys/:id`
Update API key

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER, GATE_STAFF

#### DELETE `/api-keys/:id`
Delete API key

**Headers:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant_id>
```

**Role:** TENANT_OWNER, GATE_STAFF

---

### Operator App (`/api/v1/operator`)

#### POST `/operator/check-in`
Operator app check-in

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

#### POST `/operator/check-out`
Operator app check-out

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

#### POST `/operator/process-payment`
Operator app process payment

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

#### POST `/operator/scan`
Operator app scan

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

#### POST `/operator/lost-ticket`
Operator app lost ticket

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

#### GET `/operator/stats`
Get daily stats for operator

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

#### GET `/operator/config`
Get operator configuration

**Headers:**
```
Authorization: Bearer <token> or Bearer pk_<api_key>
X-Tenant-ID: <tenant_id>
```

**Role:** GATE_STAFF, TENANT_OWNER

---

## User Roles

- **SUPER_ADMIN** - Full system access
- **TENANT_OWNER** - Tenant management and full access to tenant data
- **GATE_STAFF** - Parking operations (check-in, check-out, payments)

## Rate Limiting

- **Auth endpoints**: 1000 requests per 15 minutes
- **General API**: 10000 requests per 15 minutes
- **POS/Operator endpoints**: 10000 requests per 15 minutes (keyed by API key)
- **Email verification**: 5 requests per hour

## Headers

### Standard Headers
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (for authenticated endpoints)

### Tenant Identification
- `X-Tenant-ID: <tenant_id>` - Required for tenant-scoped operations
- `X-Tenant-Slug: <slug>` - Alternative tenant identification

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
