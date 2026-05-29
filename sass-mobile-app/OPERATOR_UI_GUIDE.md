# ParkSaaS Mobile — Operator UI Implementation Guide

**Role:** `GATE_STAFF` | **App:** React Native | **State:** Zustand (`parkingStore`) | **Base API:** `/api/v1`

---

## 1. App Navigation Structure

The bottom tab layout adapts automatically based on the logged-in operator's `gate_assignment`:

```
gate_assignment = "ENTRY"   →  [Entry Gate] [History]
gate_assignment = "EXIT"    →  [Exit Gate]  [History]
gate_assignment = "BOTH"    →  [Overview] [Entry] [Exit] [Scanner] [History]
gate_assignment = null/BOTH →  [Overview] [Entry] [Exit] [Scanner] [History]
```

**Screen → File mapping:**

| Screen           | File                     | Route Name       |
|------------------|--------------------------|------------------|
| Login            | `LoginScreen.tsx`        | `Login`          |
| Dashboard        | `DashboardScreen.tsx`    | `Dashboard`      |
| Entry Gate       | `EntryScreen.tsx`        | `Entry`/`EntryTab` |
| Exit Gate        | `ExitScreen.tsx`         | `Exit`/`ExitTab` |
| QR Scanner       | `PaymentScreen.tsx`      | `Scanner`        |
| Ticket Detail    | `TicketDetailScreen.tsx` | `TicketDetail`   |
| History          | `HistoryScreen.tsx`      | `History`        |

---

## 2. Authentication Flow

**Screen:** `LoginScreen.tsx` → **Store:** `authStore.ts` → **Service:** `auth.service.ts`

### Login UI Elements

```
┌─────────────────────────────────┐
│          ParkSaaS Pro           │
│         Operator Login          │
│                                 │
│  Email: [___________________]   │
│  Password: [________________]   │
│                                 │
│       [  Login  ]               │
└─────────────────────────────────┘
```

### API Call
```
POST /api/v1/auth/login
Body: { "email": "...", "password": "..." }
```

### On Success — store in `authStore`:
```ts
{
  user: {
    id, name, email, role,
    tenant_id, gate_assignment, ticket_prefix
  },
  token: "eyJhbGci..."   // saved to AsyncStorage
}
```

After login, `AppNavigator` reads `gate_assignment` and renders the correct tab set.

### Token Refresh
```
POST /api/v1/auth/refresh
```
The `api.client.ts` interceptor calls this automatically on 401. The refresh token is stored as an `HttpOnly` cookie on the server side.

---

## 3. Dashboard Screen

**File:** `DashboardScreen.tsx` | **Tab:** Overview (BOTH only)

### UI Layout

```
┌─────────────────────────────────┐
│  Good morning, Raju   [Sync 🔄] │
│  [⚠ 3 offline ops pending]      │
│─────────────────────────────────│
│  TODAY'S STATS                  │
│  ┌──────────┐ ┌───────────────┐ │
│  │ 45       │ │ Rs. 5,400     │ │
│  │ Vehicles │ │ Revenue       │ │
│  └──────────┘ └───────────────┘ │
│  ┌──────────┐                   │
│  │ 38       │                   │
│  │ Completed│                   │
│  └──────────┘                   │
│─────────────────────────────────│
│  RECENT TICKETS                 │
│  BA1CHA4567  CAR  ACTIVE   →    │
│  BA2KHA1234  BIKE PAID     →    │
└─────────────────────────────────┘
```

### API Calls
```
GET /api/v1/operator/stats      → totalVehicles, completedSessions, totalRevenue
GET /api/v1/parking/tickets?limit=10  → recentTickets[]
```

### Store Action
```ts
useParkingStore.getState().fetchDashboard()
// Calls both endpoints in parallel, then auto-triggers syncOfflineQueue()
```

### Offline Badge
When `offlineQueueCount > 0`, show a warning banner. Tapping "Sync" calls:
```ts
useParkingStore.getState().syncOfflineQueue()
// POST /api/v1/sync/batch  { operations: [...] }
```

---

## 4. Entry Gate — Vehicle Check-In

**File:** `EntryScreen.tsx` | **Store action:** `checkIn()`

### UI Layout

```
┌─────────────────────────────────┐
│  🟢 ENTRY GATE                  │
│─────────────────────────────────│
│  Vehicle Type:                  │
│  [CAR] [BIKE] [TRUCK] [BUS]     │
│                                 │
│  License Plate: (optional)      │
│  [BA 1 CHA 4567__________]      │
│                                 │
│  Customer Code: (optional)      │
│  [REG-0042_______________]      │
│                                 │
│       [ CHECK IN VEHICLE ]      │
└─────────────────────────────────┘
```

**After success → show ticket confirmation:**
```
┌─────────────────────────────────┐
│  ✅ Check-In Successful          │
│                                 │
│  Ticket: GTE1-xxxx...           │
│  Plate:  BA1CHA4567             │
│  Type:   CAR                    │
│  Time:   10:30 AM               │
│                                 │
│  [QR Code Image]                │
│                                 │
│  [ 🖨 Print Receipt ]           │
│  [ New Check-In ]               │
└─────────────────────────────────┘
```

### API Call
```
POST /api/v1/operator/check-in
Headers: Authorization: Bearer <token>
Body:
{
  "vehicle_type": "CAR",
  "license_plate": "BA1CHA4567",   // optional
  "customer_code": "REG-0042"      // optional
}
```

### Response fields used by UI
| Field | UI Usage |
|-------|----------|
| `ticket.ticket_number` | Display & QR label |
| `ticket.qr_code_url` | Render QR image |
| `receipt.printable_text` | Send to thermal printer |
| `ticket.customer_name` | Show discount badge if present |

### Offline Behaviour
If network is unavailable, `checkIn()` in `parkingStore.ts` catches the network error, calls `enqueue('CHECK_IN', data)`, and returns a mock success with `isOffline: true`. Show an amber "⚠ Offline" badge on the ticket card.

### Validation Rules (client-side)
- `vehicle_type` is **required** (select one of the type buttons first)
- `license_plate` is auto-uppercased before sending
- Either `license_plate` or `customer_code` should be provided (or a guest plate is auto-generated)

### Error Handling
| Error | UI Message |
|-------|------------|
| `409` | "This vehicle already has an active ticket" |
| `404` | "Customer code not found" |
| `400` | "Customer account is inactive" |
| `403` | "You are not authorized for check-in at this gate" |

---

## 5. Exit Gate — Scan, Check-Out & Payment

The exit flow is a **3-step wizard** managed by `ExitScreen.tsx` and `PaymentScreen.tsx`.

```
Step 1: Scan Ticket  →  Step 2: Review Fare  →  Step 3: Process Payment
```

---

### Step 1 — Scan Ticket

**File:** `ExitScreen.tsx` | **Store action:** `scanTicket(code)`

```
┌─────────────────────────────────┐
│  🔴 EXIT GATE                   │
│─────────────────────────────────│
│  [ 📷 Scan QR Code ]            │
│                                 │
│  — or enter manually —          │
│  [Ticket No / Plate_________]   │
│                                 │
│       [ LOOKUP TICKET ]         │
└─────────────────────────────────┘
```

**API Call:**
```
POST /api/v1/operator/scan
Body: { "code": "GTE1-xxxx..." }
```

The `code` field accepts:
- Full ticket number (from QR scan)
- Partial ticket number
- License plate (auto-uppercased)

**On success** → `scannedTicket` is populated in store → move to Step 2.

---

### Step 2 — Review Fare & Check-Out

After scan, show the ticket summary and trigger check-out.

```
┌─────────────────────────────────┐
│  Ticket Found ✅                │
│  BA1CHA4567 — CAR               │
│  In: 10:30 AM  |  Now: 1:15 PM  │
│─────────────────────────────────│
│  [ CALCULATE FARE ]             │
│─────────────────────────────────│
│  Duration:   2h 45m             │
│  Rate:       Rs. 50/hr          │
│  Subtotal:   Rs. 150            │
│  Discount:   -Rs. 15  (10%)     │
│  ─────────────────────          │
│  TOTAL DUE:  Rs. 135            │
│─────────────────────────────────│
│  [ PROCEED TO PAYMENT ]         │
└─────────────────────────────────┘
```

**API Call:**
```
POST /api/v1/operator/check-out
Body: { "ticket_id": "664b2f..." }
```

**Response fields shown in UI:**
| Field | UI Label |
|-------|----------|
| `duration_minutes` | Duration display |
| `rate_per_hour` | Rate/hr |
| `subtotal` | Subtotal row |
| `discount` | Discount row (hidden if 0) |
| `total_amount` | **TOTAL DUE** (highlighted) |

**Fare Calculation Logic (for display):**
```
Grace period deducted → remaining minutes rounded UP to hours → × rate
Customer discount applied on top
```

---

### Step 3 — Process Payment

**File:** `PaymentScreen.tsx` | **Store action:** `processPayment()`

```
┌─────────────────────────────────┐
│  TOTAL DUE: Rs. 135             │
│─────────────────────────────────│
│  Payment Method:                │
│  [CASH] [eSewa] [Khalti]        │
│  [FonePay] [Bank Transfer]      │
│                                 │
│  ── CASH ──                     │
│  Amount Received:               │
│  [200_____________________]     │
│  Change: Rs. 65                 │
│                                 │
│  ── DIGITAL ──                  │
│  Transaction Ref:               │
│  [TXN-ABC123______________]     │
│                                 │
│       [ CONFIRM PAYMENT ]       │
└─────────────────────────────────┘
```

**API Call:**
```
POST /api/v1/operator/process-payment
Body:
{
  "ticket_id": "664b2f...",
  "payment_method": "CASH",
  "amount_received": 200,
  "transaction_reference": null   // for digital payments
}
```

**Payment Methods:**
| Value | Show Field |
|-------|-----------|
| `CASH` | `amount_received` input + change display |
| `ESEWA` / `KHALTI` / `FONEPAY` / `BANK_TRANSFER` | `transaction_reference` input |

**On success → show receipt:**
```
┌─────────────────────┐
│   PARKING RECEIPT   │
│ Ticket: #GTE1XXXX   │
│ Vehicle: CAR        │
│ Entry: 10:30        │
│ Exit:  13:15        │
│ Duration: 2h 45m    │
├─────────────────────┤
│ Subtotal:  Rs.  150 │
│ Discount:  - Rs. 15 │
│ TOTAL:     Rs.  135 │
│ Paid: CASH          │
│ Received: Rs.  200  │
│ Change:   Rs.   65  │
│    Thank You!       │
└─────────────────────┘

[ 🖨 Print ]   [ New Session ]
```

**Offline Behaviour:** If network fails during payment, the operation is enqueued via `enqueue('PAYMENT', data)` and a local receipt is shown with an `isOffline: true` badge.

---

## 6. Lost Ticket Handling

**Accessible from:** Exit Gate screen → "Lost Ticket" button

```
┌─────────────────────────────────┐
│  ⚠ LOST TICKET                 │
│─────────────────────────────────│
│  Vehicle Type:                  │
│  [CAR] [BIKE] [TRUCK]           │
│                                 │
│  License Plate:                 │
│  [BA 2 KHA 1234_________]       │
│                                 │
│  Assumed Duration (hours):      │
│  [4_______________________]     │
│                                 │
│       [ CALCULATE PENALTY ]     │
└─────────────────────────────────┘
```

**API Call:**
```
POST /api/v1/parking/lost-ticket
Body:
{
  "vehicle_type": "CAR",
  "license_plate": "BA2KHA1234",
  "assumed_duration_hours": 4
}
```

**Response shown in UI:**
```
Base Amount:   Rs. 200  (4h × Rs. 50)
Lost Penalty:  + Rs. 100
──────────────────────────
TOTAL DUE:     Rs. 300
```

Tapping **Proceed** passes the `ticket_id` to the `PaymentScreen` — same flow as standard checkout.

---

## 7. History Screen

**File:** `HistoryScreen.tsx`

```
┌─────────────────────────────────┐
│  TICKET HISTORY     [Filter ▼]  │
│─────────────────────────────────│
│  🟢 BA1CHA4567  CAR  ACTIVE     │
│     In: 10:30 AM                │
│─────────────────────────────────│
│  ✅ BA2KHA1234  BIKE  PAID      │
│     In: 9:00 → Out: 11:30       │
│     Rs. 100  |  CASH            │
└─────────────────────────────────┘
```

**API Call:**
```
GET /api/v1/parking/tickets?status=ACTIVE&page=1&limit=20
```

Filter options: `ALL`, `ACTIVE`, `PENDING_PAYMENT`, `PAID`

Tapping a row navigates to `TicketDetailScreen` with `ticket_id` param.

---

## 8. Ticket Detail Screen

**File:** `TicketDetailScreen.tsx`

Shows full ticket info + receipt reprint option.

**API Call:**
```
GET /api/v1/parking/:id/receipt
```

Receipt type is auto-detected by the backend:
- `ACTIVE` / `PENDING_PAYMENT` → entry-style receipt
- `PAID` → full payment receipt

---

## 9. Offline Sync

**Service:** `offlineQueue.ts` | **Store action:** `syncOfflineQueue()`

### How It Works

```
[Online]  → API called normally → success
[Offline] → operation enqueued to AsyncStorage (@parksaas:offline_queue)
[Back Online] → fetchDashboard() triggers syncOfflineQueue() automatically
```

### Offline Queue Data Structure
```ts
interface OfflineOperation {
  id: string;          // local UUID for dedup
  type: 'CHECK_IN' | 'CHECK_OUT' | 'PAYMENT';
  data: Record<string, any>;
  queued_at: string;   // ISO timestamp
  retry_count: number;
}
```

### Sync API Call
```
POST /api/v1/sync/batch
Body:
{
  "operations": [
    {
      "type": "CHECK_IN",
      "data": { "ticket_number": "...", "license_plate": "...", "vehicle_type": "CAR", "check_in_time": "..." }
    },
    {
      "type": "PAYMENT",
      "data": { "ticket_number": "...", "payment_method": "CASH", "amount_received": 200, "change_given": 65 }
    }
  ]
}
```

### Response Handling
```ts
// res.results = { successful: 2, failed: 0, errors: [] }
// On success: remove all synced ops from AsyncStorage queue
await removeFromQueue(q.map(op => op.id));
```

If `failed > 0`, show individual error messages from `results.errors[]`.

---

## 10. State Management Reference

All parking state lives in `useParkingStore` (Zustand):

| State Key | Type | Description |
|-----------|------|-------------|
| `stats` | `DailyStats` | Today's dashboard totals |
| `recentTickets` | `Ticket[]` | Last 10 tickets |
| `lastCheckIn` | `CheckInResult` | Last successful check-in |
| `lastCheckInReceiptText` | `string` | Printable check-in receipt |
| `scannedTicket` | `ScanResult` | Current scanned ticket |
| `checkoutSummary` | `CheckOutSummary` | Fare calculation result |
| `paymentReceipt` | `PaymentReceipt` | Completed payment info |
| `offlineQueueCount` | `number` | Pending offline ops count |
| `isSyncing` | `boolean` | Sync in progress flag |
| `isLoading` | `boolean` | Any API in flight |
| `error` | `string\|null` | Last error message |

**Key actions:**
```ts
fetchDashboard()           // GET stats + tickets + auto-sync
checkIn(plate, type, code) // POST check-in (offline-aware)
scanTicket(code)           // POST scan
checkOut(ticket_id)        // POST check-out
lostTicket(type, plate, h) // POST lost-ticket
processPayment(id, method) // POST payment (offline-aware)
syncOfflineQueue()         // POST sync/batch
clearError()               // Reset error state
```

---

## 11. Common Error Display Pattern

All screens should watch `error` from the store and show a dismissible banner:

```
┌─────────────────────────────────┐
│ ⚠ This vehicle already has an  │
│   active parking ticket.    [×] │
└─────────────────────────────────┘
```

```ts
const { error, clearError } = useParkingStore();

useEffect(() => {
  if (error) {
    // Show error banner, auto-dismiss after 4s
    const t = setTimeout(clearError, 4000);
    return () => clearTimeout(t);
  }
}, [error]);
```

---

## 12. Quick Reference — API to Screen Mapping

| Screen | Action | API Endpoint |
|--------|--------|-------------|
| LoginScreen | Login | `POST /auth/login` |
| LoginScreen | Token refresh | `POST /auth/refresh` |
| DashboardScreen | Load stats | `GET /operator/stats` |
| DashboardScreen | Load tickets | `GET /parking/tickets` |
| DashboardScreen | Sync offline | `POST /sync/batch` |
| EntryScreen | Check in | `POST /operator/check-in` |
| ExitScreen | Scan QR/plate | `POST /operator/scan` |
| ExitScreen | Calculate fare | `POST /operator/check-out` |
| ExitScreen | Lost ticket | `POST /parking/lost-ticket` |
| PaymentScreen | Pay | `POST /operator/process-payment` |
| HistoryScreen | List tickets | `GET /parking/tickets` |
| TicketDetailScreen | Get receipt | `GET /parking/:id/receipt` |

---

*ParkSaaS Mobile — Role: `GATE_STAFF` | Multi-tenant: Yes | Offline-first: Yes*
