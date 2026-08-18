import type {
  ConversationDetail,
  ConversationSummary,
} from "@/lib/chat-types";
import type { TimelineEvent } from "@/lib/timeline";
import type {
  AppActivity,
  AppCustomer,
  AppDatabase,
  AppMessage,
} from "@/lib/local-db/types";

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

function lastActivityAt(input: {
  updatedAt: string;
  conversations: { updatedAt: string }[];
  tickets: { updatedAt: string }[];
  notes: { createdAt: string; updatedAt?: string }[];
}) {
  const dates = [
    input.updatedAt,
    ...input.conversations.map((item) => item.updatedAt),
    ...input.tickets.map((item) => item.updatedAt),
    ...input.notes.map((item) => item.updatedAt ?? item.createdAt),
  ];
  return dates.reduce((latest, date) =>
    new Date(date).getTime() > new Date(latest).getTime() ? date : latest,
  );
}

function userName(db: AppDatabase, id: string | null) {
  if (!id) return null;
  const user = db.users.find((item) => item.id === id);
  return user ? { id: user.id, name: user.name } : null;
}

export function isCustomerOnline(db: AppDatabase, customerId: string) {
  return db.onlineCustomerIds.includes(customerId);
}

export function listAgents(db: AppDatabase) {
  return [...db.users]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
    }));
}

export function listConversations(db: AppDatabase): ConversationSummary[] {
  return [...db.conversations]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .map((conversation) => toConversationSummary(db, conversation.id))
    .filter((item): item is ConversationSummary => Boolean(item));
}

export function toConversationSummary(
  db: AppDatabase,
  conversationId: string,
): ConversationSummary | null {
  const conversation = db.conversations.find((item) => item.id === conversationId);
  const customer = conversation
    ? db.customers.find((item) => item.id === conversation.customerId)
    : null;
  if (!conversation || !customer) return null;

  const messages = db.messages
    .filter((item) => item.conversationId === conversation.id)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  const lastMessage = messages[messages.length - 1];
  const unreadCount = messages.filter(
    (item) => item.senderType === "CUSTOMER" && !item.read,
  ).length;

  return {
    id: conversation.id,
    status: conversation.status,
    updatedAt: conversation.updatedAt,
    unreadCount,
    customerOnline: isCustomerOnline(db, customer.id),
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      avatar: customer.avatar,
    },
    lastMessage: lastMessage
      ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderType: lastMessage.senderType,
        }
      : null,
  };
}

export function getConversationDetail(
  db: AppDatabase,
  conversationId: string,
): ConversationDetail | null {
  const conversation = db.conversations.find((item) => item.id === conversationId);
  const customer = conversation
    ? db.customers.find((item) => item.id === conversation.customerId)
    : null;
  if (!conversation || !customer) return null;

  const messages = db.messages
    .filter((item) => item.conversationId === conversation.id)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const tags = db.customerTags
    .filter((item) => item.customerId === customer.id)
    .map((item) => db.tags.find((tag) => tag.id === item.tagId))
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));

  const notes = db.notes
    .filter((item) => item.customerId === customer.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8)
    .map((note) => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt,
      author: userName(db, note.authorId) ?? { id: note.authorId, name: "Agent" },
    }));

  const tickets = db.tickets
    .filter((item) => item.customerId === customer.id)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 6)
    .map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      conversationId: ticket.conversationId,
      updatedAt: ticket.updatedAt,
    }));

  return {
    id: conversation.id,
    status: conversation.status,
    updatedAt: conversation.updatedAt,
    assignedAgent: userName(db, conversation.assignedAgentId),
    customerOnline: isCustomerOnline(db, customer.id),
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      avatar: customer.avatar,
      status: customer.status,
      tags,
      notes,
      tickets,
    },
    messages: messages.map(serializeMessage),
  };
}

export function serializeMessage(message: AppMessage) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderType: message.senderType,
    senderId: message.senderId,
    content: message.content,
    read: message.read,
    createdAt: message.createdAt,
  };
}

export function listCustomers(
  db: AppDatabase,
  input: {
    query?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
  },
) {
  const pageSize = input.pageSize ?? 8;
  const page = Math.max(1, input.page ?? 1);
  const query = input.query?.trim().toLowerCase() ?? "";

  const mapped: CustomerListItem[] = db.customers
    .filter((customer) =>
      input.status && input.status !== "ALL"
        ? customer.status === input.status
        : true,
    )
    .map((customer) => {
      const conversations = db.conversations.filter(
        (item) => item.customerId === customer.id,
      );
      const tickets = db.tickets.filter((item) => item.customerId === customer.id);
      const notes = db.notes.filter((item) => item.customerId === customer.id);
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        avatar: customer.avatar,
        status: customer.status,
        conversationCount: conversations.length,
        ticketCount: tickets.length,
        lastActivity: lastActivityAt({
          updatedAt: customer.updatedAt,
          conversations,
          tickets,
          notes,
        }),
      };
    })
    .filter((customer) => {
      if (!query) return true;
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        (customer.company ?? "").toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (input.sort === "name") return a.name.localeCompare(b.name);
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

export function getCustomerProfile(db: AppDatabase, id: string) {
  const customer = db.customers.find((item) => item.id === id);
  if (!customer) return null;

  const conversations = db.conversations
    .filter((item) => item.customerId === id)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  const tickets = db.tickets
    .filter((item) => item.customerId === id)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  const notes = db.notes
    .filter((item) => item.customerId === id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const tags = db.customerTags
    .filter((item) => item.customerId === id)
    .map((item) => db.tags.find((tag) => tag.id === item.tagId))
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));
  const activities = db.activities
    .filter((item) => item.customerId === id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 80);

  const openTickets = tickets.filter((ticket) => ticket.status === "OPEN").length;
  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "RESOLVED",
  ).length;

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    company: customer.company,
    avatar: customer.avatar,
    status: customer.status,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    tags,
    notes: notes.map((note) => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      author: userName(db, note.authorId) ?? { id: note.authorId, name: "Agent" },
    })),
    conversations: conversations.map((conversation) => {
      const messages = db.messages
        .filter((item) => item.conversationId === conversation.id)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      const lastMessage = messages[messages.length - 1];
      return {
        id: conversation.id,
        status: conversation.status,
        updatedAt: conversation.updatedAt,
        assignedAgent: userName(db, conversation.assignedAgentId),
        lastMessage: lastMessage
          ? { content: lastMessage.content, createdAt: lastMessage.createdAt }
          : null,
      };
    }),
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      updatedAt: ticket.updatedAt,
      assignedAgent: userName(db, ticket.assignedAgentId),
      conversationId: ticket.conversationId,
    })),
    stats: {
      totalConversations: conversations.length,
      openTickets,
      resolvedTickets,
      lastContact: lastActivityAt({
        updatedAt: customer.updatedAt,
        conversations,
        tickets,
        notes,
      }),
    },
    timeline: buildTimeline(db, customer, conversations, tickets, notes, activities),
  };
}

export type CustomerProfile = NonNullable<ReturnType<typeof getCustomerProfile>>;

function buildTimeline(
  db: AppDatabase,
  customer: AppCustomer,
  conversations: AppDatabase["conversations"],
  tickets: AppDatabase["tickets"],
  notes: AppDatabase["notes"],
  activities: AppActivity[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: `customer-created-${customer.id}`,
      type: "customer.created",
      title: "Customer created",
      message: `${customer.name} was added to the CRM.`,
      createdAt: customer.createdAt,
      href: `/customers/${customer.id}`,
    },
  ];

  for (const conversation of conversations) {
    events.push({
      id: `conversation-started-${conversation.id}`,
      type: "conversation.started",
      title: "Conversation started",
      message: "A support conversation was opened.",
      createdAt: conversation.createdAt,
      href: `/chat?conversation=${conversation.id}`,
    });
    const messages = db.messages.filter(
      (item) => item.conversationId === conversation.id,
    );
    for (const message of messages) {
      events.push({
        id: `message-${message.id}`,
        type: message.senderType === "CUSTOMER" ? "message.received" : "message.sent",
        title:
          message.senderType === "CUSTOMER" ? "Message received" : "Message sent",
        message: message.content.slice(0, 140),
        createdAt: message.createdAt,
        href: `/chat?conversation=${conversation.id}`,
      });
    }
  }

  for (const ticket of tickets) {
    events.push({
      id: `ticket-created-${ticket.id}`,
      type: "ticket.created",
      title: "Ticket created",
      message: `${ticket.ticketNumber} · ${ticket.subject}`,
      createdAt: ticket.createdAt,
      href: `/tickets/${ticket.id}`,
    });
  }

  for (const note of notes) {
    const author = userName(db, note.authorId);
    events.push({
      id: `note-${note.id}`,
      type: "note.added",
      title: "Note added",
      message: `${author?.name ?? "Agent"}: ${note.content.slice(0, 140)}`,
      createdAt: note.createdAt,
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

  for (const activity of activities) {
    if (derivedTypes.has(activity.type)) continue;
    events.push({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      message: activity.message,
      createdAt: activity.createdAt,
      href: activity.href,
    });
  }

  return events.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

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

export function listTickets(db: AppDatabase): TicketListItem[] {
  return [...db.tickets]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .flatMap((ticket) => {
      const customer = db.customers.find((item) => item.id === ticket.customerId);
      if (!customer) return [];
      return [
        {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
          },
          assignedAgent: userName(db, ticket.assignedAgentId),
        },
      ];
    });
}

export function getTicketDetail(db: AppDatabase, id: string): TicketDetail | null {
  const ticket = db.tickets.find((item) => item.id === id);
  const customer = ticket
    ? db.customers.find((item) => item.id === ticket.customerId)
    : null;
  if (!ticket || !customer) return null;

  const agent = ticket.assignedAgentId
    ? db.users.find((item) => item.id === ticket.assignedAgentId)
    : null;
  const conversation = ticket.conversationId
    ? db.conversations.find((item) => item.id === ticket.conversationId)
    : null;
  const tags = db.customerTags
    .filter((item) => item.customerId === customer.id)
    .map((item) => db.tags.find((tag) => tag.id === item.tagId))
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));
  const notes = db.notes
    .filter((item) => item.customerId === customer.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 12)
    .map((note) => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt,
      author: userName(db, note.authorId) ?? { id: note.authorId, name: "Agent" },
    }));

  const activities = db.activities
    .filter((item) => item.ticketId === id && item.type !== "ticket.created")
    .map((activity) => ({
      id: activity.id,
      title: activity.title,
      message: activity.message,
      createdAt: activity.createdAt,
      href: activity.href,
    }));

  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    conversationId: ticket.conversationId,
    assignedAgent: agent
      ? { id: agent.id, name: agent.name, email: agent.email }
      : null,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      avatar: customer.avatar,
      status: customer.status,
      tags,
      notes,
    },
    conversation: conversation
      ? {
          id: conversation.id,
          status: conversation.status,
          updatedAt: conversation.updatedAt,
          messages: db.messages
            .filter((item) => item.conversationId === conversation.id)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )
            .slice(0, 8)
            .map((message) => ({
              id: message.id,
              content: message.content,
              senderType: message.senderType,
              createdAt: message.createdAt,
            })),
        }
      : null,
    activities: [
      {
        id: `ticket-created-${ticket.id}`,
        title: "Ticket created",
        message: `${ticket.ticketNumber} · ${ticket.subject}`,
        createdAt: ticket.createdAt,
        href: `/tickets/${ticket.id}`,
      },
      ...activities,
    ].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  };
}

export function getDashboardData(db: AppDatabase) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const ticketsByStatus = ["OPEN", "IN_PROGRESS", "PENDING", "RESOLVED"].map(
    (status) => ({
      status,
      _count: {
        status: db.tickets.filter((ticket) => ticket.status === status).length,
      },
    }),
  );
  const ticketsByPriority = ["LOW", "MEDIUM", "HIGH", "URGENT"].map(
    (priority) => ({
      priority,
      _count: {
        priority: db.tickets.filter((ticket) => ticket.priority === priority)
          .length,
      },
    }),
  );
  const conversationsByStatus = ["OPEN", "CLOSED"].map((status) => ({
    status,
    _count: {
      status: db.conversations.filter((item) => item.status === status).length,
    },
  }));

  const recentMessages = db.messages.filter(
    (message) => new Date(message.createdAt).getTime() >= sevenDaysAgo.getTime(),
  );

  const messageVolume = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    return {
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      count: recentMessages.filter((message) => {
        const created = new Date(message.createdAt).getTime();
        return created >= day.getTime() && created < nextDay.getTime();
      }).length,
    };
  });

  const recentConversations = [...db.conversations]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 6)
    .flatMap((conversation) => {
      const customer = db.customers.find(
        (item) => item.id === conversation.customerId,
      );
      if (!customer) return [];
      const lastMessage = [...db.messages]
        .filter((item) => item.conversationId === conversation.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
      return [
        {
          id: conversation.id,
          updatedAt: conversation.updatedAt,
          customer: { name: customer.name },
          messages: lastMessage ? [lastMessage] : [],
        },
      ];
    });

  const recentTickets = [...db.tickets]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 6)
    .flatMap((ticket) => {
      const customer = db.customers.find((item) => item.id === ticket.customerId);
      if (!customer) return [];
      return [
        {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          customer: { name: customer.name },
        },
      ];
    });

  const recentNotes = [...db.notes]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6)
    .flatMap((note) => {
      const customer = db.customers.find((item) => item.id === note.customerId);
      const author = userName(db, note.authorId);
      if (!customer || !author) return [];
      return [
        {
          id: note.id,
          content: note.content,
          createdAt: note.createdAt,
          customer: { name: customer.name },
          author,
        },
      ];
    });

  return {
    stats: {
      activeChats: db.conversations.filter((item) => item.status === "OPEN").length,
      openTickets: db.tickets.filter((item) => item.status === "OPEN").length,
      pendingTickets: db.tickets.filter((item) => item.status === "PENDING").length,
      inProgressTickets: db.tickets.filter(
        (item) => item.status === "IN_PROGRESS",
      ).length,
      resolvedTickets: db.tickets.filter((item) => item.status === "RESOLVED")
        .length,
      totalCustomers: db.customers.length,
      onlineAgents: db.users.filter((item) => item.status === "ONLINE").length,
    },
    recentConversations,
    recentTickets,
    recentNotes,
    ticketsByStatus,
    ticketsByPriority,
    conversationsByStatus,
    messageVolume,
  };
}

export function getModuleCounts(db: AppDatabase) {
  return {
    conversations: db.conversations.length,
    tickets: db.tickets.length,
    customers: db.customers.length,
  };
}

export function nextTicketNumber(db: AppDatabase) {
  const max = db.tickets.reduce((current, ticket) => {
    const match = ticket.ticketNumber.match(/(\d+)$/);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 1000);
  return `SH-${max + 1}`;
}

export function unreadChatCount(db: AppDatabase) {
  const ids = new Set(
    db.messages
      .filter((item) => item.senderType === "CUSTOMER" && !item.read)
      .map((item) => item.conversationId),
  );
  return ids.size;
}

export function listNotifications(db: AppDatabase, userId: string) {
  return [...db.notifications]
    .filter((item) => item.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8);
}
