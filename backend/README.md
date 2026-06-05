# ParkSaaS Backend Architecture & Implementation Guide

The ParkSaaS backend is a highly scalable, multi-tenant Node.js application built with **Express**, **TypeScript**, and **MongoDB** (via Mongoose). It is designed specifically for enterprise-grade SaaS environments, ensuring strict data isolation across different parking businesses.

## 1. Core Technology Stack

- **Framework**: Express.js with TypeScript for type-safety.
- **Database**: MongoDB with Mongoose ODMs.
- **Validation**: Joi (for strict request body, params, and query validation).
- **Authentication**: JWT (JSON Web Tokens) with a rotating refresh-token strategy.
- **API Documentation**: Swagger/OpenAPI (served via the running API).

## 2. Multi-Tenant Architecture

Unlike a standard single-database application, ParkSaaS is designed to serve multiple independent businesses (Tenants).

### Data Isolation

- **Tenant Context Injection**: We utilize a custom `tenantMiddleware.ts` that intercepts requests, validates the `X-Tenant-ID` header (or extracts it from the JWT for owners/staff), and scopes all subsequent database queries to that specific `tenant_id`.
- **Database Schema**: Every major model (`Ticket`, `HourlyRate`, `Customer`, `User`, `ParkingSpace`) strictly requires a `tenant_id` field.
- **Cross-Tenant Prevention**: Even if a user alters an ID payload, the controllers inherently append the user's `tenant_id` to MongoDB queries (`{ _id: req.body.ticket_id, tenant_id: req.tenant.tenantId }`), preventing cross-tenant data leakage.

## 3. Role-Based Access Control (RBAC)

Security is managed via a middleware combination: `authenticate` (validates JWT) and `requireRole(roles...)`.

1. **`SUPER_ADMIN`**: Global platform administrators. Can manage subscriptions, suspend tenants, and view system-wide analytics. They are _not_ bound to a single `tenant_id`.
2. **`TENANT_OWNER`**: The business owner. Scoped to a specific tenant. Can manage rates, staff, parking lots, and view financial analytics for their business.
3. **`GATE_STAFF`**: The physical operators on the ground using the mobile POS app. They can only check vehicles in/out, process payments, and view their daily session stats.

## 4. Project Structure

The application follows a modular, controller-service pattern:

```text
src/
├── app.ts                  # Express server setup, global error handling
├── config/                 # Swagger YAML, DB connection, Env variables
├── controllers/            # Business logic (e.g., parking.controller.ts)
├── middleware/             # RBAC, tenant isolation, Zod validation
├── models/                 # Mongoose schemas (Ticket, User, Rate, Customer)
├── routes/                 # Express routers, binding routes to controllers
├── types/                  # Shared TS interfaces and enums (VehicleType, PaymentMethod)
└── utils/                  # Zod validation schemas, QR generators, Logger
```

## 5. Validation & Error Handling

### Zod Validation

All incoming requests pass through `validate.middleware.ts`. This middleware executes Zod schemas defined in `utils/validation.schemas.ts`. If the payload is invalid, the request is immediately rejected with a `400 Bad Request` containing a detailed map of the invalid fields, preventing bad data from ever reaching the controllers.

### Centralized Error Handling

Instead of returning raw `res.status(500)` everywhere, the controllers throw custom error classes:

- `NotFoundError(message)` -> 404
- `ConflictError(message)` -> 409
- `ValidationError(message)` -> 400

These are caught by the global error handler in `app.ts`, ensuring a consistent JSON error response structure:

```json
{
  "success": false,
  "message": "Resource not found"
}
```

## 6. Atomic Transactions

Critical financial workflows (e.g., `processPayment`, `lostTicket`) utilize **MongoDB Transactions** (`session.startTransaction()`). This ensures that if the system crashes while updating a ticket's status to `PAID`, but _before_ it updates the customer's loyalty discount, the entire database action rolls back cleanly without leaving corrupted half-states.
