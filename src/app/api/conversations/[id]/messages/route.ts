import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";
import {
  createMessage,
  getConversationSummary,
} from "@/lib/data/chat";
import { prisma } from "@/lib/prisma";
import { publishRealtime } from "@/lib/realtime";

const messageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(4000),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (response || !user) return response;

  const { id } = await context.params;
  const parsed = messageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message" },
      { status: 400 },
    );
  }

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (!conversation.assignedAgentId) {
    await prisma.conversation.update({
      where: { id },
      data: { assignedAgentId: user.id, status: "OPEN" },
    });
  } else if (conversation.status === "CLOSED") {
    await prisma.conversation.update({
      where: { id },
      data: { status: "OPEN" },
    });
  }

  const message = await createMessage({
    conversationId: id,
    senderType: "AGENT",
    senderId: user.id,
    content: parsed.data.content,
    read: false,
  });

  const summary = await getConversationSummary(id);
  publishRealtime({ type: "message.created", conversationId: id, message });
  if (summary) {
    publishRealtime({ type: "conversation.upserted", conversation: summary });
  }

  return NextResponse.json({ message });
}
