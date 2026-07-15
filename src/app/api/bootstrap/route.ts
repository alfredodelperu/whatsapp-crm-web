import { NextResponse } from "next/server";
import { getBootstrapData } from "@/lib/crm/bootstrap";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const conversationIdParam = url.searchParams.get("conversationId");
  const conversationId = conversationIdParam ? Number(conversationIdParam) : undefined;
  const data = await getBootstrapData(conversationId);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
