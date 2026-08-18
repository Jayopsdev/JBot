import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { publishRealtime } from "@/lib/realtime";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await context.params;
  publishRealtime({
    type: "typing",
    conversationId: id,
    senderType: "AGENT",
  });

  return NextResponse.json({ ok: true });
}
