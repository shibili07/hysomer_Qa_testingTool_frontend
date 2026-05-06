
import { useEffect, useMemo, useState } from "react";
import { syncCustomerExternal } from "@/lib/customers";
import { createInvoice } from "@/lib/invoices";
import { listProducts } from "@/lib/products";
import { CustomerSchema } from "@/lib/schemas";
import { toast } from "sonner";
import { CreditCard, Plus, Receipt, ShoppingCart, Trash2, UserRound } from "lucide-react";
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

export default function InvoicePage() {
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
  const [ingestionKey, setIngestionKey] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshBaseData = async () => {
    const productData = await listProducts();
    setProducts(productData);
    if (productData.length && !selectedProductId) {
      setSelectedProductId(productData[0].id);
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

  const itemRows = useMemo(() => {
    return cart
      .map((item) => {
        const p = products.find((x) => x.id === item.productId);
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
    if (!selectedProductId) return;
    setCart((prev) => {
      const existing = prev.find((x) => x.productId === selectedProductId);
      if (existing) {
        return prev.map((x) => (x.productId === selectedProductId ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [...prev, { productId: selectedProductId, quantity: 1 }];
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
        ingestionKey,
        paymentMethod: paymentMethod || null,
        items: itemRows.map((row) => ({
          productName: row.product.productName,
          quantity: row.quantity,
          unitPrice: row.product.price,
          totalPrice: row.lineTotal,
          externalProductId: row.product.productId,
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
        ingestionKey: ingestionKey.trim() || null
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
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.productName} - {product.price}
                </option>
              ))}
            </select>
            <Button onClick={addProductToBill} disabled={loading} type="button">
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
                {itemRows.map((row) => (
                  <TableRow key={row.product.id}>
                    <TableCell className="font-medium">{row.product.productName}</TableCell>
                    <TableCell>
                      <Input
                        className="w-20"
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) => updateQty(row.product.id, Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>{format(row.product.price)}</TableCell>
                    <TableCell>{format(row.lineTax)}</TableCell>
                    <TableCell>{format(row.lineDiscount)}</TableCell>
                    <TableCell>
                      <Badge>{format(row.lineTotal)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button className="h-9 px-3" variant="destructive" onClick={() => removeFromBill(row.product.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
            <Input
              placeholder="API Key"
              value={ingestionKey}
              onChange={(e) => setIngestionKey(e.target.value)}
            />
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
