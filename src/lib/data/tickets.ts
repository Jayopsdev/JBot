import { prisma } from "@/lib/prisma";

export type TicketListItem = {
  id: string;
  ticketNumber: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; email: string };
  assignedAgent: { id: string; name: string } | null;
};

export type TicketDetail = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  conversationId: string | null;
  assignedAgent: { id: string; name: string; email: string } | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    avatar: string | null;
    status: string;
    tags: { id: string; name: string }[];
    notes: {
      id: string;
      content: string;
      createdAt: string;
      author: { id: string; name: string };
    }[];
  };
  conversation: {
    id: string;
    status: string;
    updatedAt: string;
    messages: { id: string; content: string; senderType: string; createdAt: string }[];
  } | null;
  activities: {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    href: string | null;
  }[];
};

export async function listTickets(): Promise<TicketListItem[]> {
  const tickets = await prisma.ticket.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      assignedAgent: { select: { id: true, name: true } },
    },
  });

  return tickets.map((ticket) => ({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    customer: ticket.customer,
    assignedAgent: ticket.assignedAgent,
  }));
}

export async function getTicketDetail(id: string): Promise<TicketDetail | null> {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          tags: { include: { tag: true } },
          notes: {
            orderBy: { createdAt: "desc" },
            take: 12,
            include: { author: { select: { id: true, name: true } } },
          },
        },
      },
      assignedAgent: { select: { id: true, name: true, email: true } },
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 8,
          },
        },
      },
    },
  });

  if (!ticket) return null;

  const activities = await prisma.activity.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    conversationId: ticket.conversationId,
    assignedAgent: ticket.assignedAgent,
    customer: {
      id: ticket.customer.id,
      name: ticket.customer.name,
      email: ticket.customer.email,
      phone: ticket.customer.phone,
      company: ticket.customer.company,
      avatar: ticket.customer.avatar,
      status: ticket.customer.status,
      tags: ticket.customer.tags.map((item) => ({
        id: item.tag.id,
        name: item.tag.name,
      })),
      notes: ticket.customer.notes.map((note) => ({
        id: note.id,
        content: note.content,
        createdAt: note.createdAt.toISOString(),
        author: note.author,
      })),
    },
    conversation: ticket.conversation
      ? {
          id: ticket.conversation.id,
          status: ticket.conversation.status,
          updatedAt: ticket.conversation.updatedAt.toISOString(),
          messages: ticket.conversation.messages.map((message) => ({
            id: message.id,
            content: message.content,
            senderType: message.senderType,
            createdAt: message.createdAt.toISOString(),
          })),
        }
      : null,
    activities: [
      {
        id: `ticket-created-${ticket.id}`,
        title: "Ticket created",
        message: `${ticket.ticketNumber} · ${ticket.subject}`,
        createdAt: ticket.createdAt.toISOString(),
        href: `/tickets/${ticket.id}`,
      },
      ...activities
        .filter((activity) => activity.type !== "ticket.created")
        .map((activity) => ({
        id: activity.id,
        title: activity.title,
        message: activity.message,
        createdAt: activity.createdAt.toISOString(),
        href: activity.href,
      })),
    ].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  };
}

export async function listAgents() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, status: true },
  });
}
