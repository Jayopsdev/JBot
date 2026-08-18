import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { publishRealtime } from "@/lib/realtime";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await context.params;
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderType: "CUSTOMER",
      read: false,
    },
    data: { read: true },
  });

  publishRealtime({ type: "conversation.read", conversationId: id });

  return NextResponse.json({ ok: true });
}
