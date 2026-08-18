import { NextResponse } from "next/server";
import { z } from "zod";
import { TicketPriority } from "@prisma/client";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { nextTicketNumber } from "@/lib/tickets";
import { recordActivity } from "@/lib/activity";
import { notifyUsers } from "@/lib/notifications";
import { listTickets } from "@/lib/data/tickets";

const ticketSchema = z.object({
  customerId: z.string().min(1),
  conversationId: z.string().min(1).optional().nullable(),
  subject: z.string().trim().min(1, "Subject is required").max(160),
  description: z.string().trim().min(1, "Description is required").max(4000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assignedAgentId: z.string().min(1).optional().nullable(),
});

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;
  const tickets = await listTickets();
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response || !user) return response;

  const parsed = ticketSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid ticket" },
      { status: 400 },
    );
  }

  const {
    customerId,
    conversationId,
    subject,
    description,
    priority,
    assignedAgentId,
  } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  if (conversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation || conversation.customerId !== customerId) {
      return NextResponse.json(
        { error: "Conversation does not belong to this customer" },
        { status: 400 },
      );
    }
  }

  const duplicate = await prisma.ticket.findFirst({
    where: {
      customerId,
      subject,
      conversationId: conversationId ?? undefined,
      createdAt: { gte: new Date(Date.now() - 20_000) },
    },
  });

  if (duplicate) {
    return NextResponse.json({ ticket: duplicate, reused: true });
  }

  const assigneeId = assignedAgentId || user.id;
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: await nextTicketNumber(),
      customerId,
      conversationId: conversationId || null,
      assignedAgentId: assigneeId,
      subject,
      description,
      priority: priority as TicketPriority,
      status: "OPEN",
    },
  });

  await recordActivity({
    customerId,
    actorId: user.id,
    type: "ticket.created",
    title: "Ticket created",
    message: `${ticket.ticketNumber} · ${ticket.subject}`,
    href: `/tickets/${ticket.id}`,
    ticketId: ticket.id,
    conversationId: ticket.conversationId,
  });

  await notifyUsers({
    userIds: [...new Set([assigneeId, user.id])],
    type: "ticket",
    title: "New ticket",
    message: `${ticket.ticketNumber} ${ticket.subject} was created.`,
    href: `/tickets/${ticket.id}`,
  });

  if (assigneeId !== user.id) {
    await notifyUsers({
      userIds: [assigneeId],
      type: "ticket",
      title: "Ticket assigned",
      message: `${ticket.ticketNumber} was assigned to you.`,
      href: `/tickets/${ticket.id}`,
    });
  }

  return NextResponse.json({ ticket, reused: false });
}
