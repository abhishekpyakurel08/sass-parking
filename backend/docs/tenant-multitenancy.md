# Tenant & Subdomain (Slug) — Documentation

This document summarizes the multi-tenant model changes implemented in the codebase, how tenant slugs and subdomains are generated and resolved, and the removal of the `total_capacity` field. It includes developer notes, API examples, migration considerations, and recommended next steps.

**Overview**

- The application uses tenant documents to separate customer data.
- Tenants are identified by a `slug` (URL-friendly, lowercase, alphanumeric and hyphens).
- Subdomain routing is supported: requests to `<slug>.<base-domain>` are resolved to the tenant by matching the `slug` field.
- The `total_capacity`/`capacity` field has been removed from the tenant model and related code paths.

**Files Changed / Relevant Paths**

- `src/models/tenant.model.ts` — Tenant schema (contains `slug` field; `total_capacity` removed).
- `src/types/tenant.types.ts` — `ITenant` type updated to remove `total_capacity`.
- `src/controllers/tenant.controller.ts` — Tenant creation now generates a `slug` from `name`, validates it, ensures uniqueness, and persists it.
- `src/controllers/auth.controller.ts` — Registration flow updated to not accept `total_capacity`.
- `src/controllers/user.controller.ts` — Onboarding/register flow updated to not accept `total_capacity`.
- `src/controllers/operator.controller.ts` — Operator config no longer exposes capacity.
- `src/middleware/tenant.middleware.ts` — Tenant resolution logic (subdomain, headers, X-Tenant-ID fallback).
- `src/utils/subdomain.ts` — Utilities for normalizing/validating slugs and extracting subdomains.
- `src/utils/validation.schemas.ts` — Validation removed for `total_capacity`.
- `src/routes/tenant.route.ts` — Public `GET /slug/:slug` endpoint to fetch tenant by slug.

**Tenant Model (current shape)**

Key fields in `Tenant` (relevant):

- `name` — string (required)
- `slug` — string (unique, lowercase, trimmed) — generated from `name` during creation if not provided
- `corporate_email` — string (required, unique)
- `status` — enum (`ACTIVE`, `SUSPENDED`)
- optional contact fields: `contactNumber`, `address`, `ownerName`

Note: `total_capacity` has been removed intentionally; any UI or external documentation referencing capacity should be updated.

**Slug Generation & Validation**

- Slug normalization is handled by `src/utils/subdomain.ts`'s `normalizeSlug` function:
  - Lowercases the input
  - Trims whitespace
  - Keeps only `[a-z0-9-]`
  - Collapses multiple hyphens and trims leading/trailing hyphens

- Slug format is validated by `validateSlug`:
  - Must be 3–50 characters
  - Must start and end with an alphanumeric character
  - Allowed characters: alphanumeric and hyphen

- During tenant creation (`POST /api/v1/tenants`), the controller:
  1. Normalizes the provided `name` to a base slug.
  2. Validates the slug.
  3. Ensures uniqueness by appending `-1`, `-2`, ... until unique (up to 1000 attempts).
  4. Persists the tenant with the generated `slug`.

- If slug generation fails validation or uniqueness can't be achieved, the API returns an error:
  - `ValidationError` for invalid slug
  - `ConflictError` if unique slug cannot be generated

**Subdomain Utilities**

- `extractSubdomain(host: string): string | null` — extracts the left-most label when hostname has >2 parts (e.g., `acme.example.com` -> `acme`). Returns `null` for `localhost` or IP addresses.
- `isSubdomain(host: string): boolean` — wrapper around `extractSubdomain`.
- `getBaseDomain(host: string): string` — returns the base domain (e.g., `acme.example.com` -> `example.com`).
- `normalizeSlug` / `validateSlug` — described above.

**Tenant Middleware Resolution** (`src/middleware/tenant.middleware.ts`)

Resolution priority (first match wins):
1. Host header subdomain: extract subdomain, normalize it, find tenant by `slug`.
2. `X-Tenant-Slug` header: normalize and resolve by `slug`.
3. `X-Tenant-ID` header: use ObjectId.
4. `req.user.tenantId` (derived from user's JWT) as final fallback.

Important behavior:
- `SUPER_ADMIN` role bypasses tenant resolution.
- Cross-tenant access is blocked: if `req.user.tenantId` exists and differs from resolved tenant, request is rejected with `ForbiddenError`.
- Resolved tenant is cached via `utils/cache` and stored on `req.tenant = { tenantId, tenantName }` for handlers.
- Suspended tenants (`TenantStatus.SUSPENDED`) are blocked with a `ForbiddenError`.

**Public Routes / Endpoints**

- `GET /api/v1/tenants/slug/:slug` — public route to get tenant by slug (returns 404 if not found).
- `POST /api/v1/tenants` — creates tenant (requires `SUPER_ADMIN` role in current setup). Generates and persists `slug`.
- Registration and onboarding endpoints (in `auth` and `user` controllers) also create tenants but were updated to remove `total_capacity`.

**Validation Changes**

- Removed `total_capacity` from the following validation schemas in `src/utils/validation.schemas.ts`:
  - `registerSchema`
  - `createTenantSchema`
  - `updateTenantSchema`

- If you want to allow clients to provide a `slug` during registration/create flows, ensure `slug` is validated using `normalizeSlug` / `validateSlug` before persisting to maintain format and uniqueness rules.

**Removed `total_capacity` — Notes & Migration**

- The `total_capacity` field was removed from the schema and types, and all usages were eliminated from controllers and validation.
- If your production database contains `total_capacity` values and you want to keep a historical record, consider:
  - Leaving the existing values in the documents (MongoDB is schemaless) — they will remain accessible if needed.
  - If you want to actively remove the field from existing documents, run a migration script (example provided below).

Migration example (remove field from existing tenants):

```js
// scripts/remove_capacity_field.js
// Run with: node scripts/remove_capacity_field.js

import mongoose from 'mongoose';
import { Tenant } from '../src/models/tenant.model.js';
import { env } from '../src/config/env.js';

const run = async () => {
  await mongoose.connect(env.MONGODB_URI);
  await Tenant.updateMany({}, { $unset: { total_capacity: '' } });
  console.log('Removed total_capacity from tenants');
  process.exit(0);
};
run().catch(err => { console.error(err); process.exit(1); });
```

Caution: run in a safe environment and backup production data first.

**How to test locally (quick smoke tests)**

- Install & run the app:

```bash
pnpm install
pnpm start
```

- Create a tenant (example requires `SUPER_ADMIN` JWT):

```bash
curl -X POST 'http://localhost:3000/api/v1/tenants' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <SUPER_ADMIN_JWT>' \
  -d '{"name":"Acme Parking","corporate_email":"acme@example.com"}'
```

- Response will include the created tenant and `slug`.

- Fetch tenant by slug (public):

```bash
curl 'http://localhost:3000/api/v1/tenants/slug/acme-parking'
```

- Test middleware resolution using `Host` header (subdomain):

```bash
curl 'http://localhost:3000/api/v1/parking' \
  -H 'Host: acme-parking.example.com' \
  -H 'Authorization: Bearer <TENANT_USER_JWT>'
```

- Or use `X-Tenant-Slug` header as fallback:

```bash
curl 'http://localhost:3000/api/v1/parking' \
  -H 'X-Tenant-Slug: acme-parking' \
  -H 'Authorization: Bearer <TENANT_USER_JWT>'
```

**Developer notes & suggestions**

- Consider exposing the ability for admins to supply a `slug` on tenant creation (validate with `validateSlug`) so customers can pick readable subdomains.
- Consider adding a small UI preview when creating a tenant to show the final generated slug and allow edits.
- Add automated tests (unit + integration) covering:
  - `normalizeSlug` / `validateSlug` behavior
  - `createTenant` slug uniqueness loop
  - `tenant.middleware` resolution priority and cross-tenant blocking
- Add a short migration if you want to remove `total_capacity` values from existing documents (see script example above).

**Files modified in this change-set**

- `src/controllers/tenant.controller.ts` (slug generation on create)
- `src/models/tenant.model.ts` (removed `total_capacity` field)
- `src/types/tenant.types.ts` (removed `total_capacity` from `ITenant`)
- `src/utils/subdomain.ts` (slug normalization / validation utilities)
- `src/middleware/tenant.middleware.ts` (tenant resolution using slug/subdomain)
- `src/utils/validation.schemas.ts` (removed capacity validation)
- `src/controllers/auth.controller.ts` (registration flow)
- `src/controllers/user.controller.ts` (onboarding)
- `src/controllers/operator.controller.ts` (operator config response)
- `src/routes/tenant.route.ts` (public slug lookup route)

**Next steps (pick one)**

- I can run the app locally in this workspace and perform the smoke tests.
- I can add unit tests for slug utilities and middleware.
- I can implement optional `slug` input validation and acceptance in registration flows.

---

If you want, I can now run the server and execute the quick verification steps for you. If you'd prefer tests or a migration script added to `scripts/`, tell me which and I will implement it next.
