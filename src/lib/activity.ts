import { prisma } from "@/lib/prisma";

export async function recordActivity(input: {
  customerId: string;
  actorId?: string | null;
  type: string;
  title: string;
  message: string;
  href?: string | null;
  ticketId?: string | null;
  conversationId?: string | null;
}) {
  return prisma.activity.create({
    data: {
      customerId: input.customerId,
      actorId: input.actorId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      ticketId: input.ticketId ?? null,
      conversationId: input.conversationId ?? null,
    },
  });
}
