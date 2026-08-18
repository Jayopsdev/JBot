import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createMessage,
  getConversationSummary,
} from "@/lib/data/chat";
import { publishRealtime } from "@/lib/realtime";
import { notifyUsers } from "@/lib/notifications";

const messageSchema = z.object({
  customerId: z.string().min(1),
  content: z.string().trim().min(1, "Message cannot be empty").max(4000),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const parsed = messageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message" },
      { status: 400 },
    );
  }

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation || conversation.customerId !== parsed.data.customerId) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (conversation.status === "CLOSED") {
    await prisma.conversation.update({
      where: { id },
      data: { status: "OPEN" },
    });
  }

  const message = await createMessage({
    conversationId: id,
    senderType: "CUSTOMER",
    senderId: parsed.data.customerId,
    content: parsed.data.content,
    read: false,
  });

  const summary = await getConversationSummary(id);
  publishRealtime({ type: "message.created", conversationId: id, message });
  if (summary) {
    publishRealtime({ type: "conversation.upserted", conversation: summary });
  }

  const agents = await prisma.user.findMany({
    where: conversation.assignedAgentId
      ? { id: conversation.assignedAgentId }
      : {},
    select: { id: true },
  });

  await notifyUsers({
    userIds: agents.map((agent) => agent.id),
    type: "conversation",
    title: "New customer message",
    message: parsed.data.content.slice(0, 140),
    href: `/chat?conversation=${id}`,
  });

  return NextResponse.json({ message });
}
