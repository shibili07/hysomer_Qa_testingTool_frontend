import { toast } from "sonner";

const API_BASE_URL = "http://localhost:5000/api/supermarkets";

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
    const res = await fetch(`${API_BASE_URL}/`, {
      credentials: "include",
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch supermarkets");
    }
    
    return data.supermarkets || [];
  } catch (error: any) {
    console.error("List supermarkets error:", error);
    return [];
  }
}

export async function createSupermarket(supermarketData: Partial<Supermarket>) {
  try {
    const res = await fetch(`${API_BASE_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(supermarketData),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to create supermarket");
    }

    return data.supermarket;
  } catch (error: any) {
    throw error;
  }
}

export async function editSupermarket(id: string, supermarketData: Partial<Supermarket>) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(supermarketData),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update supermarket");
    }

    return data.supermarket;
  } catch (error: any) {
    throw error;
  }
}

export async function removeSupermarket(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to delete supermarket");
    }

    return data;
  } catch (error: any) {
    throw error;
  }
}
