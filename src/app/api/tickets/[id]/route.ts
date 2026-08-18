import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getTicketDetail } from "@/lib/data/tickets";
import { prettyLabel } from "@/lib/pretty";
import { recordActivity } from "@/lib/activity";
import { notifyUsers } from "@/lib/notifications";

const patchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "PENDING", "RESOLVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedAgentId: z.string().min(1).nullable().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await context.params;
  const ticket = await getTicketDetail(id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  return NextResponse.json({ ticket });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (response || !user) return response;

  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid ticket update" }, { status: 400 });
  }

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      status: parsed.data.status,
      priority: parsed.data.priority,
      assignedAgentId:
        parsed.data.assignedAgentId === undefined
          ? undefined
          : parsed.data.assignedAgentId,
    },
  });

  if (parsed.data.status && parsed.data.status !== existing.status) {
    await recordActivity({
      customerId: ticket.customerId,
      actorId: user.id,
      type: "ticket.status_changed",
      title: "Ticket status changed",
      message: `Ticket status changed to ${prettyLabel(parsed.data.status)}`,
      href: `/tickets/${ticket.id}`,
      ticketId: ticket.id,
      conversationId: ticket.conversationId,
    });
    await notifyUsers({
      userIds: [ticket.assignedAgentId, user.id].filter(Boolean) as string[],
      type: "ticket",
      title: "Ticket status update",
      message: `${ticket.ticketNumber} is now ${prettyLabel(parsed.data.status)}.`,
      href: `/tickets/${ticket.id}`,
    });
  }

  if (
    parsed.data.assignedAgentId &&
    parsed.data.assignedAgentId !== existing.assignedAgentId
  ) {
    await recordActivity({
      customerId: ticket.customerId,
      actorId: user.id,
      type: "ticket.assigned",
      title: "Ticket assigned",
      message: `${ticket.ticketNumber} was reassigned.`,
      href: `/tickets/${ticket.id}`,
      ticketId: ticket.id,
    });
    await notifyUsers({
      userIds: [parsed.data.assignedAgentId],
      type: "ticket",
      title: "Ticket assigned",
      message: `${ticket.ticketNumber} ${ticket.subject} was assigned to you.`,
      href: `/tickets/${ticket.id}`,
    });
  }

  const detail = await getTicketDetail(id);
  return NextResponse.json({ ticket: detail });
}
