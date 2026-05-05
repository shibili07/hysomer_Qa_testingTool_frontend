import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage } from "node:http";
import { defineConfig, loadEnv, type Plugin, type Connect } from "vite";
import react from "@vitejs/plugin-react";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/**
 * Replaces the former Next.js `app/api/external-invoices/route.ts` proxy.
 * Active for `vite dev` and `vite preview`. Pure static hosting still needs a backend proxy for this path.
 */
function ingestionProxyPlugin(getOrgId: () => string): Plugin {
  const mount = (middlewares: Connect.Server) => {
    middlewares.use(async (req, res, next) => {
      const pathname = req.url?.split("?")[0] ?? "";
      if (pathname !== "/api/external-invoices") {
        return next();
      }
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.end("Method Not Allowed");
        return;
      }

      const orgIdDefault = getOrgId();

      try {
        const rawText = await readBody(req);
        let rawBody: unknown = {};
        try {
          rawBody = rawText ? JSON.parse(rawText) : {};
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ message: "Invalid JSON body" }));
          return;
        }

        const body = rawBody && typeof rawBody === "object" ? (rawBody as Record<string, unknown>) : {};
        const ingestionKeyFromHeader =
          (typeof req.headers["x-ingestion-key"] === "string" ? req.headers["x-ingestion-key"] : "")?.trim() ||
          "";
        const ingestionKey =
          ingestionKeyFromHeader ||
          (typeof body.ingestionKey === "string" ? body.ingestionKey.trim() : "");

        const organizationIdFromHeader =
          (typeof req.headers["x-organization-id"] === "string" ? req.headers["x-organization-id"] : "")?.trim() ||
          "";
        const organizationId = organizationIdFromHeader || orgIdDefault;

        const externalPayload = { ...body };
        delete externalPayload.ingestionKey;

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (ingestionKey) {
          headers["x-ingestion-key"] = ingestionKey;
        }
        if (organizationId) {
          headers["x-organization-id"] = organizationId;
        }

        const upstream = await fetch("https://hysomer-ingestion-server.onrender.com/api/v1/invoices", {
          method: "POST",
          headers,
          body: JSON.stringify(externalPayload),
          cache: "no-store"
        });

        const text = await upstream.text();

        if (!upstream.ok) {
          res.statusCode = upstream.status;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(text || "External API request failed");
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        try {
          JSON.parse(text);
          res.end(text);
        } catch {
          res.end(JSON.stringify({ message: text }));
        }
      } catch (error) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(
          JSON.stringify({
            message: error instanceof Error ? error.message : "Unexpected error"
          })
        );
      }
    });
  };

  return {
    name: "ingestion-proxy",
    configureServer(server) {
      mount(server.middlewares);
    },
    configurePreviewServer(server) {
      mount(server.middlewares);
    }
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const orgId =
    env.HYSOMER_ORGANIZATION_ID?.trim() || "ce6be37d-4076-4bb0-b228-0a4358b4d927";

  return {
    plugins: [react(), ingestionProxyPlugin(() => orgId)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src")
      }
    },
    server: {
      port: 3000
    }
  };
});
