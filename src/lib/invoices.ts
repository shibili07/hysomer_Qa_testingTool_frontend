import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CustomerInput,
  InvoiceInput,
  InvoiceItemSchema,
  InvoiceSchema
} from "@/lib/schemas";

// Local type for product data needed for invoice calculations
type ProductRecord = {
  id: string;
  _id?: string;
  productName: string;
  price: number;
  taxAmount?: number;
  discountAmount?: number;
  productId?: string;
};

type CartItem = {
  productId: string;
  quantity: number;
};

type CreateInvoiceInput = {
  customer: CustomerInput | null;
  products: ProductRecord[];
  cart: CartItem[];
  status?: "PAID" | "PENDING" | "CANCELLED" | "REFUNDED";
  paymentMethod?: "CASH" | "CARD" | "UPI" | "NET_BANKING" | "WALLET" | "OTHER" | null;
  cashierName?: string | null;
  notes?: string | null;
  externalTerminalId?: string | null;
  ingestionKey?: string | null;
};

export async function createInvoice(input: CreateInvoiceInput) {
  const ingestionKey = input.ingestionKey?.trim() || undefined;
  const items = input.cart
    .map((line) => {
      const p = input.products.find((x) => x.id === line.productId);
      if (!p) return null;

      const lineSubtotal = p.price * line.quantity;
      const lineTax = (p.taxAmount ?? 0) * line.quantity;
      const lineDiscount = (p.discountAmount ?? 0) * line.quantity;
      const totalPrice = lineSubtotal + lineTax - lineDiscount;

      return InvoiceItemSchema.parse({
        productName: p.productName,
        quantity: line.quantity,
        unitPrice: p.price,
        totalPrice,
        unit: null,
        externalProductId: p.productId,
        taxAmount: lineTax,
        discountAmount: lineDiscount
      });
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (!items.length) {
    throw new Error("Add at least one item.");
  }

  const subtotalAmount = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const totalTax = items.reduce((acc, i) => acc + (i.taxAmount ?? 0), 0);
  const discountAmount = items.reduce((acc, i) => acc + (i.discountAmount ?? 0), 0);
  const totalAmount = subtotalAmount + totalTax - discountAmount;

  const basePayload: InvoiceInput = InvoiceSchema.parse({
    externalInvoiceId: `INV-${Date.now()}`,
    invoiceDate: new Date().toISOString(),
    totalAmount,
    customerId: input.customer?.customerId ?? null,
    externalCustomerId: input.customer?.externalCustomerId ?? null,
    subtotalAmount,
    discountAmount,
    totalTax,
    status: input.status ?? "PAID",
    currency: "INR",
    paymentMethod: input.paymentMethod ?? null,
    cashierName: input.cashierName ?? null,
    notes: input.notes ?? null,
    externalTerminalId: input.externalTerminalId ?? null,
    customer: input.customer
      ? {
          customerId: input.customer.customerId,
          externalCustomerId: input.customer.externalCustomerId ?? null,
          phone: input.customer.phone,
          email: input.customer.email ?? null,
          name: input.customer.name,
          city: input.customer.city ?? null,
          state: input.customer.state ?? null,
          country: input.customer.country ?? null,
          pincode: input.customer.pincode ?? null,
          address: input.customer.address ?? null
        }
      : null,
    items
  });

  const extRes = await fetch("/api/external-invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ingestionKey ? { "X-Ingestion-Key": ingestionKey } : {})
    },
    body: JSON.stringify(basePayload)
  });

  if (!extRes.ok) {
    const text = await extRes.text();
    throw new Error(text || "Failed to sync invoice to external API");
  }

  const extData = (await extRes.json()) as {
    externalInvoiceId?: string;
    externalCustomerId?: string;
    invoiceUrl?: string;
  };

  const finalPayload: InvoiceInput = {
    ...basePayload,
    externalInvoiceId: extData.externalInvoiceId || basePayload.externalInvoiceId,
    externalCustomerId: extData.externalCustomerId || basePayload.externalCustomerId,
    invoiceUrl: extData.invoiceUrl || basePayload.invoiceUrl || null
  };

  await addDoc(collection(db, "invoices"), {
    ...finalPayload,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  return finalPayload;
}