import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";
import { getConversationDetail } from "@/lib/data/chat";
import { prisma } from "@/lib/prisma";
import { publishRealtime } from "@/lib/realtime";

const patchSchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await context.params;
  const conversation = await getConversationDetail(id);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid conversation update" }, { status: 400 });
  }

  const existing = await prisma.conversation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const conversation = await prisma.conversation.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  publishRealtime({
    type: "conversation.updated",
    conversationId: conversation.id,
    status: conversation.status,
  });

  return NextResponse.json({
    conversation: await getConversationDetail(id),
  });
}
