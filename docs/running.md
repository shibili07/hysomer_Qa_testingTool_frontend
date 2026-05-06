# Metal Modal – Ingestion Stress Testing Tool

## Overview

**Metal Modal** is a durability testing tool built into the Hysomer QA Console. It simulates real supermarket data injection by posting realistic invoices to the Hysomer ingestion server at a rate of **1 invoice per minute per connected supermarket**.

This effectively stress-tests the ingestion pipeline the same way real supermarkets would during a production day (1,440 invoices/day per store).

---

## Architecture

### Data Flow

```
┌─────────────────────┐     1 inv/min      ┌──────────────────────────────┐
│  QA Console (React)  │ ─────────────────→ │  Hysomer Ingestion Server    │
│  Metal Modal Page    │    POST /api/v1/   │  (production endpoint)       │
│                      │    invoices        │                              │
└─────────────────────┘                    └──────────────────────────────┘
```

### Ingestion Endpoint

```
POST https://hysomer-ingestion-server.onrender.com/api/v1/invoices
```

**Headers:**
- `x-ingestion-key`: Supermarket's API key
- `x-organization-id`: Organization ID
- `Content-Type`: application/json

---

## Files Added / Modified

### New Files

| File | Purpose |
|------|---------|
| `src/lib/invoice-generator.ts` | Kerala product catalog, basket patterns, customer generation, and invoice payload builder. Ported from `scheduler-server/scripts/invoice-seed-hysomer-shared.mjs`. |
| `src/lib/metal-modal-store.ts` | State management for connections, injection intervals, and log persistence. Uses in-memory state + localStorage for log durability. |
| `src/pages/MetalModalPage.tsx` | Main "Running" page – displays all supermarkets as interactive cards with real-time status and 3-dot action menus. |
| `src/pages/MetalModalDetailPage.tsx` | Per-supermarket detail page with Sentry-style real-time invoice stream, expandable log entries, countdown timer, and full invoice breakdowns. |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Added routes: `/metal-modal` and `/metal-modal/:id` |
| `src/components/sidebar.tsx` | Added "Running" nav item with Zap icon; improved `isActive` detection for sub-routes |
| `src/globals.css` | Added animations: `pulse-once` (new log highlight), `slide-in-from-top-1`, `zoom-in-95` (dropdown) |

---

## Features

### Running Page (`/metal-modal`)
- **Global stats dashboard** – Total markets, connected count, invoices sent, failures
- **Supermarket cards** – Live status indicator (pulsing green dot), sent/failed counts, status badge
- **3-dot action menu** per card:
  - **Connect** – Start injecting 1 invoice/minute
  - **Disconnect** – Stop and reset connection
  - **Pause** – Temporarily halt injection
  - **Resume** – Continue from paused state
  - **Delete Data** – Clear all logs and reset counters
- Click any card → navigates to detail page

### Detail Page (`/metal-modal/:id`)
- **Sentry-inspired invoice stream** – Real-time log of all injected invoices
- **Expandable log entries** – Click any row to see:
  - Customer details (name, email, city, phone)
  - Full line-item table with quantities, prices, and totals
  - Subtotal, tax, and discount breakdown
  - Error messages for failed requests
- **Countdown timer** – Shows seconds until next invoice injection
- **Status controls** – Connect, Pause, Resume, Disconnect, Clear Logs
- **Stats strip** – Total logs, success, failed, pending counts

### Invoice Generation
- Uses the same Kerala product catalog as the scheduler server
- 7 realistic basket patterns (breakfast run, monthly staples, curry prep, etc.)
- Weighted payment method distribution (UPI 42%, Cash 28%, Card 20%, etc.)
- Randomly generated customers with Kerala names, cities, and addresses
- GST-aware tax calculation per product category

---

## How It Works

1. **Connect** a supermarket → immediately generates and POSTs one invoice
2. A `setInterval(60000)` timer fires every 60 seconds to generate another
3. Each invoice is built with random products, customers, and payment methods
4. The POST result (success/fail) is logged and displayed in real-time
5. Logs are persisted to `localStorage` (last 200 per supermarket) for page refresh durability
6. All state is managed client-side – no backend changes required

---

## Configuration

The tool uses the supermarket credentials already registered in the **Supermarkets** page:
- `organization_id` → sent as `x-organization-id` header
- `api_key` → sent as `x-ingestion-key` header

No additional configuration is needed.
