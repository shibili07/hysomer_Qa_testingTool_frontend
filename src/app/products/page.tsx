"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const submitLabel = useMemo(() => (editingId ? "Update Product" : "Add Product"), [editingId]);
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const paginatedProducts = useMemo(
    () => products.slice((page - 1) * pageSize, page * pageSize),
    [products, page, pageSize]
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
    <section className="space-y-6">
      <Card className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-white">Products</CardTitle>
            <Badge variant="secondary">{products.length} items</Badge>
          </div>
          <CardDescription className="text-slate-200">
            Add, edit, delete and manage your product catalog from MongoDB.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Product" : "Create Product"}</CardTitle>
          <CardDescription>Minimal POS-ready fields with stock tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Product Name"
              value={form.productName}
              onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
              required
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              required
            />
            <Input
              placeholder="ProductId (optional, auto generated if empty)"
              value={form.productId}
              onChange={(e) => setForm((prev) => ({ ...prev, productId: e.target.value }))}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Tax Amount"
              value={form.taxAmount}
              onChange={(e) => setForm((prev) => ({ ...prev, taxAmount: e.target.value }))}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Discount Amount"
              value={form.discountAmount}
              onChange={(e) => setForm((prev) => ({ ...prev, discountAmount: e.target.value }))}
            />
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
            />
            <div className="flex gap-2 md:col-span-2">
              <Button disabled={loading} type="submit">
                {submitLabel}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm} disabled={loading}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>Live list from MongoDB.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>ProductId</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.productName}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>{product.productId || "-"}</TableCell>
                  <TableCell>{product.taxAmount ?? 0}</TableCell>
                  <TableCell>{product.discountAmount ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={Number(product.stock ?? 0) > 0 ? "secondary" : "danger"}>{product.stock ?? 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button className="h-8 px-3" variant="secondary" onClick={() => startEdit(product)} disabled={loading} type="button">
                        Edit
                      </Button>
                      <Button className="h-8 px-3" variant="destructive" onClick={() => onDelete(product.id)} disabled={loading} type="button">
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!products.length && !loading && (
                <TableRow>
                  <TableCell className="text-center text-slate-500" colSpan={7}>
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-4">
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