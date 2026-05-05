
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  DollarSign,
  Hash,
  LayoutList,
  Loader2,
  Package,
  PencilLine,
  Percent,
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
import { cn } from "@/lib/utils";

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
    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-0.5">{children}</p>
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

  const draftPreview = useMemo(() => {
    const name = form.productName.trim() || "Untitled product";
    const priceNum = form.price === "" ? null : Number(form.price);
    const stockNum = form.stock === "" ? null : Number(form.stock);
    const taxNum = form.taxAmount === "" ? null : Number(form.taxAmount);
    const discNum = form.discountAmount === "" ? null : Number(form.discountAmount);
    return { name, priceNum, stockNum, taxNum, discNum };
  }, [form]);

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

  const hasDraftInput =
    form.productName.trim() !== "" ||
    form.price !== "" ||
    form.productId.trim() !== "" ||
    form.taxAmount !== "" ||
    form.discountAmount !== "" ||
    form.stock !== "";

  return (
    <section className="space-y-6 max-w-6xl mx-auto">
      <Card className="bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-800 text-white border-0 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        <CardHeader className="relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-white text-2xl tracking-tight">Products</CardTitle>
            <Badge variant="secondary" className="bg-white/15 text-white border-white/20 hover:bg-white/20 font-semibold">
              {products.length} in catalog
            </Badge>
          </div>
          <CardDescription className="text-slate-300 max-w-2xl">
            Create and maintain POS-ready items with pricing, tax, discounts, and stock—all synced with your backend.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3 border-slate-100 shadow-sm">
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
                    placeholder="e.g. Artisan cold brew — 12 oz"
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
                      Saving…
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

        <Card className="md:col-span-2 border-slate-100 shadow-sm bg-slate-50/60">
          <CardHeader>
            <CardTitle className="text-lg">Live preview</CardTitle>
            <CardDescription>How this item will read on invoices and at the register.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasDraftInput || editingId ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 leading-snug">{draftPreview.name}</p>
                    {form.productId.trim() ? (
                      <p className="text-xs font-medium text-slate-400 mt-1">SKU {form.productId.trim()}</p>
                    ) : (
                      <p className="text-xs font-medium text-slate-400 mt-1">SKU auto-assigned</p>
                    )}
                  </div>
                  {draftPreview.priceNum !== null && !Number.isNaN(draftPreview.priceNum) ? (
                    <Badge className="shrink-0 bg-slate-900 hover:bg-slate-800 tabular-nums">
                      ${draftPreview.priceNum.toFixed(2)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      Set price
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tax</p>
                    <p className="font-medium text-slate-800 tabular-nums">
                      {draftPreview.taxNum !== null && !Number.isNaN(draftPreview.taxNum)
                        ? `$${draftPreview.taxNum.toFixed(2)}`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Discount</p>
                    <p className="font-medium text-slate-800 tabular-nums">
                      {draftPreview.discNum !== null && !Number.isNaN(draftPreview.discNum)
                        ? `$${draftPreview.discNum.toFixed(2)}`
                        : "—"}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Stock</p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        draftPreview.stockNum !== null &&
                          !Number.isNaN(draftPreview.stockNum) &&
                          draftPreview.stockNum > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-900"
                      )}
                    >
                      {draftPreview.stockNum !== null && !Number.isNaN(draftPreview.stockNum)
                        ? `${draftPreview.stockNum} units`
                        : "Not set → 0"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center space-y-3 px-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-inner border border-slate-100">
                  <LayoutList className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm text-slate-500 font-medium max-w-[220px]">
                  Start typing on the left to see a card-style preview of your new product.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/40">
          <CardTitle className="flex items-center gap-2 text-xl">
            <LayoutList className="h-5 w-5 text-indigo-500" />
            Catalog
          </CardTitle>
          <CardDescription>Live list from your API — paginate, edit inline actions, or remove rows.</CardDescription>
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
                    <TableCell className="text-slate-600">{product.productId || "—"}</TableCell>
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
              onPageSizeChange={(size) => {
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
