import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConversationDetail } from "@/lib/data/chat";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const customerId = new URL(request.url).searchParams.get("customerId");

  if (!customerId) {
    return NextResponse.json({ error: "Missing customer" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: { customerId: true },
  });

  if (!conversation || conversation.customerId !== customerId) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const detail = await getConversationDetail(id);
  return NextResponse.json({ conversation: detail });
}
