
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  CalendarDays,
  DollarSign,
  Hash,
  LayoutList,
  Loader2,
  Package,
  PencilLine,
  Percent,
  Plus,
  Receipt,
  Sparkles
} from "lucide-react";
import { createProduct, editProduct, listProducts, removeProduct } from "@/lib/products";
import { z } from "zod";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Local Product Schema (Decoupled from shared lib for MongoDB migration)
const ProductSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  price: z.number().nonnegative("Unit price must be non-negative"),
  productId: z.string().optional(),
  taxAmount: z.number().optional().default(0),
  discountAmount: z.number().optional().default(0),
  stock: z.number().int().nonnegative("Stock must be non-negative").default(0)
});

type ProductInput = z.infer<typeof ProductSchema>;

type ProductRecord = ProductInput & {
  id: string;
  _id?: string;
  createdAt?: number;
  updatedAt?: number;
};

type ProductFormState = {
  productName: string;
  price: string;
  productId: string;
  taxAmount: string;
  discountAmount: string;
  stock: string;
};

const emptyForm: ProductFormState = {
  productName: "",
  price: "",
  productId: "",
  taxAmount: "",
  discountAmount: "",
  stock: ""
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{children}</p>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  trend
}: {
  icon: typeof Package;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <Card className="min-h-[160px]">
      <CardContent className="flex h-full flex-col justify-between p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-600 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{label}</p>
            <p className="mt-1 text-xs font-medium text-zinc-400">{trend}</p>
          </div>
        </div>
        <p className="mt-8 text-2xl font-bold tracking-tight text-zinc-950">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const submitLabel = useMemo(() => (editingId ? "Save changes" : "Add to catalog"), [editingId]);
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const paginatedProducts = useMemo(
    () => products.slice((page - 1) * pageSize, page * pageSize),
    [products, page, pageSize]
  );
  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.stock ?? 0), 0),
    [products]
  );
  const inventoryValue = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.price ?? 0) * Number(product.stock ?? 0), 0),
    [products]
  );
  const averagePrice = products.length
    ? products.reduce((sum, product) => sum + Number(product.price ?? 0), 0) / products.length
    : 0;
  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }),
    []
  );

  const refreshProducts = async () => {
    const data = await listProducts();
    setProducts(data);
  };

  useEffect(() => {
    setLoading(true);
    refreshProducts()
      .catch((error: unknown) => {
        console.error(error);
        toast.error("Failed to load products.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const parsed = ProductSchema.safeParse({
      productName: form.productName.trim(),
      price: Number(form.price),
      productId: form.productId.trim() || undefined,
      taxAmount: form.taxAmount === "" ? undefined : Number(form.taxAmount),
      discountAmount: form.discountAmount === "" ? undefined : Number(form.discountAmount),
      stock: form.stock === "" ? undefined : Number(form.stock)
    });

    if (!parsed.success) {
      setLoading(false);
      toast.error(parsed.error.issues[0]?.message || "Validation failed.");
      return;
    }

    try {
      if (editingId) {
        await editProduct(editingId, parsed.data);
        toast.success("Product updated.");
      } else {
        await createProduct(parsed.data);
        toast.success("Product added.");
      }
      resetForm();
      await refreshProducts();
    } catch (error) {
      console.error(error);
      toast.error("Action failed. Check API connection.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (product: ProductRecord) => {
    setEditingId(product.id);
    setForm({
      productName: product.productName,
      price: String(product.price ?? 0),
      productId: product.productId ?? "",
      taxAmount: String(product.taxAmount ?? 0),
      discountAmount: String(product.discountAmount ?? 0),
      stock: String(product.stock ?? 0)
    });
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;
    setLoading(true);
    try {
      await removeProduct(id);
      toast.success("Product deleted.");
      await refreshProducts();
    } catch (error) {
      console.error(error);
      toast.error("Delete failed.");
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
            Catalog Terminal
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 md:text-3xl">Products Dashboard</h1>
          <p className="mt-2 text-base font-medium text-zinc-500">
            Monitor stock, pricing, tax, discounts, and POS-ready catalog records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-12 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-r border-zinc-200 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              <CalendarDays className="h-4 w-4" />
              Period
            </div>
            <div className="flex items-center px-5 text-sm font-semibold text-zinc-950">This Month</div>
          </div>
          <Button
            className="h-12 rounded-2xl px-6"
            type="button"
            onClick={() => document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth" })}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Package} label="Products" value={String(products.length)} trend="Items tracked in catalog" />
        <MetricCard icon={Boxes} label="Stock On Hand" value={String(totalStock)} trend="Total available units" />
        <MetricCard icon={DollarSign} label="Inventory Value" value={money.format(inventoryValue)} trend="Price multiplied by stock" />
        <MetricCard icon={Percent} label="Average Price" value={money.format(averagePrice)} trend="Across active products" />
      </div>

      <Card id="product-form" className="border-zinc-200 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Package className="h-5 w-5 shrink-0 text-indigo-500" />
                  {editingId ? "Edit product" : "Add product"}
                </CardTitle>
                <CardDescription>
                  {editingId
                    ? "Update catalog fields below, then save your changes."
                    : "Required: name and unit price. Other fields default to zero when left blank."}
                </CardDescription>
              </div>
              {editingId ? (
                <Badge variant="secondary" className="shrink-0 gap-1 font-medium">
                  <PencilLine className="h-3.5 w-3.5" />
                  Editing
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-8">
              <div className="space-y-4">
                <SectionLabel>Product details</SectionLabel>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-slate-400" />
                    Display name
                  </label>
                  <Input
                    placeholder="e.g. Artisan cold brew - 12 oz"
                    value={form.productName}
                    onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
                    className="focus-visible:ring-2 focus-visible:ring-indigo-500/25"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-slate-400" />
                    SKU / product ID
                    <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </label>
                  <Input
                    placeholder="Leave empty to auto-generate"
                    value={form.productId}
                    onChange={(e) => setForm((prev) => ({ ...prev, productId: e.target.value }))}
                    className="focus-visible:ring-2 focus-visible:ring-indigo-500/25"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-8">
                <SectionLabel>Pricing</SectionLabel>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2 md:col-span-1">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      Unit price
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                      className="focus-visible:ring-2 focus-visible:ring-indigo-500/25"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-slate-400" />
                      Tax amount
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={form.taxAmount}
                      onChange={(e) => setForm((prev) => ({ ...prev, taxAmount: e.target.value }))}
                      className="focus-visible:ring-2 focus-visible:ring-indigo-500/25"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Percent className="h-4 w-4 text-slate-400" />
                      Discount amount
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={form.discountAmount}
                      onChange={(e) => setForm((prev) => ({ ...prev, discountAmount: e.target.value }))}
                      className="focus-visible:ring-2 focus-visible:ring-indigo-500/25"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-8">
                <SectionLabel>Inventory</SectionLabel>
                <div className="space-y-2 max-w-md">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-slate-400" />
                    Stock on hand
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                    className="focus-visible:ring-2 focus-visible:ring-indigo-500/25"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-end">
                {editingId ? (
                  <Button type="button" variant="secondary" onClick={resetForm} disabled={loading} className="rounded-xl">
                    Discard
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-900 px-6 text-white shadow-lg shadow-slate-200/80 hover:bg-slate-800 sm:min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      {submitLabel}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/40">
          <CardTitle className="flex items-center gap-2 text-xl">
            <LayoutList className="h-5 w-5 text-indigo-500" />
            Catalog
          </CardTitle>
          <CardDescription>Live list from your API - paginate, edit inline actions, or remove rows.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Price</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Product ID</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Tax</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Discount</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Stock</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id} className="border-slate-100">
                    <TableCell className="font-medium text-slate-900">{product.productName}</TableCell>
                    <TableCell className="tabular-nums text-slate-700">${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell className="text-slate-600">{product.productId || "-"}</TableCell>
                    <TableCell className="tabular-nums text-slate-600">{product.taxAmount ?? 0}</TableCell>
                    <TableCell className="tabular-nums text-slate-600">{product.discountAmount ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={Number(product.stock ?? 0) > 0 ? "secondary" : "danger"}>
                        {product.stock ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="h-9 rounded-lg px-3"
                          variant="secondary"
                          onClick={() => startEdit(product)}
                          disabled={loading}
                          type="button"
                        >
                          <PencilLine className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          className="h-9 rounded-lg px-3"
                          variant="destructive"
                          onClick={() => onDelete(product.id)}
                          disabled={loading}
                          type="button"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!products.length && !loading && (
                  <TableRow>
                    <TableCell className="py-16 text-center text-slate-500" colSpan={7}>
                      No products yet. Add your first item using the form above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-slate-100 p-4 bg-white">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={products.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size: number) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

