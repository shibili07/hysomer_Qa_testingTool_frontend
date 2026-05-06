import { apiFetch } from "./api-client";

export interface Supermarket {
  id: string;
  _id?: string;
  organization_id: string;
  supermarket_name: string;
  api_key: string;
  createdAt?: number;
}

export async function listSupermarkets() {
  try {
    const res = await apiFetch("/api/supermarkets");

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch supermarkets");
    }

    const raw = data.supermarkets || [];
    return raw.map((s: Supermarket & { _id?: string }) => ({
      ...s,
      id: String(s.id ?? s._id ?? ""),
    })).filter((s: Supermarket) => s.id.length > 0);
  } catch (error: unknown) {
    console.error("List supermarkets error:", error);
    return [];
  }
}

export async function createSupermarket(supermarketData: Partial<Supermarket>) {
  try {
    const res = await apiFetch("/api/supermarkets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(supermarketData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to create supermarket");
    }

    return data.supermarket;
  } catch (error: unknown) {
    throw error;
  }
}

export async function editSupermarket(id: string, supermarketData: Partial<Supermarket>) {
  try {
    const res = await apiFetch(`/api/supermarkets/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(supermarketData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update supermarket");
    }

    return data.supermarket;
  } catch (error: unknown) {
    throw error;
  }
}

export async function removeSupermarket(id: string) {
  try {
    const res = await apiFetch(`/api/supermarkets/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to delete supermarket");
    }

    return data;
  } catch (error: unknown) {
    throw error;
  }
}
