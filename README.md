# POS Hysomer (Next.js + Firebase)

This project contains a simple POS setup with two pages:

1. Product page (`/products`) for listing, creating, editing, and deleting products in Firestore.
2. Billing page (`/invoice`) for creating invoices from products and saving them in Firestore.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Firestore collections

- `products`
- `invoices`

## Product fields

- `productName` (required)
- `unitPrice` (required, non-negative)
- `unit` (optional)
- `externalProductId` (auto-generated if empty)
- `taxAmount` (optional, defaults to `0`)
- `discountAmount` (optional, defaults to `0`)
# POS_HYSOMER
