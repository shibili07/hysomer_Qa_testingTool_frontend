import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import cron from "node-cron";
import { initializeSeederContext, runSeeding } from "./scripts/invoice-seed-hysomer-shared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

function stripQuotes(value) {
  if (value == null) return "";
  const s = String(value).trim();
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
    return s.slice(1, -1).trim();
  }
  return s;
}

const ingestionKey = process.env.HYSOMER_INGESTION_KEY?.trim() || "";
const organizationId = process.env.HYSOMER_ORGANIZATION_ID?.trim() || "";
const endpoint =
  stripQuotes(process.env.HYSOMER_ENDPOINT) ||
  "https://hysomer-ingestion-server.onrender.com/api/v1/invoices";
const emailBases = String(process.env.HYSOMER_EMAIL_BASES || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const seedCount = Number(process.env.SEED_COUNT || "500");
const cronExpr = stripQuotes(process.env.SEED_CRON) || "0 22 * * *";
const tz = stripQuotes(process.env.SEED_TZ) || "Asia/Kolkata";
const concurrency = Number(process.env.SEED_CONCURRENCY || "8");
const maxAttempts = Number(process.env.SEED_MAX_ATTEMPTS || "5");
const invoicePrefix = stripQuotes(process.env.SEED_INVOICE_PREFIX) || "CRON-SEED";

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!ingestionKey) fail("Missing HYSOMER_INGESTION_KEY in .env");
if (!organizationId) fail("Missing HYSOMER_ORGANIZATION_ID in .env");
if (!emailBases.length) fail("Missing HYSOMER_EMAIL_BASES in .env (comma-separated)");
if (!Number.isInteger(seedCount) || seedCount < 1) fail("Invalid SEED_COUNT");
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 100) fail("Invalid SEED_CONCURRENCY");
if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) fail("Invalid SEED_MAX_ATTEMPTS");
if (!cron.validate(cronExpr)) fail(`Invalid SEED_CRON expression: ${cronExpr}`);

initializeSeederContext({
  ingestionKey,
  organizationId,
  endpoint,
  emailBases,
  invoiceIdPrefix: invoicePrefix
});

console.log(
  `[scheduler-server] Cron: "${cronExpr}" (${tz}) · ${seedCount} invoices/run · POST ${endpoint}`
);

let running = false;

cron.schedule(
  cronExpr,
  async () => {
    if (running) {
      console.warn("[scheduler-server] Previous run still in progress; skipping this tick.");
      return;
    }
    running = true;
    const started = new Date().toISOString();
    console.log(`[scheduler-server] Seed run started at ${started}`);
    try {
      await runSeeding(seedCount, {
        concurrency,
        maxAttempts,
        label: "scheduled cron seed"
      });
      console.log(`[scheduler-server] Seed run finished at ${new Date().toISOString()}`);
    } catch (error) {
      console.error("[scheduler-server] Seed run failed:", error);
    } finally {
      running = false;
    }
  },
  { timezone: tz }
);
