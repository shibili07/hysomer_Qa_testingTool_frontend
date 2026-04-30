import { toast } from "sonner";

const API_BASE_URL = "http://localhost:5000/api/products";

export async function listProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/`, {
      credentials: "include",
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch products");
    }
    
    return data.products || [];
  } catch (error: any) {
    console.error("List products error:", error);
    return [];
  }
}

export async function createProduct(productData: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to create product");
    }

    return data.product;
  } catch (error: any) {
    throw error;
  }
}

export async function editProduct(id: string, productData: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update product");
    }

    return data.product;
  } catch (error: any) {
    throw error;
  }
}

export async function removeProduct(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to delete product");
    }

    return data;
  } catch (error: any) {
    throw error;
  }
}
