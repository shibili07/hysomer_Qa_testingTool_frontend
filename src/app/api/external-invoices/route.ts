import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const body = rawBody && typeof rawBody === "object" ? rawBody : {};
    const ingestionKeyFromHeader = req.headers.get("x-ingestion-key")?.trim() || "";
    const ingestionKey =
      ingestionKeyFromHeader ||
      (typeof (body as { ingestionKey?: unknown }).ingestionKey === "string"
        ? (body as { ingestionKey?: string }).ingestionKey?.trim() || ""
        : "");

    const organizationIdFromHeader = req.headers.get("x-organization-id")?.trim() || "";
    const organizationId =
      organizationIdFromHeader ||
      process.env.HYSOMER_ORGANIZATION_ID?.trim() ||
      "ce6be37d-4076-4bb0-b228-0a4358b4d927";

    const externalPayload = { ...(body as Record<string, unknown>) };
    delete externalPayload.ingestionKey;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (ingestionKey) {
      headers["x-ingestion-key"] = ingestionKey;
    }
    if (organizationId) {
      headers["x-organization-id"] = organizationId;
    }

    const res = await fetch("https://hysomer-ingestion-server.onrender.com/api/v1/invoices", {
      method: "POST",
      headers,
      body: JSON.stringify(externalPayload),
      cache: "no-store"
    });

    const text = await res.text();

    if (!res.ok) {
      return new NextResponse(text || "External API request failed", { status: res.status });
    }

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      return NextResponse.json({ message: text });
    }
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
