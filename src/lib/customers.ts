import { CustomerInput, CustomerSchema } from "@/lib/schemas";

type ExternalSyncItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string | null;
  externalProductId?: string;
  taxAmount?: number;
  discountAmount?: number;
};

type PaymentMethod = "CASH" | "CARD" | "UPI" | "NET_BANKING" | "WALLET" | "OTHER";

type SyncCustomerExternalOptions = {
  items?: ExternalSyncItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  totalTax?: number;
  totalAmount?: number;
  ingestionKey?: string;
  paymentMethod?: PaymentMethod | null;
};

export type SyncedCustomerResult = {
  customer: CustomerInput;
  forceRefresh: boolean;
  successMessage: string | null;
};

type SyncApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    status?: string;
    externalCustomerId?: string;
  };
};

const getExternalCustomerId = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;

  const data = payload as {
    externalCustomerId?: string;
    body?: { externalCustomerId?: string };
    data?: { externalCustomerId?: string };
  };

  return data.externalCustomerId ?? data.body?.externalCustomerId ?? data.data?.externalCustomerId ?? null;
};

const normalizeCustomer = (input: CustomerInput): CustomerInput => {
  const validated = CustomerSchema.parse(input);
  return {
    ...validated,
    customerId: validated.customerId || crypto.randomUUID(),
    phone: validated.phone?.trim() || "",
    name: validated.name?.trim() || "Guest",
    email: validated.email?.trim() || null,
    city: validated.city?.trim() || null,
    state: validated.state?.trim() || null,
    country: validated.country?.trim() || null,
    pincode: validated.pincode?.trim() || null,
    address: validated.address?.trim() || null
  };
};

export const syncCustomerExternal = async (
  input: CustomerInput,
  options?: SyncCustomerExternalOptions
): Promise<SyncedCustomerResult> => {
  const customer = normalizeCustomer(input);
  const items = options?.items ?? [];
  const subtotalAmount = options?.subtotalAmount ?? 0;
  const discountAmount = options?.discountAmount ?? 0;
  const totalTax = options?.totalTax ?? 0;
  const totalAmount = options?.totalAmount ?? subtotalAmount + totalTax - discountAmount;
  const ingestionKey = options?.ingestionKey?.trim() || undefined;
  const paymentMethod = options?.paymentMethod ?? null;

  const invoiceLikePayload = {
    externalInvoiceId: `CUST-SYNC-${Date.now()}`,
    invoiceDate: new Date().toISOString(),
    totalAmount,
    subtotalAmount,
    discountAmount,
    totalTax,
    status: "PENDING" as const,
    currency: "INR" as const,
    paymentMethod,
    externalCustomerId: null,
    customer: {
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? null,
      city: customer.city ?? null,
      state: customer.state ?? null,
      country: customer.country ?? null,
      pincode: customer.pincode ?? null,
      address: customer.address ?? null
    },
    items
  };

  const res = await fetch("/api/external-invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ingestionKey ? { "X-Ingestion-Key": ingestionKey } : {})
    },
    body: JSON.stringify(invoiceLikePayload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "External customer sync failed");
  }

  const payload = (await res.json()) as unknown;
  const parsedResponse = payload as SyncApiResponse;
  const externalCustomerId = getExternalCustomerId(payload);
  const isInvoiceQueued =
    parsedResponse?.success === true &&
    parsedResponse?.message === "Invoice queued for processing" &&
    parsedResponse?.data?.status === "QUEUED";

  if (!externalCustomerId && !isInvoiceQueued) {
    throw new Error("External customer ID not returned by API");
  }

  return {
    customer: {
      ...customer,
      externalCustomerId: externalCustomerId ?? null
    },
    forceRefresh: isInvoiceQueued,
    successMessage: isInvoiceQueued ? "Invoice queued for processing." : null
  };
};
