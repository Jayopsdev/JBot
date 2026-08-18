import { prisma } from "@/lib/prisma";
import { lastActivityAt, type TimelineEvent } from "@/lib/timeline";

export type CustomerListItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  avatar: string | null;
  status: string;
  conversationCount: number;
  ticketCount: number;
  lastActivity: string;
};

export async function listCustomers(input: {
  query?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}) {
  const pageSize = input.pageSize ?? 8;
  const page = Math.max(1, input.page ?? 1);
  const query = input.query?.trim().toLowerCase() ?? "";

  const customers = await prisma.customer.findMany({
    where:
      input.status && input.status !== "ALL"
        ? { status: input.status as "ACTIVE" | "INACTIVE" }
        : undefined,
    include: {
      _count: { select: { conversations: true, tickets: true } },
      conversations: {
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      tickets: {
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      notes: {
        select: { createdAt: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const mapped: CustomerListItem[] = customers
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      avatar: customer.avatar,
      status: customer.status,
      conversationCount: customer._count.conversations,
      ticketCount: customer._count.tickets,
      lastActivity: lastActivityAt({
        updatedAt: customer.updatedAt,
        conversations: customer.conversations,
        tickets: customer.tickets,
        notes: customer.notes,
      }).toISOString(),
    }))
    .filter((customer) => {
      if (!query) return true;
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        (customer.company ?? "").toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (input.sort === "name") {
        return a.name.localeCompare(b.name);
      }
      return (
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    });

  const total = mapped.length;
  const start = (page - 1) * pageSize;

  return {
    customers: mapped.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCustomerProfile(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
      conversations: {
        orderBy: { updatedAt: "desc" },
        include: {
          assignedAgent: { select: { id: true, name: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      },
      tickets: {
        orderBy: { updatedAt: "desc" },
        include: { assignedAgent: { select: { id: true, name: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 80,
      },
    },
  });

  if (!customer) return null;

  const openTickets = customer.tickets.filter((ticket) => ticket.status === "OPEN").length;
  const resolvedTickets = customer.tickets.filter(
    (ticket) => ticket.status === "RESOLVED",
  ).length;
  const lastContact = lastActivityAt({
    updatedAt: customer.updatedAt,
    conversations: customer.conversations,
    tickets: customer.tickets,
    notes: customer.notes,
  });

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    company: customer.company,
    avatar: customer.avatar,
    status: customer.status,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
    tags: customer.tags.map((item) => ({ id: item.tag.id, name: item.tag.name })),
    notes: customer.notes.map((note) => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      author: note.author,
    })),
    conversations: customer.conversations.map((conversation) => {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      return {
        id: conversation.id,
        status: conversation.status,
        updatedAt: conversation.updatedAt.toISOString(),
        assignedAgent: conversation.assignedAgent,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt.toISOString(),
            }
          : null,
      };
    }),
    tickets: customer.tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      updatedAt: ticket.updatedAt.toISOString(),
      assignedAgent: ticket.assignedAgent,
      conversationId: ticket.conversationId,
    })),
    stats: {
      totalConversations: customer.conversations.length,
      openTickets,
      resolvedTickets,
      lastContact: lastContact.toISOString(),
    },
    timeline: buildTimeline(customer),
  };
}

export type CustomerProfile = NonNullable<Awaited<ReturnType<typeof getCustomerProfile>>>;

function buildTimeline(customer: {
  id: string;
  name: string;
  createdAt: Date;
  conversations: {
    id: string;
    createdAt: Date;
    messages: { id: string; senderType: string; content: string; createdAt: Date }[];
  }[];
  tickets: {
    id: string;
    ticketNumber: string;
    subject: string;
    createdAt: Date;
  }[];
  notes: {
    id: string;
    content: string;
    createdAt: Date;
    author: { name: string };
  }[];
  activities: {
    id: string;
    type: string;
    title: string;
    message: string;
    href: string | null;
    createdAt: Date;
  }[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: `customer-created-${customer.id}`,
      type: "customer.created",
      title: "Customer created",
      message: `${customer.name} was added to the CRM.`,
      createdAt: customer.createdAt.toISOString(),
      href: `/customers/${customer.id}`,
    },
  ];

  for (const conversation of customer.conversations) {
    events.push({
      id: `conversation-started-${conversation.id}`,
      type: "conversation.started",
      title: "Conversation started",
      message: "A support conversation was opened.",
      createdAt: conversation.createdAt.toISOString(),
      href: `/chat?conversation=${conversation.id}`,
    });
    for (const message of conversation.messages) {
      events.push({
        id: `message-${message.id}`,
        type: message.senderType === "CUSTOMER" ? "message.received" : "message.sent",
        title:
          message.senderType === "CUSTOMER" ? "Message received" : "Message sent",
        message: message.content.slice(0, 140),
        createdAt: message.createdAt.toISOString(),
        href: `/chat?conversation=${conversation.id}`,
      });
    }
  }

  for (const ticket of customer.tickets) {
    events.push({
      id: `ticket-created-${ticket.id}`,
      type: "ticket.created",
      title: "Ticket created",
      message: `${ticket.ticketNumber} · ${ticket.subject}`,
      createdAt: ticket.createdAt.toISOString(),
      href: `/tickets/${ticket.id}`,
    });
  }

  for (const note of customer.notes) {
    events.push({
      id: `note-${note.id}`,
      type: "note.added",
      title: "Note added",
      message: `${note.author.name}: ${note.content.slice(0, 140)}`,
      createdAt: note.createdAt.toISOString(),
      href: `/customers/${customer.id}`,
    });
  }

  const derivedTypes = new Set([
    "customer.created",
    "conversation.started",
    "message.received",
    "message.sent",
    "ticket.created",
    "note.added",
  ]);

  for (const activity of customer.activities) {
    if (derivedTypes.has(activity.type)) continue;
    events.push({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      message: activity.message,
      createdAt: activity.createdAt.toISOString(),
      href: activity.href,
    });
  }

  return events.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
