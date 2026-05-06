// Invoice generator – ported from scheduler-server/scripts/invoice-seed-hysomer-shared.mjs
// Generates realistic Kerala supermarket invoices for stress-testing the ingestion server.

// We will use the local backend as a proxy to bypass CORS
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Product catalog ──────────────────────────────────────────────────────────

const keralaProductCatalog: Record<string, { name: string; unitPrice: number; unit: string }[]> = {
  staples: [
    { name: "Nirapara Matta Rice 5kg", unitPrice: 560, unit: "5 kg" },
    { name: "Pavizham Jaya Rice 5kg", unitPrice: 490, unit: "5 kg" },
    { name: "Double Horse Vadi Matta 5kg", unitPrice: 580, unit: "5 kg" },
    { name: "Toor Dal 1kg", unitPrice: 158, unit: "1 kg" },
    { name: "Moong Dal 1kg", unitPrice: 142, unit: "1 kg" },
    { name: "Chana Dal 1kg", unitPrice: 98, unit: "1 kg" },
    { name: "Sugar 1kg", unitPrice: 46, unit: "1 kg" },
    { name: "Tata Salt 1kg", unitPrice: 28, unit: "1 kg" },
    { name: "Ponni Rice 5kg", unitPrice: 420, unit: "5 kg" },
    { name: "Sona Masoori Rice 5kg", unitPrice: 450, unit: "5 kg" },
  ],
  flours: [
    { name: "Double Horse Puttu Podi 1kg", unitPrice: 88, unit: "1 kg" },
    { name: "Double Horse Appam/Idiyappam Podi 1kg", unitPrice: 92, unit: "1 kg" },
    { name: "Brahmins Puttu Podi 1kg", unitPrice: 85, unit: "1 kg" },
    { name: "Aashirvaad Atta 5kg", unitPrice: 320, unit: "5 kg" },
    { name: "Elite Maida 1kg", unitPrice: 55, unit: "1 kg" },
    { name: "Nirapara Pathiri Podi 1kg", unitPrice: 90, unit: "1 kg" },
  ],
  masalaSpices: [
    { name: "Eastern Chicken Masala 100g", unitPrice: 68, unit: "100 g" },
    { name: "Eastern Sambar Masala 100g", unitPrice: 62, unit: "100 g" },
    { name: "Eastern Fish Masala 100g", unitPrice: 65, unit: "100 g" },
    { name: "Eastern Turmeric Powder 250g", unitPrice: 75, unit: "250 g" },
    { name: "Eastern Chilli Powder 250g", unitPrice: 110, unit: "250 g" },
    { name: "Kitchen Treasures Chicken Masala 100g", unitPrice: 66, unit: "100 g" },
    { name: "Whole Black Pepper 100g", unitPrice: 120, unit: "100 g" },
    { name: "Cardamom (Elakkaya) 50g", unitPrice: 180, unit: "50 g" },
    { name: "Cumin Seeds (Jeerakam) 100g", unitPrice: 85, unit: "100 g" },
  ],
  oilsGhee: [
    { name: "KPL Shudhi Coconut Oil 1L", unitPrice: 245, unit: "1 L" },
    { name: "Kera Coconut Oil 1L", unitPrice: 235, unit: "1 L" },
    { name: "Fortune Sunflower Oil 1L", unitPrice: 165, unit: "1 L" },
    { name: "Milma Ghee 500ml", unitPrice: 440, unit: "500 ml" },
    { name: "Amul Cow Ghee 500ml", unitPrice: 320, unit: "500 ml" },
  ],
  dairy: [
    { name: "Milma Toned Milk 500ml", unitPrice: 26, unit: "500 ml" },
    { name: "Milma Rich Milk 500ml", unitPrice: 30, unit: "500 ml" },
    { name: "Milma Curd 500g", unitPrice: 35, unit: "500 g" },
    { name: "Amul Butter 100g", unitPrice: 62, unit: "100 g" },
    { name: "Britannia Cheese Slices 200g", unitPrice: 165, unit: "200 g" },
  ],
  beverages: [
    { name: "Kanan Devan Tea 250g", unitPrice: 145, unit: "250 g" },
    { name: "AVT Premium Tea 500g", unitPrice: 275, unit: "500 g" },
    { name: "Bru Instant Coffee 100g", unitPrice: 210, unit: "100 g" },
    { name: "Nescafe Classic 50g", unitPrice: 175, unit: "50 g" },
    { name: "Horlicks 500g", unitPrice: 265, unit: "500 g" },
    { name: "Coca-Cola 750ml", unitPrice: 45, unit: "750 ml" },
  ],
  snacksBiscuits: [
    { name: "Banana Chips 200g", unitPrice: 95, unit: "200 g" },
    { name: "Kerala Mixture 250g", unitPrice: 85, unit: "250 g" },
    { name: "Britannia Marie Gold 250g", unitPrice: 45, unit: "250 g" },
    { name: "Parle-G 800g", unitPrice: 95, unit: "800 g" },
    { name: "Lays Magic Masala 50g", unitPrice: 20, unit: "50 g" },
    { name: "Sunfeast Dark Fantasy 100g", unitPrice: 50, unit: "100 g" },
  ],
  produce: [
    { name: "Onion 1kg", unitPrice: 48, unit: "1 kg" },
    { name: "Tomato 1kg", unitPrice: 35, unit: "1 kg" },
    { name: "Potato 1kg", unitPrice: 42, unit: "1 kg" },
    { name: "Ginger 250g", unitPrice: 60, unit: "250 g" },
    { name: "Green Chilli 250g", unitPrice: 25, unit: "250 g" },
    { name: "Nendran Banana 1kg", unitPrice: 75, unit: "1 kg" },
  ],
  personalCare: [
    { name: "Hamam Soap 100g", unitPrice: 38, unit: "100 g" },
    { name: "Dove Bar 100g", unitPrice: 65, unit: "100 g" },
    { name: "Clinic Plus Shampoo 340ml", unitPrice: 210, unit: "340 ml" },
    { name: "Colgate Strong Teeth 200g", unitPrice: 115, unit: "200 g" },
    { name: "Dettol Handwash Refill 750ml", unitPrice: 165, unit: "750 ml" },
  ],
  household: [
    { name: "Surf Excel Easy Wash 1kg", unitPrice: 175, unit: "1 kg" },
    { name: "Vim Bar 3x200g", unitPrice: 65, unit: "3 pcs" },
    { name: "Lizol Floor Cleaner 500ml", unitPrice: 110, unit: "500 ml" },
    { name: "Harpic Toilet Cleaner 500ml", unitPrice: 105, unit: "500 ml" },
    { name: "Odonil Air Freshener 50g", unitPrice: 55, unit: "50 g" },
  ],
};

// ─── Static data ──────────────────────────────────────────────────────────────

const firstNames = [
  "Akhil","Anoop","Sreejith","Nithin","Rahul","Arjun","Vivek","Fahad","Niyas","Nikhil",
  "Anjali","Athira","Aiswarya","Keerthana","Meera","Diya","Nimisha","Fathima","Aswathy","Sneha",
];
const lastNames = [
  "Nair","Menon","Pillai","Varma","Nambiar","Panicker","Thomas","Joseph","Mathew","Kurian",
  "Khan","Ali","Hameed","Rajan","Prasad","Das","Sasidharan","Babu","Kumar","Krishnan",
];
const cities = ["Kochi","Thiruvananthapuram","Kozhikode","Thrissur","Kannur","Kottayam","Palakkad","Malappuram"];
const cashiers = ["Akhil","Nimmy","Vishnu","Reshma","Aneesh","Shameer","Aparna"];

const paymentMethods = [
  { value: "UPI", weight: 42 },
  { value: "CASH", weight: 28 },
  { value: "CARD", weight: 20 },
  { value: "NET_BANKING", weight: 4 },
  { value: "WALLET", weight: 4 },
  { value: "OTHER", weight: 2 },
];

const basketPatterns = [
  { name: "bread-jam-breakfast", weight: 10, groups: ["beverages","flours","dairy"], forcedItems: ["Milma Toned Milk 500ml","Amul Butter 100g"] },
  { name: "tea-biscuit-run", weight: 12, groups: ["beverages","snacksBiscuits"], forcedItems: ["Kanan Devan Tea 250g","Sugar 1kg","Britannia Marie Gold 250g"] },
  { name: "monthly-staples-major", weight: 25, groups: ["staples","flours","masalaSpices","oilsGhee","household"], forcedItems: [] },
  { name: "curry-preparation", weight: 15, groups: ["masalaSpices","produce","oilsGhee","staples"], forcedItems: ["Eastern Chicken Masala 100g","Onion 1kg","Tomato 1kg","Ginger 250g"] },
  { name: "evening-snacks", weight: 10, groups: ["snacksBiscuits","beverages"], forcedItems: ["Banana Chips 200g","Kerala Mixture 250g"] },
  { name: "dairy-produce-topup", weight: 15, groups: ["dairy","produce"], forcedItems: ["Milma Toned Milk 500ml","Tomato 1kg"] },
  { name: "personal-cleaning-haul", weight: 13, groups: ["personalCare","household"], forcedItems: [] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomPick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}
function weightedPick<T extends { weight: number }>(entries: T[]): T {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let point = Math.random() * total;
  for (const entry of entries) {
    point -= entry.weight;
    if (point <= 0) return entry;
  }
  return entries[0];
}

function uuid(): string {
  return crypto.randomUUID();
}

// ─── Invoice builder ──────────────────────────────────────────────────────────

function randomCustomer(emailBase: string) {
  const first = randomPick(firstNames);
  const last = randomPick(lastNames);
  const city = randomPick(cities);
  const pincode = `${randomInt(670000, 695999)}`;
  const hasPhone = Math.random() < 0.9;
  const hasAddress = Math.random() < 0.7;
  const atIdx = emailBase.lastIndexOf("@");
  const suffix = `+cust${Date.now()}${randomInt(10, 99)}`;
  const email =
    atIdx === -1
      ? `${emailBase}${suffix}`
      : `${emailBase.slice(0, atIdx)}${suffix}@${emailBase.slice(atIdx + 1)}`;
  return {
    customerId: uuid(),
    externalCustomerId: null,
    name: `${first} ${last}`,
    email,
    phone: hasPhone ? `+91${randomInt(6000000000, 9999999999)}` : null,
    city,
    state: "Kerala",
    country: "India",
    pincode,
    address: hasAddress ? `${randomInt(1, 250)}, Market Road, ${city} - ${pincode}` : null,
  };
}

function inferGstRate(n: string) {
  const l = n.toLowerCase();
  if (["onion","tomato","potato","banana","coriander","chilli"].some((k) => l.includes(k))) return 0;
  if (["rice","atta","dal","rava","flour"].some((k) => l.includes(k))) return 0.05;
  if (["shampoo","soap","handwash","detergent"].some((k) => l.includes(k))) return 0.18;
  return 0.12;
}

function inferDiscountRate(patternName: string, productName: string) {
  const l = productName.toLowerCase();
  if (patternName === "bread-jam-breakfast" && (l.includes("bread") || l.includes("jam"))) return 0.03;
  if (patternName.includes("tea-biscuit") && (l.includes("tea") || l.includes("biscuit"))) return 0.04;
  return 0;
}

function pickProductsForPattern(pattern: (typeof basketPatterns)[number]) {
  const selected = new Map<string, { name: string; unitPrice: number; unit: string }>();
  for (const group of pattern.groups) {
    const items = keralaProductCatalog[group];
    if (!items) continue;
    const take = randomInt(2, Math.min(6, items.length));
    for (let i = 0; i < take; i++) selected.set(randomPick(items).name, randomPick(items));
  }
  for (const forcedName of pattern.forcedItems ?? []) {
    for (const group of Object.values(keralaProductCatalog)) {
      const found = group.find((it) => it.name === forcedName);
      if (found) selected.set(found.name, found);
    }
  }
  return [...selected.values()];
}

export interface InvoicePayload {
  organizationId: string;
  externalInvoiceId: string;
  invoiceDate: string;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  totalTax: number;
  status: string;
  currency: string;
  paymentMethod: string;
  cashierName: string;
  notes: string;
  customer: ReturnType<typeof randomCustomer>;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit: string;
    externalProductId: string;
    taxAmount?: number;
    discountAmount?: number;
  }[];
}

export function buildInvoicePayload(
  organizationId: string,
  emailBase: string,
  index: number
): InvoicePayload {
  const pattern = weightedPick(basketPatterns);
  const customer = randomCustomer(emailBase);
  const paymentMethod = weightedPick(paymentMethods).value;
  const picked = pickProductsForPattern(pattern);

  const items = picked.map((p) => {
    const quantity = randomInt(1, p.unit.includes("kg") || p.unit.includes("L") ? 2 : 4);
    const lineBase = p.unitPrice * quantity;
    const discRate = inferDiscountRate(pattern.name, p.name);
    const gstRate = inferGstRate(p.name);
    const discountAmount = +(lineBase * discRate).toFixed(2);
    const taxAmount = +((lineBase - discountAmount) * gstRate).toFixed(2);
    const totalPrice = +(lineBase - discountAmount + taxAmount).toFixed(2);
    return {
      productName: p.name,
      quantity,
      unitPrice: p.unitPrice,
      totalPrice,
      unit: p.unit,
      externalProductId: `REAL-${p.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24).toUpperCase()}`,
      taxAmount: taxAmount || undefined,
      discountAmount: discountAmount || undefined,
    };
  });

  const subtotalAmount = +items.reduce((s, i) => s + i.unitPrice * i.quantity, 0).toFixed(2);
  const discountAmount = +items.reduce((s, i) => s + (i.discountAmount ?? 0), 0).toFixed(2);
  const totalTax = +items.reduce((s, i) => s + (i.taxAmount ?? 0), 0).toFixed(2);
  const totalAmount = +(subtotalAmount - discountAmount + totalTax).toFixed(2);
  const serial = String(index + 1).padStart(2, "0");
  const unique = `${Date.now()}${randomInt(100, 999)}`;

  return {
    organizationId,
    externalInvoiceId: `Inv_${serial}_${unique}`,
    invoiceDate: new Date().toISOString(),
    totalAmount,
    subtotalAmount,
    discountAmount,
    totalTax,
    status: "PAID",
    currency: "INR",
    paymentMethod,
    cashierName: randomPick(cashiers),
    notes: `Seed pattern: ${pattern.name} | running_stress_test=true`,
    customer,
    items,
  };
}

// ─── Post to ingestion API ────────────────────────────────────────────────────

export interface PostResult {
  ok: boolean;
  status?: number;
  error?: string;
}

export async function postInvoice(
  payload: InvoicePayload,
  ingestionKey: string,
  organizationId: string
): Promise<PostResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    // Use the backend proxy instead of direct call
    const res = await fetch(`${API_BASE_URL}/api/invoices/proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload, ingestionKey, organizationId }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) return { ok: true };
    const text = await res.text();
    return { ok: false, status: res.status, error: text.slice(0, 400) || `HTTP ${res.status}` };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Network error" };
  }
}
