
import { useEffect, useMemo, useState } from "react";
import { syncCustomerExternal } from "@/lib/customers";
import { createInvoice } from "@/lib/invoices";
import { listProducts } from "@/lib/products";
import { listSupermarkets, type Supermarket } from "@/lib/supermarkets";
import { CustomerSchema } from "@/lib/schemas";
import { toast } from "sonner";
import { Building2, CreditCard, Plus, Receipt, ShoppingCart, Trash2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

// Local type for product data from backend (Decoupled from shared lib)
type ProductRecord = {
  id: string;
  _id?: string;
  productName: string;
  price: number;
  productId?: string;
  taxAmount?: number;
  discountAmount?: number;
  stock?: number;
};

type CartItem = {
  productId: string;
  quantity: number;
};

const format = (n: number) => n.toFixed(2);

function supermarketKey(s: Supermarket): string {
  return String(s.id || s._id || "");
}

function productRowId(p: ProductRecord): string {
  return String(p.id ?? p._id ?? "").trim();
}

export default function InvoicePage() {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [selectedSupermarketId, setSelectedSupermarketId] = useState("");
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [status, setStatus] = useState<"PAID" | "PENDING" | "CANCELLED" | "REFUNDED">("PAID");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "UPI" | "NET_BANKING" | "WALLET" | "OTHER" | ""
  >("CASH");
  const [cashierName, setCashierName] = useState("hysomer");
  const [notes, setNotes] = useState("");
  /** Used when no supermarket is registered, or to override the selected supermarket's key. */
  const [manualOrganizationId, setManualOrganizationId] = useState("");
  const [manualApiKey, setManualApiKey] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedSupermarket = useMemo(
    () => supermarkets.find((s) => supermarketKey(s) === selectedSupermarketId),
    [supermarkets, selectedSupermarketId]
  );

  const effectiveOrganizationId =
    selectedSupermarket?.organization_id?.trim() || manualOrganizationId.trim();
  const effectiveApiKey = selectedSupermarket?.api_key?.trim() || manualApiKey.trim();

  const refreshBaseData = async () => {
    const [productData, smData] = await Promise.all([listProducts(), listSupermarkets()]);
    setProducts(productData);
    setSupermarkets(smData);
    if (smData.length === 1) {
      setSelectedSupermarketId(supermarketKey(smData[0]));
    }
  };

  useEffect(() => {
    setLoading(true);
    refreshBaseData()
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load products.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!products.length) {
      setSelectedProductId("");
      return;
    }
    setSelectedProductId((prev) => {
      if (prev && products.some((p) => productRowId(p) === prev)) {
        return prev;
      }
      return productRowId(products[0]);
    });
  }, [products]);

  const itemRows = useMemo(() => {
    return cart
      .map((item) => {
        const p = products.find((x) => productRowId(x) === item.productId);
        if (!p) return null;

        const lineSubtotal = p.price * item.quantity;
        const lineTax = (p.taxAmount ?? 0) * item.quantity;
        const lineDiscount = (p.discountAmount ?? 0) * item.quantity;
        const lineTotal = lineSubtotal + lineTax - lineDiscount;

        return {
          product: p,
          quantity: item.quantity,
          lineSubtotal,
          lineTax,
          lineDiscount,
          lineTotal
        };
      })
      .filter(Boolean) as Array<{
        product: ProductRecord;
        quantity: number;
        lineSubtotal: number;
        lineTax: number;
        lineDiscount: number;
        lineTotal: number;
      }>;
  }, [cart, products]);

  const totals = useMemo(() => {
    return itemRows.reduce(
      (acc, row) => {
        acc.subtotal += row.lineSubtotal;
        acc.taxTotal += row.lineTax;
        acc.discountTotal += row.lineDiscount;
        acc.grandTotal += row.lineTotal;
        return acc;
      },
      { subtotal: 0, taxTotal: 0, discountTotal: 0, grandTotal: 0 }
    );
  }, [itemRows]);

  const addProductToBill = () => {
    const id = selectedProductId.trim();
    if (!id || !products.some((p) => productRowId(p) === id)) {
      toast.error("Select a product to add.");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((x) => x.productId === id);
      if (existing) {
        return prev.map((x) => (x.productId === id ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [...prev, { productId: id, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, quantity: number) => {
    if (Number.isNaN(quantity) || quantity < 1) return;
    setCart((prev) => prev.map((x) => (x.productId === productId ? { ...x, quantity } : x)));
  };

  const removeFromBill = (productId: string) => {
    setCart((prev) => prev.filter((x) => x.productId !== productId));
  };

  const saveInvoice = async () => {
    if (!itemRows.length) {
      toast.error("Add at least one product to invoice.");
      return;
    }

    if (!effectiveOrganizationId || !effectiveApiKey) {
      toast.error(
        supermarkets.length
          ? "Select a supermarket and ensure it has an organization ID and API key, or enter them manually below."
          : "Enter organization ID and API key (or add a supermarket under Running)."
      );
      return;
    }

    setLoading(true);
    try {
      const customerParsed = CustomerSchema.safeParse({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || null,
        externalCustomerId: null
      });

      if (!customerParsed.success) {
        toast.error(customerParsed.error.issues[0]?.message || "Customer details are invalid");
        setLoading(false);
        return;
      }

      // External sync via injection server logic
      const syncResult = await syncCustomerExternal(customerParsed.data, {
        ingestionKey: effectiveApiKey,
        organizationId: effectiveOrganizationId,
        paymentMethod: paymentMethod || null,
        items: itemRows.map((row) => ({
          productName: row.product.productName,
          quantity: row.quantity,
          unitPrice: row.product.price,
          totalPrice: row.lineTotal,
          externalProductId: row.product.productId ?? row.product.id,
          taxAmount: row.lineTax,
          discountAmount: row.lineDiscount
        })),
        subtotalAmount: totals.subtotal,
        discountAmount: totals.discountTotal,
        totalTax: totals.taxTotal,
        totalAmount: totals.grandTotal
      });

      if (syncResult.forceRefresh) {
        toast.success(syncResult.successMessage ?? "Invoice queued for processing.");
        setTimeout(() => {
          window.location.reload();
        }, 800);
        return;
      }

      await createInvoice({
        customer: syncResult.customer,
        products,
        cart,
        status,
        paymentMethod: paymentMethod || null,
        cashierName: cashierName || null,
        notes: notes || null,
        ingestionKey: effectiveApiKey,
        organizationId: effectiveOrganizationId
      });

      setCart([]);
      toast.success("Invoice created successfully.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("External customer ID not returned by API")) {
        toast.error("Customer processing is not complete yet. Please try again in a moment.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to create invoice");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-[1500px] space-y-8">
      <div className="flex flex-col gap-5 border-b border-zinc-200 pb-7 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" />
            Sales Terminal
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">Billing Dashboard</h1>
          <p className="mt-2 text-base font-medium text-zinc-500">
            Create invoices, synchronize customers, and capture payment details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="rounded-xl px-4 py-3">
            {itemRows.length} line items
          </Badge>
          <Button className="h-12 rounded-2xl px-6" onClick={saveInvoice} disabled={loading || !itemRows.length}>
            <Receipt className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-zinc-500" />
                Supermarket / organization
              </CardTitle>
              <CardDescription>
                Same as <span className="font-medium text-zinc-700">Running</span>: pick where invoices are ingested, then add line items below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Registered supermarket
                </label>
                <select
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-950 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200/70 md:max-w-xl"
                  value={selectedSupermarketId}
                  onChange={(e) => setSelectedSupermarketId(e.target.value)}
                  disabled={!supermarkets.length}
                >
                  <option value="">
                    {supermarkets.length ? "Choose supermarket…" : "No supermarkets — use manual keys below"}
                  </option>
                  {supermarkets.map((sm) => {
                    const id = supermarketKey(sm);
                    return (
                      <option key={id} value={id}>
                        {sm.supermarket_name}
                      </option>
                    );
                  })}
                </select>
              </div>
              {selectedSupermarket ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                  <p className="font-medium text-zinc-900">{selectedSupermarket.supermarket_name}</p>
                  <p className="mt-1 font-mono text-xs text-zinc-600 break-all">
                    Organization ID: {selectedSupermarket.organization_id}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">API key from this record is sent as X-Ingestion-Key (same as Running).</p>
                </div>
              ) : null}
              <div className="space-y-3 border-t border-zinc-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Manual ingestion (optional override)
                </p>
                <Input
                  placeholder="Organization ID (required if no supermarket selected)"
                  value={manualOrganizationId}
                  onChange={(e) => setManualOrganizationId(e.target.value)}
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="API key / ingestion key"
                  value={manualApiKey}
                  onChange={(e) => setManualApiKey(e.target.value)}
                />
                {selectedSupermarket ? (
                  <p className="text-xs text-zinc-500">
                    If this supermarket is missing an API key or organization ID in the database, the manual fields below are used as a fallback.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-zinc-500" />
                Customer
              </CardTitle>
              <CardDescription>Enter customer details for the invoice record.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Input placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <Input placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              <Input
                placeholder="Email (optional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-zinc-500" />
                Invoice Items
              </CardTitle>
              <CardDescription>Select products and build invoice lines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row">
            <select
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-950 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200/70 md:min-w-80"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {!products.length && <option value="">No products available</option>}
              {products.map((product) => {
                const pid = productRowId(product);
                return (
                <option key={pid} value={pid}>
                  {product.productName} - {product.price}
                </option>
                );
              })}
            </select>
            <Button
              onClick={addProductToBill}
              disabled={loading || !selectedProductId.trim()}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add To Bill
            </Button>
          </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Line Total</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemRows.map((row) => {
                  const rowId = productRowId(row.product);
                  return (
                  <TableRow key={rowId}>
                    <TableCell className="font-medium">{row.product.productName}</TableCell>
                    <TableCell>
                      <Input
                        className="w-20"
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) => updateQty(rowId, Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>{format(row.product.price)}</TableCell>
                    <TableCell>{format(row.lineTax)}</TableCell>
                    <TableCell>{format(row.lineDiscount)}</TableCell>
                    <TableCell>
                      <Badge>{format(row.lineTotal)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button className="h-9 px-3" variant="destructive" onClick={() => removeFromBill(rowId)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
                {!itemRows.length && (
                  <TableRow>
                    <TableCell className="text-center text-slate-500" colSpan={7}>
                      No products added to bill.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-zinc-500" />
              Payment
            </CardTitle>
            <CardDescription>Finalize totals and payment details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">
              <div className="flex items-center justify-between py-1.5">
                <span>Subtotal</span>
                <span className="tabular-nums text-zinc-950">{format(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>Tax Total</span>
                <span className="tabular-nums text-zinc-950">{format(totals.taxTotal)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>Discount</span>
                <span className="tabular-nums text-zinc-950">{format(totals.discountTotal)}</span>
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-zinc-200 pt-4">
                <span>Grand Total</span>
                <span className="text-xl font-bold tracking-tight text-zinc-950">{format(totals.grandTotal)}</span>
              </div>
            </div>

            <div className="grid gap-3">
            <select
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-950 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200/70"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
            <select
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-950 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200/70"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
            >
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="UPI">UPI</option>
              <option value="NET_BANKING">NET_BANKING</option>
              <option value="WALLET">WALLET</option>
              <option value="OTHER">OTHER</option>
            </select>
            <Input placeholder="Cashier Name" value={cashierName} onChange={(e) => setCashierName(e.target.value)} />
            <Textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            <Button className="mt-1 h-12 rounded-2xl" onClick={saveInvoice} disabled={loading}>
              <Receipt className="h-4 w-4" />
              Create Invoice
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
