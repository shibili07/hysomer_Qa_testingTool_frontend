import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(body);
    const res = await fetch("http://localhost:4002/api/v1/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
