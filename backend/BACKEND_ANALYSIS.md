# ParkSaaS Backend - Comprehensive Analysis

## Overview
ParkSaaS is a production-grade, multi-tenant parking management SaaS backend built with Node.js, Express, TypeScript, and MongoDB. It's designed to serve multiple independent parking businesses with strict data isolation and enterprise-grade security.

---

## Technology Stack

### Core Framework
- **Express.js** - Web framework with TypeScript for type safety
- **Node.js** - Runtime environment (ES modules)
- **TypeScript** - Type-safe development

### Database & Caching
- **MongoDB** - Primary database via Mongoose ODM
- **Redis (ioredis)** - Caching layer for tenant data
- **Node-cache** - In-memory caching

### Authentication & Security
- **JWT (jsonwebtoken)** - Access and refresh token authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **hpp** - HTTP parameter pollution protection
- **xss-clean** - XSS protection
- **cors** - Cross-origin resource sharing

### Validation & Documentation
- **Zod** - Schema validation (version 4.4.3)
- **Swagger UI** - API documentation

### Additional Libraries
- **morgan** - HTTP request logging
- **winston** - Advanced logging
- **compression** - Response compression
- **node-cron** - Scheduled tasks
- **qrcode** - QR code generation
- **resend** - Email service
- **cookie-parser** - Cookie parsing

---

## Project Architecture

### Directory Structure
```
src/
├── app.ts                      # Express server setup, global error handling
├── config/                     # Configuration files
│   ├── env.ts                 # Environment variables with Zod validation
│   └── redis.ts               # Redis connection
├── DB/                         # Database configuration
│   └── config.ts              # MongoDB connection
├── controllers/                # Business logic (11 controllers)
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── tenant.controller.ts
│   ├── parking.controller.ts
│   ├── rates.controller.ts
│   ├── customer.controller.ts
│   ├── analytics.controller.ts
│   ├── operator.controller.ts
│   ├── auditLog.controller.ts
│   ├── sync.controller.ts
│   └── apiKey.controller.ts
├── middleware/                 # Express middleware (7 files)
│   ├── auth.middleware.ts      # JWT authentication, RBAC
│   ├── tenant.middleware.ts   # Multi-tenant isolation
│   ├── validate.middleware.ts  # Zod validation
│   ├── errorHandler.ts        # Global error handling
│   ├── mongoSanitize.ts       # NoSQL injection protection
│   ├── auditLogger.ts         # Audit logging
│   └── apiKeyAuth.middleware.ts # API key authentication
├── models/                     # Mongoose schemas (8 models)
│   ├── user.model.ts
│   ├── tenant.model.ts
│   ├── ticket.model.ts
│   ├── parkingTicket.model.ts
│   ├── hourlyRate.model.ts
│   ├── customer.model.ts
│   ├── auditLog.model.ts
│   └── apiKey.model.ts
├── routes/                     # API routes (11 route files)
│   ├── auth.route.ts
│   ├── user.route.ts
│   ├── tenant.route.ts
│   ├── parking.route.ts
│   ├── rates.route.ts
│   ├── customer.route.ts
│   ├── analytics.route.ts
│   ├── operator.routes.ts
│   ├── auditLog.route.ts
│   ├── sync.route.ts
│   └── apiKey.route.ts
├── types/                      # TypeScript definitions (8 files)
│   ├── enums.ts               # Enums for roles, status, vehicle types
│   ├── user.types.ts
│   ├── tenant.types.ts
│   ├── ticket.types.ts
│   ├── parkingTicket.types.ts
│   ├── hourlyRate.types.ts
│   └── customer.types.ts
└── utils/                      # Utility functions (10 files)
    ├── validation.schemas.ts  # Zod schemas
    ├── jwt.ts                 # JWT token generation/verification
    ├── logger.ts              # Winston logger
    ├── cache.ts               # Redis caching utilities
    ├── qr.ts                  # QR code generation
    ├── billing.ts             # Fare calculation
    ├── ticketNumber.ts        # Ticket number generation
    ├── email.ts               # Email sending
    ├── cron.ts                # Scheduled jobs
    └── subdomain.ts           # Subdomain extraction
```

---

## Multi-Tenant Architecture

### Data Isolation Strategy
The system implements strict multi-tenancy with three layers of protection:

1. **Tenant Context Injection**
   - `tenantMiddleware.ts` intercepts all requests
   - Extracts tenant ID from:
     - Subdomain (highest priority)
     - `X-Tenant-Slug` header
     - `X-Tenant-ID` header
     - JWT token (user's tenantId)
   - Validates tenant status (ACTIVE/SUSPENDED)

2. **Database Schema Enforcement**
   - All major models require `tenant_id` field
   - Indexed for efficient querying
   - Controllers automatically scope queries to tenant

3. **Cross-Tenant Prevention**
   - Controllers append `tenant_id` to all MongoDB queries
   - Middleware blocks cross-tenant access attempts
   - Security logging for suspicious activities

### Tenant Resolution Priority
```
1. Subdomain from Host header (e.g., tenant.example.com)
2. X-Tenant-Slug header
3. X-Tenant-ID header
4. User's tenantId from JWT
```

---

## Role-Based Access Control (RBAC)

### User Roles
1. **SUPER_ADMIN**
   - Global platform administrator
   - Not bound to any tenant
   - Can manage subscriptions, suspend tenants
   - Access to system-wide analytics

2. **TENANT_OWNER**
   - Business owner for a specific tenant
   - Scoped to their tenant only
   - Can manage rates, staff, parking lots
   - Access to financial analytics

3. **GATE_STAFF**
   - Physical operators using mobile POS
   - Scoped to their tenant
   - Gate assignment restrictions (ENTRY/EXIT/BOTH)
   - Limited to check-in/out, payments, daily stats

### Authentication Middleware
- `authenticate` - Validates JWT access tokens
- `requireRole(...roles)` - Enforces role-based access
- `authenticateAny` - Accepts JWT or API key authentication
- `tenantMiddleware` - Enforces tenant isolation

---

## Database Models

### Core Models

#### 1. User Model
```typescript
{
  tenant_id: ObjectId (indexed)
  name: string
  email: string (unique, lowercase)
  password_hash: string
  role: SUPER_ADMIN | TENANT_OWNER | GATE_STAFF
  gate_assignment: ENTRY | EXIT | BOTH
  ticket_prefix: string
  refresh_token: string
  is_email_verified: boolean
  email_verification_token: string
  password_reset_token: string
  password_reset_expires: Date
}
```

#### 2. Tenant Model
```typescript
{
  name: string
  slug: string (unique, lowercase)
  corporate_email: string (unique)
  status: ACTIVE | SUSPENDED
  contactNumber: string
  address: string
  ownerName: string
}
```

#### 3. Ticket Model
```typescript
{
  tenant_id: ObjectId (indexed)
  customer_id: ObjectId (optional)
  ticket_number: string (unique, sparse)
  license_plate: string (indexed)
  vehicle_type: CAR | BIKE | TRUCK | SUV | BUS
  check_in_time: Date
  check_out_time: Date
  fare_amount: number
  penalty_amount: number
  discount_amount: number
  status: ACTIVE | PENDING_PAYMENT | PAID
  payment_method: CASH | CARD | ESEWA | KHALTI | etc.
  amount_received: number
  change_given: number
  transaction_reference: string
  notes: string
}
```

#### 4. HourlyRate Model
```typescript
{
  tenant_id: ObjectId
  vehicle_type: CAR | BIKE | TRUCK | SUV | BUS
  rate_per_hour: number
  lost_ticket_penalty: number
  grace_period_minutes: number
}
```

#### 5. Customer Model
```typescript
{
  tenant_id: ObjectId
  name: string
  customer_code: string (unique per tenant)
  email: string
  phone_number: string
  discount_percentage: number (0-100)
  status: ACTIVE | SUSPENDED | EXPIRED
  total_savings: number
  qr_code_data: string
}
```

#### 6. AuditLog Model
```typescript
{
  tenant_id: ObjectId
  user_id: ObjectId
  action: string
  entity_type: string
  entity_id: string
  details: object
  ip_address: string
  user_agent: string
}
```

#### 7. ApiKey Model
```typescript
{
  tenant_id: ObjectId
  name: string
  key_hash: string
  permissions: string[]
  is_active: boolean
  last_used: Date
}
```

---

## API Endpoints

### Authentication Routes (`/api/v1/auth`)
- `POST /register` - Tenant registration
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout
- `POST /forgot-password` - Initiate password reset
- `POST /reset-password` - Complete password reset

### User Routes (`/api/v1/user`)
- `POST /onboard` - Public endpoint for tenant owner onboarding
- `GET /me` - Get current user profile
- `PUT /me` - Update profile
- `POST /change-password` - Change password

### Tenant Routes (`/api/v1/tenants`)
- `GET /` - List all tenants (SUPER_ADMIN only)
- `POST /` - Create new tenant (SUPER_ADMIN only)
- `GET /:id` - Get tenant details
- `PUT /:id` - Update tenant
- `DELETE /:id` - Delete tenant
- `POST /:id/suspend` - Suspend tenant
- `POST /:id/activate` - Activate tenant

### Parking Routes (`/api/v1/parking`)
- `POST /check-in` - Vehicle check-in
- `POST /check-out` - Vehicle check-out
- `POST /lost-ticket` - Handle lost ticket
- `POST /process-payment` - Process payment
- `POST /scan` - Scan ticket/QR code
- `GET /tickets` - List tickets (paginated)
- `GET /export` - Export report (CSV)
- `GET /:id/receipt` - Get printable receipt

### Rates Routes (`/api/v1/rates`)
- `GET /` - List hourly rates
- `POST /` - Create rate
- `PUT /:id` - Update rate
- `DELETE /:id` - Delete rate

### Customer Routes (`/api/v1/customers`)
- `GET /` - List customers
- `POST /` - Create customer
- `GET /:id` - Get customer details
- `PUT /:id` - Update customer
- `DELETE /:id` - Delete customer
- `POST /:id/regenerate-qr` - Regenerate QR code

### Analytics Routes (`/api/v1/analytics`)
- `GET /dashboard` - Dashboard statistics
- `GET /revenue` - Revenue analytics
- `GET /vehicles` - Vehicle statistics
- `GET /staff` - Staff performance

### Operator Routes (`/api/v1`)
- `GET /daily-stats` - Daily statistics for gate staff
- `GET /active-tickets` - Active tickets for gate staff

### Audit Log Routes (`/api/v1/audit-logs`)
- `GET /` - List audit logs
- `GET /:id` - Get audit log details

### Sync Routes (`/api/v1/sync`)
- `GET /rates` - Sync rates for offline POS
- `GET /customers` - Sync customers for offline POS

### API Key Routes (`/api/v1/api-keys`)
- `GET /` - List API keys
- `POST /` - Create API key
- `DELETE /:id` - Delete API key

---

## Security Features

### 1. Authentication
- JWT access tokens (15min expiry)
- JWT refresh tokens (7d expiry)
- Rotating refresh token strategy
- API key authentication for POS systems

### 2. Rate Limiting
- Auth endpoints: 1000 requests per 15 minutes
- API endpoints: 10,000 requests per 15 minutes
- POS endpoints: 10,000 requests per 15 minutes (key-based)

### 3. Input Validation
- Zod schemas for all endpoints
- Request body, params, and query validation
- Custom validation for business logic

### 4. Security Headers
- Helmet for security headers
- CORS configuration with origin whitelisting
- Trust proxy for reverse proxy setups

### 5. Injection Protection
- MongoDB query sanitization
- XSS protection
- HTTP parameter pollution protection

### 6. Audit Logging
- All sensitive actions logged
- IP address and user agent tracking
- Security event logging

---

## Key Features

### 1. Parking Operations
- **Check-in**: Vehicle entry with QR code generation
- **Check-out**: Automatic fare calculation
- **Lost Ticket**: Manual fare calculation with penalty
- **Payment Processing**: Multiple payment methods (Cash, Card, Esewa, Khalti, etc.)
- **Receipt Generation**: Printable receipts for thermal printers

### 2. Customer Management
- Customer registration with discount percentages
- QR code generation for quick check-in
- Customer status management (Active, Suspended, Expired)
- Total savings tracking

### 3. Rate Management
- Per-vehicle-type hourly rates
- Lost ticket penalties
- Grace period configuration
- Tenant-specific rates

### 4. Analytics & Reporting
- Dashboard statistics
- Revenue analytics
- Vehicle statistics
- Staff performance metrics
- CSV export functionality

### 5. Offline Support
- Rate synchronization for POS
- Customer synchronization for POS
- API key authentication for offline devices

### 6. Multi-Payment Support
- Cash payments with change calculation
- Digital payments (Esewa, Khalti, IMEpay, ConnectIPS)
- Transaction reference tracking

---

## Environment Configuration

### Required Environment Variables
```bash
PORT=5000
NODE_ENV=development|production|test
MONGODB_URI=mongodb://localhost:27017/parksaas
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
INITIAL_SUPERADMIN_EMAIL=<optional>
INITIAL_SUPERADMIN_PASSWORD=<optional>
RESEND_API_KEY=<required>
FRONTEND_URL=http://localhost:3000
```

### Configuration Validation
- All environment variables validated with Zod
- Application fails fast on invalid configuration
- Type-safe environment access

---

## Error Handling

### Custom Error Classes
- `NotFoundError` (404)
- `ConflictError` (409)
- `ValidationError` (400)
- `AuthError` (401)
- `ForbiddenError` (403)

### Global Error Handler
- Consistent JSON error responses
- Proper HTTP status codes
- Error logging with Winston
- Development vs production error details

---

## Logging

### Winston Logger
- Structured logging
- Multiple transports (console, file)
- Log levels (error, warn, info, debug)
- Security event logging
- Transaction logging

### Morgan HTTP Logging
- Request/response logging
- Combined format
- Skips successful requests in production
- Integrated with Winston

---

## Caching Strategy

### Redis Caching
- Tenant data caching
- Cache invalidation on tenant updates
- Reduced database load for tenant lookups

### In-Memory Caching
- Node-cache for frequently accessed data
- TTL-based expiration
- Session management

---

## Scheduled Tasks (Cron Jobs)

### Implemented Jobs
- Automated cleanup of expired tokens
- Database maintenance tasks
- Report generation
- Cache invalidation

---

## API Documentation

### Swagger/OpenAPI
- Interactive API documentation
- YAML configuration
- Served via Swagger UI
- Route: `/api-docs`

---

## Deployment

### Build Process
```bash
npm run build  # TypeScript compilation + asset copying
npm start      # Run compiled JavaScript
```

### Development
```bash
npm run dev    # Hot-reload with tsx
```

### Docker Support
- Dockerfile included
- Multi-stage build
- Production-ready image

---

## Key Design Patterns

### 1. Controller-Service Pattern
- Controllers handle HTTP concerns
- Business logic in controllers (simplified)
- Models handle data access

### 2. Middleware Chain
- Authentication → Authorization → Validation → Business Logic
- Composable middleware
- Request context enhancement

### 3. Transaction Management
- MongoDB transactions for financial operations
- Atomic operations
- Rollback on errors

### 4. Error Propagation
- Throw custom errors
- Centralized error handling
- Consistent error responses

---

## Performance Considerations

### Database Indexing
- `tenant_id` indexed on all tenant-scoped models
- Compound indexes for common queries
- Unique indexes for business keys

### Query Optimization
- Lean queries for large datasets
- Pagination for list endpoints
- Population optimization

### Rate Limiting
- Per-endpoint rate limits
- Skip successful requests
- Key-based limits for API keys

---

## Testing Considerations

### Validation Testing
- Zod schema validation
- Request/response validation
- Error scenario testing

### Security Testing
- Authentication flow
- Authorization checks
- Cross-tenant access prevention
- Injection attack prevention

---

## Future Enhancements

### Potential Improvements
1. **Service Layer**: Extract business logic from controllers
2. **Event Sourcing**: Implement event-driven architecture
3. **WebSocket**: Real-time updates for dashboard
4. **Microservices**: Split into separate services
5. **GraphQL**: Alternative to REST API
6. **Message Queue**: For async processing
7. **Read Replicas**: For improved read performance
8. **CDN**: For static assets
9. **Monitoring**: APM integration (New Relic, Datadog)
10. **Load Testing**: Performance benchmarking

---

## Summary

ParkSaaS backend is a well-architected, production-ready multi-tenant SaaS application with:

- **Strong Security**: JWT auth, RBAC, rate limiting, input validation
- **Multi-Tenancy**: Strict data isolation with tenant context injection
- **Scalability**: Caching, indexing, pagination, transaction management
- **Maintainability**: TypeScript, modular structure, comprehensive logging
- **Extensibility**: Plugin-based middleware, service-oriented design
- **Production-Ready**: Error handling, monitoring, Docker support

The codebase demonstrates enterprise-grade practices with attention to security, performance, and developer experience.
