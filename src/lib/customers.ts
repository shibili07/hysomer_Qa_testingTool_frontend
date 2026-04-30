import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CustomerInput, CustomerSchema } from "@/lib/schemas";
export type { CustomerInput };

export async function createCustomer(input: CustomerInput) {
  const validated = CustomerSchema.parse(input);
  const customerId = validated.customerId || crypto.randomUUID();

  const payload = {
    ...validated,
    customerId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await addDoc(collection(db, "customers"), payload);
  return payload;
}

/**
 * Legacy sync for existing customers
 */
export async function syncCustomer(customerId: string, options: any) {
  const res = await fetch("/api/external-invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...options,
      customerId,
      externalInvoiceId: `SYNC-${Date.now()}`,
      invoiceDate: new Date().toISOString(),
      status: "PENDING",
    }),
  });

  if (!res.ok) {
    throw new Error("External sync failed");
  }

  return await res.json();
}

/**
 * Modern sync used by the Billing module (invoice/page.tsx)
 * Handles full customer and invoice synchronization with the injection server.
 */
export async function syncCustomerExternal(customer: CustomerInput, options: any) {
  const res = await fetch("/api/external-invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.ingestionKey ? { "X-Ingestion-Key": options.ingestionKey } : {})
    },
    body: JSON.stringify({
      ...options,
      customer,
      externalInvoiceId: `INV-${Date.now()}`,
      invoiceDate: new Date().toISOString(),
      status: options.status || "PAID",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "External synchronization failed");
  }

  return await res.json();
}