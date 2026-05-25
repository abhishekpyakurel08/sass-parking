# POS Parking App - User Guide

Complete guide for using the POS Parking App in daily operations.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Daily Operations](#daily-operations)
3. [Entry Process](#entry-process)
4. [Exit Process](#exit-process)
5. [Lost Ticket Handling](#lost-ticket-handling)
6. [Customer Management](#customer-management)
7. [Reports](#reports)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Time Setup

When you open the app for the first time:

1. **Enter Device ID**: Unique identifier for this device (e.g., "POS-001")
2. **Select Gate Number**: Physical gate location (e.g., "G1", "Entry-1")
3. **Choose Location Type**:
   - **Entry**: Only for vehicle entry
   - **Exit**: Only for vehicle exit
   - **Both**: Entry and exit operations
4. **Enter API Key**: Device authentication key (provided by admin)
5. **Tap "Validate & Continue"**

### Dashboard Overview

After setup, you'll see the **Dashboard** with:

#### Statistics Cards
- **Active**: Currently parked vehicles
- **Today**: Total entries today
- **Revenue**: Today's total collection

#### Menu Grid
Dynamic menu based on your location type:

| Location | Available Options |
|----------|-------------------|
| Entry | New Entry, Active Tickets, History, Settings |
| Exit | Process Exit, Lost Ticket, Active Tickets, History, Settings |
| Both | All options |

---

## Daily Operations

### Starting Your Shift

1. Open the app
2. Verify you're on Dashboard
3. Check current statistics
4. Ensure printer is connected (Settings)

### Ending Your Shift

1. Complete all pending exits
2. Check today's revenue in Dashboard
3. Logout from Settings (optional)

---

## Entry Process

### Standard Vehicle Entry

1. **Tap "New Entry"** on Dashboard
2. **Select Vehicle Type**:
   - Motorbike 🏍️
   - Car 🚗
   - SUV 🚙
   - Bus 🚌
   - Truck 🚛
3. **(Optional) Enter Vehicle Number** (license plate)
4. **(Optional) Add Notes**
5. **Tap "Generate Ticket"**
6. **Print Receipt** - Give to customer

The ticket contains:
- Ticket number
- Entry time
- QR code (for exit scanning)
- Vehicle type

### Regular Customer Entry (NFC)

1. **Tap "NFC Card"** on Dashboard
2. **Tap customer's NFC card** on device
3. Review customer information:
   - Name
   - Customer code
   - Status (must be Active)
   - Discount percentage
4. **Tap "Process Entry"**
5. Print ticket (with customer discount applied)

### Regular Customer Entry (QR Code)

1. **Tap "New Entry"**
2. **Tap "Scan Customer QR"**
3. Scan customer's QR code
4. Verify customer details
5. **Tap "Generate Ticket"**

---

## Exit Process

### Standard Exit (With Ticket)

1. **Tap "Process Exit"** on Dashboard
2. **Enter Ticket Number** or **Scan QR Code**
3. Review details:
   - Entry time
   - Exit time
   - Duration
   - Vehicle type
   - Amount breakdown:
     - Subtotal
     - Discount (if applicable)
     - **Total Amount**
4. **Tap "Proceed to Payment"**
5. **Select Payment Method**:
   - Cash 💵
   - Card 💳
   - eSewa 📱
   - Khalti 📱
   - IMEPay 📱
   - ConnectIPS 🏦
   - Wallet 👛
6. **Complete Payment**:
   - Cash: Enter amount received, app calculates change
   - Digital: Enter transaction reference (if available)
7. **Tap "Confirm Payment"**
8. **Print Receipt** - Give to customer

### Payment Methods

#### Cash Payment
1. Enter amount received from customer
2. App automatically calculates change
3. Tap "Confirm"
4. Give change and receipt to customer

#### Digital Payment (eSewa, Khalti, etc.)
1. Select payment method
2. Ask customer to complete payment on their device
3. Enter transaction ID (if available)
4. Tap "Confirm"
5. Print receipt

---

## Lost Ticket Handling

When a customer loses their ticket:

1. **Tap "Lost Ticket"** on Dashboard
2. **Select Vehicle Type**
3. **Enter Vehicle Number** (required for identification)
4. **Enter Assumed Duration** (hours parked)
   - Check CCTV or estimate based on customer's word
5. Review calculated amount:
   - Base amount (hourly rate × hours)
   - **Lost ticket penalty**
   - **Total**
6. **Select Payment Method**
7. **Tap "Process Payment"**
8. **Print Receipt**

> **Note**: Lost ticket penalty is set by admin in system settings.

---

## Customer Management

### Viewing Active Tickets

1. **Tap "Active Tickets"** on Dashboard
2. See list of all currently parked vehicles
3. Search by ticket number
4. Filter by vehicle type
5. Tap any ticket to see details

### Viewing Customer List

1. **Tap "Customers"** on Dashboard
2. Browse regular customers
3. Search by name or customer code
4. View customer details:
   - Contact info
   - Status (Active/Suspended/Expired)
   - Discount percentage
   - Visit history
   - Total savings

### Customer QR Regeneration

If customer's QR is damaged:
1. Find customer in list
2. Tap customer
3. Tap "Regenerate QR"
4. New QR code generated
5. Print new customer card

---

## Reports

### Daily Statistics

View real-time on Dashboard:
- Active vehicles
- Today's entries
- Today's revenue

### Detailed Reports

Access from **History** menu:

1. **Tap "History"**
2. View transaction list
3. Filter by:
   - Date range
   - Payment method
   - Status
4. View transaction details

### Pricing Information

1. **Tap "Settings"**
2. **Tap "Pricing Rules"**
3. View rates:
   - Base price per vehicle type
   - Hourly rates
   - Minimum charges
   - Maximum daily charges
   - Grace period (if any)

---

## Settings

### App Settings

Access by tapping **"Settings"** on Dashboard:

#### Device Information
- Device ID
- Gate number
- Location type
- Last seen

#### Printer Settings
- Connection type (Bluetooth/USB/WiFi/Serial)
- Printer model
- Test print

#### Receipt Settings
- Receipt header text
- Receipt footer text
- Show QR on tickets

#### Account
- Logout button

---

## Troubleshooting

### Common Issues

#### Cannot Create Entry
| Problem | Solution |
|---------|----------|
| "Network error" | Check internet connection |
| "Invalid vehicle type" | Select vehicle type from buttons |
| "Printer not connected" | Go to Settings → connect printer |

#### Cannot Process Exit
| Problem | Solution |
|---------|----------|
| "Ticket not found" | Check ticket number / Scan QR again |
| "Ticket already paid" | Check Active Tickets list |
| "Invalid QR code" | Clean camera lens / Enter manually |

#### Payment Issues
| Problem | Solution |
|---------|----------|
| "Payment failed" | Check internet, retry |
| "Printer error" | Check paper, reconnect printer |
| Wrong change | Verify cash received amount entered |

### NFC Card Not Reading
1. Ensure NFC is enabled on device
2. Hold card on back of device
3. Wait for beep/vibration
4. Try different card position
5. Check if card is active in system

### QR Code Not Scanning
1. Clean device camera lens
2. Ensure good lighting
3. Hold ticket steady
4. Move camera closer/further
5. Enter ticket number manually as backup

### Printer Issues
1. Check printer power
2. Check paper roll
3. Verify Bluetooth connection
4. Re-pair printer in Settings
5. Run test print from Settings

### App Freezes
1. Wait 10 seconds
2. Press device back button
3. If still frozen, restart app
4. Report to admin if persists

---

## Quick Reference

### Keyboard Shortcuts (if using external keyboard)

| Key | Action |
|-----|--------|
| Enter | Confirm/Submit |
| Esc | Go back/Cancel |
| F1 | Help |
| Ctrl + P | Print |

### Color Codes

| Color | Meaning |
|-------|---------|
| Green | Success, Active, Entry |
| Red | Error, Danger, Exit |
| Orange | Warning, Alert |
| Blue | Info, Secondary |

### Receipt Layout

**Entry Ticket:**
```
┌─────────────────────┐
│ Basundhara Shopping │
│      Center         │
├─────────────────────┤
│ TICKET #00123       │
│                     │
│ Entry: 24 Apr 2026  │
│        14:30:45     │
│                     │
│ Vehicle: Car        │
│                     │
│     [QR CODE]       │
│                     │
│ Keep this ticket!   │
└─────────────────────┘
```

**Exit Receipt:**
```
┌─────────────────────┐
│ Basundhara Shopping │
│      Center         │
├─────────────────────┤
│   PARKING RECEIPT   │
│                     │
│ Ticket: #00123      │
│ Vehicle: Car        │
│                     │
│ Entry: 14:30        │
│ Exit:  16:45        │
│ Duration: 2h 15m    │
├─────────────────────┤
│ Subtotal:   Rs. 50  │
│ Discount:   - Rs. 5 │
│ TOTAL:      Rs. 45 │
│                     │
│ Paid: Cash          │
│ Received: Rs. 50    │
│ Change:   Rs. 5     │
│                     │
│   Thank You!   │
└─────────────────────┘
```

---

## Support

For technical issues:
1. Contact system administrator
2. Check documentation in app menu
3. Report bugs with:
   - Device ID
   - Time of issue
   - Description of problem
   - Screenshots (if possible)

---

## Security Reminders

- **Never share** your device API key
- **Always logout** when leaving device unattended
- **Verify** customer identity for lost tickets
- **Count cash** carefully when giving change
- **Secure printed receipts** - they contain QR codes
