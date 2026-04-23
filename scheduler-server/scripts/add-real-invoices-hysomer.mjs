import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createCommand } from "commander";
import { initializeSeederContext, runSeeding } from "./invoice-seed-hysomer-shared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DEFAULT_INGESTION_ENDPOINT = "https://hysomer-ingestion-server.onrender.com/api/v1/invoices";

const program = createCommand().name("add-real-invoices-hysomer");

program
  .description("Add more real-world invoices (incremental batch) to Hysomer ingestion API")
  .option("-c, --count <number>", "Number of additional invoices to post", "500")
  .option("-k, --ingestion-key <key>", "Ingestion API key")
  .option("-o, --organization-id <id>", "Organization ID")
  .option("-e, --endpoint <url>", "Target invoices ingestion endpoint (else HYSOMER_ENDPOINT, else hosted URL)")
  .option(
    "--email-bases <emails>",
    "Comma-separated base emails for generated customers (else HYSOMER_EMAIL_BASES)"
  )
  .option(
    "--invoice-prefix <prefix>",
    "Prefix for externalInvoiceId so add batches are easy to spot in logs",
    "REAL-KL-ADD"
  )
  .option("--concurrency <number>", "Parallel workers for uploading invoices", "8")
  .option("--max-attempts <number>", "Max retry attempts per invoice request", "5");

program.action(async (options) => {
  const count = Number(options.count);
  if (!Number.isInteger(count) || count < 1) {
    console.error("Invalid --count. Example: --count=500");
    process.exit(1);
  }

  const ingestionKey = options.ingestionKey?.trim() || process.env.HYSOMER_INGESTION_KEY || "";
  if (!ingestionKey) {
    console.error("Missing ingestion key. Pass --ingestion-key=... or set HYSOMER_INGESTION_KEY");
    process.exit(1);
  }

  const organizationId = options.organizationId?.trim() || process.env.HYSOMER_ORGANIZATION_ID || "";
  if (!organizationId) {
    console.error("Missing organization ID. Pass --organization-id=... or set HYSOMER_ORGANIZATION_ID");
    process.exit(1);
  }

  const endpoint =
    options.endpoint?.trim() || process.env.HYSOMER_ENDPOINT?.trim() || DEFAULT_INGESTION_ENDPOINT;

  const emailBases = String(options.emailBases || process.env.HYSOMER_EMAIL_BASES || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!emailBases.length) {
    console.error("Missing email bases. Pass --email-bases=a@gmail.com,b@gmail.com");
    process.exit(1);
  }

  const concurrency = Number(options.concurrency);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 100) {
    console.error("Invalid --concurrency. Use an integer between 1 and 100.");
    process.exit(1);
  }

  const maxAttempts = Number(options.maxAttempts);
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) {
    console.error("Invalid --max-attempts. Use an integer between 1 and 20.");
    process.exit(1);
  }

  initializeSeederContext({
    ingestionKey,
    organizationId,
    endpoint,
    emailBases,
    invoiceIdPrefix: options.invoicePrefix?.trim() || "REAL-KL-ADD"
  });

  try {
    await runSeeding(count, {
      concurrency,
      maxAttempts,
      label: "incremental invoice addition"
    });
  } catch (error) {
    console.error("Addition run crashed:", error);
    process.exit(1);
  }
});

await program.parseAsync(process.argv);
