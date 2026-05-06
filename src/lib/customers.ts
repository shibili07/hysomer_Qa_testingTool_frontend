import { CustomerInput, CustomerSchema } from "@/lib/schemas";
import { apiFetch } from "./api-client";
export type { CustomerInput };


export async function createCustomer(input: CustomerInput) {
  const validated = CustomerSchema.parse(input);
  const customerId = validated.customerId || crypto.randomUUID();

  const payload = {
    ...validated,
    customerId,
  };

  const res = await apiFetch("/api/customers/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create customer");
  }

  const data = await res.json();
  return data.customer;
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
export async function syncCustomerExternal(customer: CustomerInput, options: Record<string, unknown>) {
  const ingestionKey =
    typeof options.ingestionKey === "string" ? options.ingestionKey.trim() : "";
  const organizationId =
    typeof options.organizationId === "string" ? options.organizationId.trim() : "";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (ingestionKey) {
    headers["X-Ingestion-Key"] = ingestionKey;
  }
  if (organizationId) {
    headers["X-Organization-Id"] = organizationId;
  }

  const res = await fetch("/api/external-invoices", {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...options,
      customer,
      externalInvoiceId: `INV-${Date.now()}`,
      invoiceDate: new Date().toISOString(),
      status: (options.status as string) || "PAID",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "External synchronization failed");
  }

  return await res.json();
}