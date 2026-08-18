import { prisma } from "@/lib/prisma";
import { isCustomerOnline } from "@/lib/realtime";
import type {
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
} from "@/lib/chat-types";
import type { Conversation, Message, SenderType } from "@prisma/client";

function serializeMessage(message: Message): ChatMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderType: message.senderType,
    senderId: message.senderId,
    content: message.content,
    read: message.read,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function getUnreadCounts(conversationIds: string[]) {
  if (conversationIds.length === 0) return new Map<string, number>();

  const grouped = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversationIds },
      senderType: "CUSTOMER",
      read: false,
    },
    _count: { _all: true },
  });

  return new Map(grouped.map((item) => [item.conversationId, item._count._all]));
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const unread = await getUnreadCounts(conversations.map((item) => item.id));

  return conversations.map((conversation) =>
    toConversationSummary(conversation, unread.get(conversation.id) ?? 0),
  );
}

export function toConversationSummary(
  conversation: Conversation & {
    customer: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
    messages: Message[];
  },
  unreadCount: number,
): ConversationSummary {
  const lastMessage = conversation.messages[0];

  return {
    id: conversation.id,
    status: conversation.status,
    updatedAt: conversation.updatedAt.toISOString(),
    unreadCount,
    customerOnline: isCustomerOnline(conversation.customerId),
    customer: conversation.customer,
    lastMessage: lastMessage
      ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt.toISOString(),
          senderType: lastMessage.senderType,
        }
      : null,
  };
}

export async function getConversationSummary(
  conversationId: string,
): Promise<ConversationSummary | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!conversation) return null;

  const unread = await getUnreadCounts([conversation.id]);
  return toConversationSummary(conversation, unread.get(conversation.id) ?? 0);
}

export async function getConversationDetail(
  conversationId: string,
): Promise<ConversationDetail | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      assignedAgent: {
        select: { id: true, name: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
      customer: {
        include: {
          tags: {
            include: { tag: true },
          },
          notes: {
            orderBy: { createdAt: "desc" },
            take: 8,
            include: {
              author: { select: { id: true, name: true } },
            },
          },
          tickets: {
            orderBy: { updatedAt: "desc" },
            take: 6,
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
              status: true,
              priority: true,
              conversationId: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) return null;

  return {
    id: conversation.id,
    status: conversation.status,
    updatedAt: conversation.updatedAt.toISOString(),
    assignedAgent: conversation.assignedAgent,
    customerOnline: isCustomerOnline(conversation.customerId),
    customer: {
      id: conversation.customer.id,
      name: conversation.customer.name,
      email: conversation.customer.email,
      phone: conversation.customer.phone,
      company: conversation.customer.company,
      avatar: conversation.customer.avatar,
      status: conversation.customer.status,
      tags: conversation.customer.tags.map((item) => ({
        id: item.tag.id,
        name: item.tag.name,
      })),
      notes: conversation.customer.notes.map((note) => ({
        id: note.id,
        content: note.content,
        createdAt: note.createdAt.toISOString(),
        author: note.author,
      })),
      tickets: conversation.customer.tickets.map((ticket) => ({
        ...ticket,
        updatedAt: ticket.updatedAt.toISOString(),
      })),
    },
    messages: conversation.messages.map(serializeMessage),
  };
}

export async function createMessage(input: {
  conversationId: string;
  senderType: SenderType;
  senderId: string;
  content: string;
  read: boolean;
}) {
  const message = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      senderType: input.senderType,
      senderId: input.senderId,
      content: input.content,
      read: input.read,
    },
  });

  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: new Date() },
  });

  return serializeMessage(message);
}

export { serializeMessage };
