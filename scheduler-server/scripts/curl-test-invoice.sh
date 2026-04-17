#!/usr/bin/env bash
# One-off POST matching scripts/seed-real-invoices-hysomer.mjs (headers + body shape).
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

ENDPOINT="${HYSOMER_ENDPOINT:-https://hysomer-ingestion-server.onrender.com/api/v1/invoices}"
KEY="${HYSOMER_INGESTION_KEY:?Set HYSOMER_INGESTION_KEY in .env}"
ORG="${HYSOMER_ORGANIZATION_ID:?Set HYSOMER_ORGANIZATION_ID in .env}"

INV_ID="REAL-KL-CURL-$(date +%s)"
ISO_NOW="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"

# One line item: subtotal 120, 12% GST -> totalTax 14.40, totalAmount 134.40
read -r -d '' BODY <<EOF || true
{
  "organizationId": "${ORG}",
  "externalInvoiceId": "${INV_ID}",
  "invoiceDate": "${ISO_NOW}",
  "totalAmount": 134.40,
  "customerId": null,
  "externalCustomerId": null,
  "subtotalAmount": 120.00,
  "discountAmount": 0,
  "totalTax": 14.40,
  "status": "PAID",
  "currency": "INR",
  "paymentMethod": "UPI",
  "invoiceUrl": null,
  "cashierName": "Akhil",
  "notes": "curl test invoice",
  "externalTerminalId": "KL-POS-01",
  "customer": {
    "customerId": "00000000-0000-4000-8000-000000000001",
    "externalCustomerId": null,
    "name": "Curl Test",
    "email": "curl-test@example.com",
    "phone": "+919876543210",
    "city": "Kochi",
    "state": "Kerala",
    "country": "India",
    "pincode": "682001",
    "address": "1 Test Road"
  },
  "items": [
    {
      "productName": "Milma Toned Milk 1L",
      "quantity": 2,
      "unitPrice": 60,
      "totalPrice": 134.40,
      "unit": "1 L",
      "externalProductId": "REAL-MILMATONEDMILK1L",
      "taxAmount": 14.40,
      "discountAmount": 0
    }
  ]
}
EOF

exec curl -sS -w "\n\nhttp_code:%{http_code}\n" -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "x-ingestion-key: ${KEY}" \
  -H "x-organization-id: ${ORG}" \
  -d "${BODY}"
