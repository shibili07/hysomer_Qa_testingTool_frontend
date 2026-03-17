import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProductInput, ProductRecord, ProductSchema } from "@/lib/schemas";

const productsCollection = collection(db, "products");

const normalizeProduct = (input: ProductInput): ProductInput => {
  const validated = ProductSchema.parse(input);
  return {
    ...validated,
    productId: validated.productId?.trim() || crypto.randomUUID(),
    taxAmount: validated.taxAmount ?? 0,
    discountAmount: validated.discountAmount ?? 0,
    stock: validated.stock ?? 0
  };
};

export const listProducts = async (): Promise<ProductRecord[]> => {
  const q = query(productsCollection, orderBy("productName"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as ProductInput) }));
};

export const createProduct = async (input: ProductInput) => {
  const product = normalizeProduct(input);
  await addDoc(productsCollection, {
    ...product,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
};

export const editProduct = async (id: string, input: ProductInput) => {
  const product = normalizeProduct(input);
  await updateDoc(doc(db, "products", id), {
    ...product,
    updatedAt: Date.now()
  });
};

export const removeProduct = async (id: string) => {
  await deleteDoc(doc(db, "products", id));
};
