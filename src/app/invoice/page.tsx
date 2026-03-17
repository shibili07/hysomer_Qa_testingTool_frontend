"use client";

import { useEffect, useMemo, useState } from "react";
import { syncCustomerExternal } from "@/lib/customers";
import { createInvoice } from "@/lib/invoices";
import { listProducts } from "@/lib/products";
import { CustomerSchema, ProductRecord } from "@/lib/schemas";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

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
  const [status, setStatus] = useState<"PAID" | "PENDING" | "CANCELLED" | "REFUNDED">("PAID");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "UPI" | "NET_BANKING" | "WALLET" | "OTHER" | ""
  >("CASH");
  const [cashierName, setCashierName] = useState("hysomer");
  const [notes, setNotes] = useState("");
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
        externalCustomerId: null
      });
      if (!customerParsed.success) {
        toast.error(customerParsed.error.issues[0]?.message || "Customer details are invalid");
        setLoading(false);
        return;
      }
      const syncResult = await syncCustomerExternal(customerParsed.data, {
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
        notes: notes || null
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
    <section className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-700 to-violet-800 text-white border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-white">Billing</CardTitle>
            <Badge variant="secondary">{itemRows.length} line items</Badge>
          </div>
          <CardDescription className="text-indigo-100">Create invoice, sync to external API, and store in Firebase.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1) Customer</CardTitle>
          <CardDescription>Enter customer name and phone. This is sent to ingestion server.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Customer Name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <Input placeholder="Phone Number *" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2) Add Items</CardTitle>
          <CardDescription>Select products and build invoice lines.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row">
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 md:min-w-72"
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
            <Button onClick={addProductToBill} disabled={loading}>
              Add To Bill
            </Button>
          </div>

          <div className="overflow-x-auto">
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
                      <Button className="h-8 px-3" variant="destructive" onClick={() => removeFromBill(row.product.id)}>
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

      <Card>
        <CardHeader>
          <CardTitle>3) Finalize Invoice</CardTitle>
          <CardDescription>Set payment details and generate invoice.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p>Subtotal: {format(totals.subtotal)}</p>
            <p>Tax Total: {format(totals.taxTotal)}</p>
            <p>Discount Total: {format(totals.discountTotal)}</p>
            <p className="text-lg font-bold text-slate-900">Grand Total: {format(totals.grandTotal)}</p>
          </div>

          <div className="grid gap-2">
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
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
            <Button onClick={saveInvoice} disabled={loading}>
              Create Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
