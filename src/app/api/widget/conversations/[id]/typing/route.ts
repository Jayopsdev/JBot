import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { publishRealtime } from "@/lib/realtime";

const typingSchema = z.object({
  customerId: z.string().min(1),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const parsed = typingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid typing payload" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: { customerId: true },
  });

  if (!conversation || conversation.customerId !== parsed.data.customerId) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  publishRealtime({
    type: "typing",
    conversationId: id,
    senderType: "CUSTOMER",
  });

  return NextResponse.json({ ok: true });
}
