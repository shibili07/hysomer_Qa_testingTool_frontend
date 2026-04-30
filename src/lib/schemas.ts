import { z } from "zod";


export const CustomerSchema = z.object({
  customerId: z.string().uuid().optional(),
  externalCustomerId: z.string().min(1).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email must be valid").optional().nullable(),
  name: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  address: z.string().optional().nullable()
});

export type CustomerInput = z.infer<typeof CustomerSchema>;

export type CustomerRecord = CustomerInput & {
  id: string;
  createdAt?: number;
  updatedAt?: number;
};

export const InlineCustomerSchema = CustomerSchema.partial().optional().nullable();

export const InvoiceItemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  totalPrice: z.number().nonnegative("Total price must be non-negative"),
  unit: z.string().optional().nullable(),
  externalProductId: z.string().optional(),
  taxAmount: z.number().optional(),
  discountAmount: z.number().optional()
});

export const InvoiceSchema = z.object({
  externalInvoiceId: z.string().min(1, "External invoice ID is required"),
  invoiceDate: z.string().datetime("Invoice date must be ISO 8601 datetime"),
  totalAmount: z.number().nonnegative("Total amount must be non-negative"),
  customerId: z.string().uuid().optional().nullable(),
  externalCustomerId: z.string().optional().nullable(),
  subtotalAmount: z.number().optional().nullable(),
  discountAmount: z.number().optional().nullable(),
  totalTax: z.number().optional().nullable(),
  status: z.enum(["PAID", "PENDING", "CANCELLED", "REFUNDED"]).optional().default("PAID"),
  currency: z.enum(["INR"]).optional().default("INR"),
  paymentMethod: z
    .enum(["CASH", "CARD", "UPI", "NET_BANKING", "WALLET", "OTHER"])
    .optional()
    .nullable(),
  invoiceUrl: z.string().url().optional().nullable(),
  cashierName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  externalTerminalId: z.string().optional().nullable(),
  customer: InlineCustomerSchema,
  items: z.array(InvoiceItemSchema).max(50, "Maximum 50 items per invoice").optional().default([])
});

export type InvoiceInput = z.infer<typeof InvoiceSchema>;

export type InvoiceRecord = InvoiceInput & {
  id: string;
  createdAt?: number;
  updatedAt?: number;
};