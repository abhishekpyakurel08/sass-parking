# ParkSaaS Operator Mobile App — UI/UX Specification & AI Prompt

**Objective:** Build a robust, offline-capable mobile application (React Native / Expo / Flutter) for parking gate operators to manage vehicle check-ins, check-outs, and payments.

**Design System & Aesthetics:**

- **Primary Colors:** High contrast for outdoor visibility (e.g., Deep Navy background, Electric Blue/Neon Green accents).
- **Typography:** Large, readable, sans-serif fonts (Inter or Roboto).
- **Interactions:** Large touch targets (operators may wear gloves), haptic feedback on successful scans, and high-visibility error states.

---

## 📱 Core Screens & Flows

### 1. Login Screen

- **UI Elements:**
  - Email and Password input fields.
  - Large "Login" button.
  - Server connection status indicator.
- **API Integration:** `POST /api/v1/auth/login`
- **Behavior:** On success, store the JWT token and Tenant ID securely in local storage. Navigate to the Dashboard.

### 2. Operator Dashboard (Home)

- **UI Elements:**
  - **Header:** Current operator name and sync status indicator (🟢 Online | 🔴 Offline - 3 pending syncs).
  - **Quick Actions (Huge Buttons):**
    - `[ CHECK IN VEHICLE ]`
    - `[ SCAN TO CHECK OUT ]`
  - **Today's Stats (Cards):** Total Vehicles, Completed Sessions, Total Revenue.
- **API Integration:** `GET /api/v1/operator/stats`

### 3. Check-In (Entry Gate) Screen

- **UI Elements:**
  - **License Plate Input:** Large text field with an alphanumeric keyboard default.
  - **Vehicle Type Selector:** Toggle buttons for [🚗 Car] [🏍️ Bike] [🚐 Van].
  - **Customer Code (Optional):** Input for regular subscribers.
  - **"Generate Ticket" Button.**
- **API Integration:** `POST /api/v1/operator/check-in`
- **Behavior:**
  1. On success, show a full-screen **Success Modal** displaying the generated Base64 QR Code.
  2. Include a "Print Ticket" button (if connected to a Bluetooth thermal printer).

### 4. Check-Out (Exit Gate) Screen

- **UI Elements:**
  - **Camera Scanner:** Full-screen or half-screen view to scan the printed QR code.
  - **Manual Entry:** Fallback text input to type the License Plate or Ticket ID.
- **API Integration:** `POST /api/v1/operator/scan` (to retrieve info) -> `POST /api/v1/operator/check-out` (to calculate fare).
- **Behavior:** Once scanned, transition to the **Payment Modal**.

### 5. Payment Modal

- **UI Elements:**
  - **Receipt Summary:** Entry time, Exit time, Chargeable Duration, Grace period applied.
  - **Total Due:** Highlighted in huge text (e.g., "Rs. 150").
  - **Payment Methods:** Toggle between [💵 Cash] [💳 Card/UPI].
  - **Cash Calculator (If Cash selected):** "Amount Received" input, which auto-calculates "Change to Give".
  - **"Confirm & Open Gate" Button.**
- **API Integration:** `POST /api/v1/operator/process-payment`

### 6. Lost Ticket Flow

- **UI Elements:** Accessible via a small button on the Check-Out screen.
- **Inputs:** License Plate, assumed duration (hours).
- **Behavior:** Shows calculated penalty and base fare -> Proceeds to Payment Modal.
- **API Integration:** `POST /api/v1/operator/lost-ticket`

---

## 📡 Offline-First Architecture (Critical Requirement)

The app must be built with **Local-First architecture** (e.g., using WatermelonDB, SQLite, or MMKV).

**Offline Flow:**

1. If the device loses internet connection, the UI changes the header indicator to "Offline Mode".
2. When the operator hits "Generate Ticket" or "Confirm Payment", the app saves the exact payload (with current ISO timestamps) to a local SQLite queue.
3. The UI reacts instantly, showing success to the operator without waiting for the server.
4. **Background Sync:** Once the internet connection is restored, the app reads the queue and sends the array to `POST /api/v1/sync/batch`.
5. Upon successful 200 OK from the server, the local queue is cleared.
