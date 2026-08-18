import { prisma } from "@/lib/prisma";
import { ConversationStatus, TicketStatus } from "@prisma/client";

export async function getDashboardData() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    activeChats,
    openTickets,
    pendingTickets,
    inProgressTickets,
    resolvedTickets,
    totalCustomers,
    onlineAgents,
    recentConversations,
    recentTickets,
    recentNotes,
    ticketsByStatus,
    ticketsByPriority,
    conversationsByStatus,
    recentMessages,
  ] = await Promise.all([
    prisma.conversation.count({ where: { status: ConversationStatus.OPEN } }),
    prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
    prisma.ticket.count({ where: { status: TicketStatus.PENDING } }),
    prisma.ticket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
    prisma.ticket.count({ where: { status: TicketStatus.RESOLVED } }),
    prisma.customer.count(),
    prisma.user.count({ where: { status: "ONLINE" } }),
    prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        customer: true,
        assignedAgent: {
          select: { id: true, name: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.ticket.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        customer: true,
        assignedAgent: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.note.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        customer: true,
        author: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.ticket.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.ticket.groupBy({
      by: ["priority"],
      _count: { priority: true },
    }),
    prisma.conversation.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.message.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  const messageVolume = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    return {
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      count: recentMessages.filter(
        (message) => message.createdAt >= day && message.createdAt < nextDay,
      ).length,
    };
  });

  return {
    stats: {
      activeChats,
      openTickets,
      pendingTickets,
      inProgressTickets,
      resolvedTickets,
      totalCustomers,
      onlineAgents,
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

export async function getModuleCounts() {
  const [conversations, tickets, customers] = await Promise.all([
    prisma.conversation.count(),
    prisma.ticket.count(),
    prisma.customer.count(),
  ]);

  return { conversations, tickets, customers };
}
