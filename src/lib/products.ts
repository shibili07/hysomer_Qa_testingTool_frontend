import { apiFetch } from "./api-client";

export async function listProducts() {
  try {
    const res = await apiFetch("/api/products/");

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch products");
    }

    const raw = data.products || [];
    return raw.map((p: Record<string, unknown> & { _id?: string; id?: string }) => ({
      ...p,
      id: String(p.id ?? p._id ?? ""),
    })).filter((p: { id: string }) => p.id.length > 0);
  } catch (error: unknown) {
    console.error("List products error:", error);
    return [];
  }
}

export async function createProduct(productData: unknown) {
  try {
    const res = await apiFetch("/api/products/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to create product");
    }

    return data.product;
  } catch (error: unknown) {
    throw error;
  }
}

export async function editProduct(id: string, productData: unknown) {
  try {
    const res = await apiFetch(`/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update product");
    }

    return data.product;
  } catch (error: unknown) {
    throw error;
  }
}

export async function removeProduct(id: string) {
  try {
    const res = await apiFetch(`/api/products/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to delete product");
    }

    return data;
  } catch (error: unknown) {
    throw error;
  }
}
