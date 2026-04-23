const firstNames = [
  "Akhil", "Anoop", "Sreejith", "Nithin", "Rahul", "Arjun", "Vivek", "Fahad", "Niyas", "Nikhil",
  "Anjali", "Athira", "Aiswarya", "Keerthana", "Meera", "Diya", "Nimisha", "Fathima", "Aswathy", "Sneha"
];
const lastNames = [
  "Nair", "Menon", "Pillai", "Varma", "Nambiar", "Panicker", "Thomas", "Joseph", "Mathew", "Kurian",
  "Khan", "Ali", "Hameed", "Rajan", "Prasad", "Das", "Sasidharan", "Babu", "Kumar", "Krishnan"
];
const cities = ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kannur", "Kottayam", "Palakkad", "Malappuram"];
const cashiers = ["Akhil", "Nimmy", "Vishnu", "Reshma", "Aneesh", "Shameer", "Aparna"];

const paymentMethods = [
  { value: "UPI", weight: 42 },
  { value: "CASH", weight: 28 },
  { value: "CARD", weight: 20 },
  { value: "NET_BANKING", weight: 4 },
  { value: "WALLET", weight: 4 },
  { value: "OTHER", weight: 2 }
];

const productCatalog = {
  staples: [
    { name: "Nirapara Matta Rice 5kg", unitPrice: 560, unit: "5 kg" },
    { name: "Pavizham Jaya Rice 5kg", unitPrice: 490, unit: "5 kg" },
    { name: "Double Horse Atta 1kg", unitPrice: 62, unit: "1 kg" },
    { name: "Brahmins Rava 1kg", unitPrice: 70, unit: "1 kg" },
    { name: "Ajmi Wheat Flour 1kg", unitPrice: 54, unit: "1 kg" },
    { name: "Toor Dal 1kg", unitPrice: 150, unit: "1 kg" },
    { name: "Moong Dal 1kg", unitPrice: 138, unit: "1 kg" }
  ],
  breakfast: [
    { name: "Modern Bread 400g", unitPrice: 48, unit: "400 g" },
    { name: "Kissan Mixed Fruit Jam 500g", unitPrice: 165, unit: "500 g" },
    { name: "Amul Butter 100g", unitPrice: 64, unit: "100 g" },
    { name: "Milma Toned Milk 1L", unitPrice: 60, unit: "1 L" },
    { name: "Eggs 6pcs", unitPrice: 52, unit: "6 pcs" },
    { name: "Double Horse Puttu Podi 1kg", unitPrice: 84, unit: "1 kg" }
  ],
  teaTime: [
    { name: "Kanan Devan Tea 500g", unitPrice: 278, unit: "500 g" },
    { name: "Brooke Bond Red Label 250g", unitPrice: 152, unit: "250 g" },
    { name: "Sugar 1kg", unitPrice: 48, unit: "1 kg" },
    { name: "Parle-G Biscuit 800g", unitPrice: 88, unit: "800 g" },
    { name: "Ajmi Rusk 400g", unitPrice: 74, unit: "400 g" },
    { name: "Britannia Marie Gold 250g", unitPrice: 42, unit: "250 g" }
  ],
  snacks: [
    { name: "Banana Chips Salted 200g", unitPrice: 95, unit: "200 g" },
    { name: "Jackfruit Chips 150g", unitPrice: 110, unit: "150 g" },
    { name: "Kurkure Masala Munch 90g", unitPrice: 22, unit: "90 g" },
    { name: "Lays Classic 52g", unitPrice: 20, unit: "52 g" },
    { name: "Coca-Cola 750ml", unitPrice: 40, unit: "750 ml" },
    { name: "Sprite 750ml", unitPrice: 40, unit: "750 ml" }
  ],
  masalaOil: [
    { name: "Eastern Meat Masala 100g", unitPrice: 62, unit: "100 g" },
    { name: "Eastern Fish Masala 100g", unitPrice: 58, unit: "100 g" },
    { name: "Aachi Chilli Powder 500g", unitPrice: 160, unit: "500 g" },
    { name: "Coconut Oil 1L", unitPrice: 215, unit: "1 L" },
    { name: "Sunflower Oil 1L", unitPrice: 175, unit: "1 L" },
    { name: "Turmeric Powder 200g", unitPrice: 62, unit: "200 g" }
  ],
  personalCare: [
    { name: "Clinic Plus Shampoo 340ml", unitPrice: 198, unit: "340 ml" },
    { name: "Dove Soap 3x100g", unitPrice: 138, unit: "3 pcs" },
    { name: "Colgate Strong Teeth 200g", unitPrice: 112, unit: "200 g" },
    { name: "Dettol Handwash 200ml", unitPrice: 95, unit: "200 ml" },
    { name: "Surf Excel Easy Wash 1kg", unitPrice: 168, unit: "1 kg" }
  ],
  produce: [
    { name: "Onion 1kg", unitPrice: 46, unit: "1 kg" },
    { name: "Tomato 1kg", unitPrice: 38, unit: "1 kg" },
    { name: "Potato 1kg", unitPrice: 42, unit: "1 kg" },
    { name: "Banana Nendran 1kg", unitPrice: 64, unit: "1 kg" },
    { name: "Green Chilli 250g", unitPrice: 22, unit: "250 g" },
    { name: "Coriander Leaves 1 bunch", unitPrice: 14, unit: "1 bunch" }
  ]
};

const basketPatterns = [
  {
    name: "bread-jam-breakfast",
    weight: 12,
    groups: ["breakfast"],
    forcedItems: ["Modern Bread 400g", "Kissan Mixed Fruit Jam 500g"]
  },
  {
    name: "tea-biscuit",
    weight: 14,
    groups: ["teaTime"],
    forcedItems: ["Kanan Devan Tea 500g", "Sugar 1kg"]
  },
  {
    name: "monthly-staples",
    weight: 19,
    groups: ["staples", "masalaOil", "produce"]
  },
  {
    name: "snack-run",
    weight: 11,
    groups: ["snacks", "teaTime"]
  },
  {
    name: "curry-combo",
    weight: 15,
    groups: ["masalaOil", "produce", "staples"],
    forcedItems: ["Eastern Meat Masala 100g", "Onion 1kg", "Tomato 1kg"]
  },
  {
    name: "family-basket",
    weight: 17,
    groups: ["staples", "breakfast", "teaTime", "produce", "masalaOil"]
  },
  {
    name: "personal-care-topup",
    weight: 12,
    groups: ["personalCare", "staples"]
  }
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function weightedPick(entries) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let point = Math.random() * total;
  for (const entry of entries) {
    point -= entry.weight;
    if (point <= 0) return entry;
  }
  return entries[0];
}

let emailBases = [];
let emailCursorByBase = new Map();
let emailBaseCursor = 0;
let ingestionKey = "";
let organizationId = "";
let endpoint = "";
let invoiceIdPrefix = "REAL-KL";

export function initializeSeederContext({
  ingestionKey: key,
  organizationId: orgId,
  endpoint: ep,
  emailBases: bases,
  invoiceIdPrefix: idPrefix
}) {
  ingestionKey = key;
  organizationId = orgId;
  endpoint = ep;
  emailBases = bases;
  if (idPrefix != null && String(idPrefix).trim()) {
    invoiceIdPrefix = String(idPrefix).trim();
  }
  emailCursorByBase = new Map(emailBases.map((email) => [email, 0]));
  emailBaseCursor = 0;
}

function nextSeedEmail() {
  const baseEmail = emailBases[emailBaseCursor % emailBases.length];
  emailBaseCursor += 1;

  const cursor = emailCursorByBase.get(baseEmail) ?? 0;
  emailCursorByBase.set(baseEmail, cursor + 1);

  if (cursor === 0) return baseEmail;

  const atIndex = baseEmail.lastIndexOf("@");
  if (atIndex === -1) return `${baseEmail}+customer${cursor}`;
  const local = baseEmail.slice(0, atIndex);
  const domain = baseEmail.slice(atIndex + 1);
  return `${local}+customer${cursor}@${domain}`;
}

function randomCustomer() {
  const first = randomPick(firstNames);
  const last = randomPick(lastNames);
  const hasPhone = Math.random() < 0.9;
  const city = randomPick(cities);
  const pincode = `${randomInt(670000, 695999)}`;
  const hasAddress = Math.random() < 0.7;
  return {
    customerId: crypto.randomUUID(),
    externalCustomerId: null,
    name: `${first} ${last}`,
    email: nextSeedEmail(),
    phone: hasPhone ? `+91${randomInt(6000000000, 9999999999)}` : null,
    city,
    state: "Kerala",
    country: "India",
    pincode,
    address: hasAddress ? `${randomInt(1, 250)}, Market Road, ${city} - ${pincode}` : null
  };
}

function randomInvoiceDate() {
  return new Date().toISOString();
}

function makeExternalInvoiceId(index) {
  const serial = String(index + 1).padStart(2, "0");
  const unique = `${Date.now()}${randomInt(100, 999)}`;
  return `Inv_${serial}_${unique}`;
}

function pickProductsForPattern(pattern) {
  const selected = new Map();
  for (const group of pattern.groups) {
    const items = productCatalog[group];
    const take = randomInt(2, Math.min(6, items.length));
    for (let i = 0; i < take; i += 1) {
      const item = randomPick(items);
      selected.set(item.name, item);
    }
  }

  for (const forcedName of pattern.forcedItems ?? []) {
    for (const group of Object.values(productCatalog)) {
      const found = group.find((item) => item.name === forcedName);
      if (found) selected.set(found.name, found);
    }
  }

  return [...selected.values()];
}

function inferGstRate(productName) {
  const name = productName.toLowerCase();
  if (
    name.includes("onion") ||
    name.includes("tomato") ||
    name.includes("potato") ||
    name.includes("banana") ||
    name.includes("coriander") ||
    name.includes("chilli")
  ) {
    return 0;
  }
  if (
    name.includes("rice") ||
    name.includes("atta") ||
    name.includes("dal") ||
    name.includes("rava") ||
    name.includes("flour")
  ) {
    return 0.05;
  }
  if (
    name.includes("bread") ||
    name.includes("biscuit") ||
    name.includes("chips") ||
    name.includes("jam") ||
    name.includes("tea") ||
    name.includes("coffee")
  ) {
    return 0.12;
  }
  if (
    name.includes("shampoo") ||
    name.includes("soap") ||
    name.includes("handwash") ||
    name.includes("detergent")
  ) {
    return 0.18;
  }
  return 0.12;
}

function inferDiscountRate(patternName, productName) {
  const name = productName.toLowerCase();
  if (patternName === "bread-jam-breakfast" && (name.includes("bread") || name.includes("jam"))) {
    return 0.03;
  }
  if (patternName === "tea-biscuit" && (name.includes("tea") || name.includes("biscuit"))) {
    return 0.04;
  }
  if (patternName === "family-basket" && (name.includes("rice") || name.includes("oil"))) {
    return 0.02;
  }
  return 0;
}

export function buildInvoicePayload(index) {
  const pattern = weightedPick(basketPatterns);
  const customer = randomCustomer();
  const paymentMethod = weightedPick(paymentMethods).value;
  const pickedProducts = pickProductsForPattern(pattern);

  const items = pickedProducts.map((p) => {
    const quantity = randomInt(1, p.unit.includes("kg") || p.unit.includes("L") ? 2 : 4);
    const lineBase = p.unitPrice * quantity;
    const discountRate = inferDiscountRate(pattern.name, p.name);
    const gstRate = inferGstRate(p.name);
    const discountAmount = Number((lineBase * discountRate).toFixed(2));
    const taxAmount = Number(((lineBase - discountAmount) * gstRate).toFixed(2));
    const totalPrice = Number((lineBase - discountAmount + taxAmount).toFixed(2));
    return {
      productName: p.name,
      quantity,
      unitPrice: p.unitPrice,
      totalPrice,
      unit: p.unit,
      externalProductId: `REAL-${p.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24).toUpperCase()}`,
      taxAmount: taxAmount || undefined,
      discountAmount: discountAmount || undefined
    };
  });

  const subtotalAmount = Number(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2));
  const discountAmount = Number(items.reduce((sum, item) => sum + (item.discountAmount ?? 0), 0).toFixed(2));
  const totalTax = Number(items.reduce((sum, item) => sum + (item.taxAmount ?? 0), 0).toFixed(2));
  const totalAmount = Number((subtotalAmount - discountAmount + totalTax).toFixed(2));

  return {
    organizationId,
    externalInvoiceId: makeExternalInvoiceId(index),
    invoiceDate: randomInvoiceDate(),
    totalAmount,
    customerId: null,
    externalCustomerId: null,
    subtotalAmount,
    discountAmount,
    totalTax,
    status: "PAID",
    currency: "INR",
    paymentMethod,
    invoiceUrl: null,
    cashierName: randomPick(cashiers),
    notes: `Seed pattern: ${pattern.name} | market_price_locked=true`,
    externalTerminalId: "KL-POS-01",
    customer,
    items
  };
}

function truncateErrorBody(text, maxLen = 600) {
  const t = String(text ?? "").trim();
  if (!t) return "";
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

export async function postInvoice(payload, maxAttempts = 5) {
  let lastStatus;
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let timeout;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ingestion-key": ingestionKey,
          "x-organization-id": organizationId
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) return { ok: true };

      const text = await res.text();
      const snippet = truncateErrorBody(text) || `HTTP ${res.status}`;
      lastStatus = res.status;
      lastError = snippet;

      if (res.status >= 500 || res.status === 429) {
        const wait = Math.min(800 * 2 ** (attempt - 1), 8000) + randomInt(0, 400);
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }

      return { ok: false, status: res.status, error: snippet };
    } catch (error) {
      if (timeout) clearTimeout(timeout);
      const msg = error instanceof Error ? error.message : "Network error";
      lastStatus = undefined;
      lastError = msg;
      if (attempt < maxAttempts) {
        const wait = Math.min(800 * 2 ** (attempt - 1), 8000) + randomInt(0, 400);
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }
      return { ok: false, error: msg };
    }
  }

  return {
    ok: false,
    status: lastStatus,
    error: lastError || "Failed after retries"
  };
}

export async function runSeeding(totalCount, options) {
  const label = options?.label ?? "real-world invoice seeding";
  console.log(`Starting ${label}: ${totalCount} invoices`);
  const concurrency = options.concurrency;
  const maxAttempts = options.maxAttempts;
  let cursor = 0;
  let success = 0;
  let failed = 0;
  const failures = [];
  const startedAt = Date.now();

  async function worker() {
    while (cursor < totalCount) {
      const index = cursor;
      cursor += 1;
      const payload = buildInvoicePayload(index);
      const result = await postInvoice(payload, maxAttempts);

      if (result.ok) {
        success += 1;
        if (success % 100 === 0 || success === totalCount) {
          console.log(`Invoices seeded: ${success}/${totalCount}`);
        }
      } else {
        failed += 1;
        if (failures.length < 20) {
          failures.push({
            invoice: payload.externalInvoiceId,
            status: result.status ?? "n/a",
            error: result.error
          });
        }
      }

      const done = success + failed;
      if (done % 250 === 0 || done === totalCount) {
        console.log(`Progress: ${done}/${totalCount} (success=${success}, failed=${failed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
  console.log(`Total invoices seeded successfully: ${success}`);
  console.log(`Done in ${elapsedSec}s. success=${success}, failed=${failed}`);
  if (failures.length) {
    console.log("Sample failures:");
    for (const f of failures) {
      console.log(`- ${f.invoice} [${f.status}] ${f.error}`);
    }
  }
  const failureSamples = failures.slice(0, 10).map((f) => ({
    invoice: f.invoice,
    status: f.status,
    error: f.error
  }));
  console.log(
    `SEED_RESULT_JSON ${JSON.stringify({
      success,
      failed,
      elapsedSec,
      endpoint,
      failures: failureSamples
    })}`
  );
}
