import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getConversationDetail,
  getConversationSummary,
} from "@/lib/data/chat";
import { publishRealtime } from "@/lib/realtime";
import { notifyUsers, allAgentIds } from "@/lib/notifications";

const startSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.email("Enter a valid email"),
});

export async function POST(request: Request) {
  const parsed = startSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid details" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const name = parsed.data.name;

  const customer = await prisma.customer.findUnique({ where: { email } });
  const record =
    customer ??
    (await prisma.customer.create({
      data: {
        name,
        email,
        status: "ACTIVE",
      },
    }));

  let conversation = await prisma.conversation.findFirst({
    where: {
      customerId: record.id,
      status: "OPEN",
    },
    orderBy: { updatedAt: "desc" },
  });

  let created = false;
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        customerId: record.id,
        status: "OPEN",
      },
    });
    created = true;
  }

  const [detail, summary] = await Promise.all([
    getConversationDetail(conversation.id),
    getConversationSummary(conversation.id),
  ]);

  if (created && summary) {
    publishRealtime({ type: "conversation.upserted", conversation: summary });

    await notifyUsers({
      userIds: await allAgentIds(),
      type: "conversation",
      title: `New conversation from ${record.name}`,
      message: `${record.email} started a chat from the website widget.`,
      href: `/chat?conversation=${conversation.id}`,
    });
  }

  return NextResponse.json({
    customer: {
      id: record.id,
      name: record.name,
      email: record.email,
    },
    conversation: detail,
  });
}
