import { z } from "zod";
import type { RealtimeEvent } from "@/lib/chat-types";
import { prettyLabel } from "@/lib/pretty";
import {
  getConversationDetail,
  getCustomerProfile,
  getTicketDetail,
  listAgents,
  listConversations,
  listCustomers,
  listTickets,
  nextTicketNumber,
  serializeMessage,
  toConversationSummary,
} from "@/lib/local-db/queries";
import {
  getCurrentAgentId,
  getDatabase,
  newId,
  updateDatabase,
} from "@/lib/local-db/store";
import type { AppDatabase, AppTicket } from "@/lib/local-db/types";

export class LocalApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type RouteParams = Record<string, string>;

function pathnameOf(url: string) {
  return url.split("?")[0];
}

function searchParamsOf(url: string) {
  const query = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
  return new URLSearchParams(query);
}

function matchRoute(path: string, pattern: string): RouteParams | null {
  const pathParts = path.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;
  const params: RouteParams = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const part = patternParts[index];
    if (part.startsWith(":")) {
      params[part.slice(1)] = decodeURIComponent(pathParts[index]);
    } else if (part !== pathParts[index]) {
      return null;
    }
  }
  return params;
}

function parseBody(options?: RequestInit) {
  if (!options?.body || typeof options.body !== "string") return {};
  return options.body
    ? (JSON.parse(options.body) as Record<string, unknown>)
    : {};
}

function requireAgent(db: AppDatabase) {
  const agentId = getCurrentAgentId();
  const user = db.users.find((item) => item.id === agentId);
  if (!user) throw new LocalApiError("Unauthorized", 401);
  return user;
}

function recordActivity(
  db: AppDatabase,
  input: {
    customerId: string;
    actorId?: string | null;
    type: string;
    title: string;
    message: string;
    href?: string | null;
    ticketId?: string | null;
    conversationId?: string | null;
  },
) {
  db.activities.unshift({
    id: newId("act"),
    customerId: input.customerId,
    actorId: input.actorId ?? null,
    type: input.type,
    title: input.title,
    message: input.message,
    href: input.href ?? null,
    ticketId: input.ticketId ?? null,
    conversationId: input.conversationId ?? null,
    createdAt: new Date().toISOString(),
  });
}

function notifyUsers(
  db: AppDatabase,
  input: {
    userIds: Array<string | null | undefined>;
    type: string;
    title: string;
    message: string;
    href?: string | null;
  },
) {
  const uniqueIds = [
    ...new Set(input.userIds.filter((id): id is string => Boolean(id))),
  ];
  const now = new Date().toISOString();
  for (const userId of uniqueIds) {
    db.notifications.unshift({
      id: newId("ntf"),
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      read: false,
      createdAt: now,
    });
  }
}

function addMessage(
  db: AppDatabase,
  input: {
    conversationId: string;
    senderType: "AGENT" | "CUSTOMER" | "SYSTEM";
    senderId: string;
    content: string;
    read: boolean;
  },
) {
  const now = new Date().toISOString();
  const message = {
    id: newId("msg"),
    conversationId: input.conversationId,
    senderType: input.senderType,
    senderId: input.senderId,
    content: input.content,
    read: input.read,
    createdAt: now,
  };
  db.messages.push(message);
  const conversation = db.conversations.find(
    (item) => item.id === input.conversationId,
  );
  if (conversation) conversation.updatedAt = now;
  return message;
}

export function handleLocalApi(url: string, options?: RequestInit) {
  const method = (options?.method ?? "GET").toUpperCase();
  const path = pathnameOf(url);
  const search = searchParamsOf(url);
  const body = parseBody(options);
  const events: RealtimeEvent[] = [];

  if (method === "GET") {
    return dispatch(getDatabase(), method, path, search, body, events);
  }

  let output: unknown = { ok: true };
  updateDatabase((db) => {
    output = dispatch(db, method, path, search, body, events);
    return events;
  });
  return output;
}

function dispatch(
  db: AppDatabase,
  method: string,
  path: string,
  search: URLSearchParams,
  body: Record<string, unknown>,
  events: RealtimeEvent[],
): unknown {
  let params: RouteParams | null;

  if (method === "GET" && matchRoute(path, "/api/conversations")) {
    requireAgent(db);
    return { conversations: listConversations(db) };
  }

  params = matchRoute(path, "/api/conversations/:id/messages");
  if (params && method === "POST") {
    const user = requireAgent(db);
    const parsed = z
      .object({ content: z.string().trim().min(1).max(4000) })
      .safeParse(body);
    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Invalid message",
      );
    }
    const conversation = db.conversations.find((item) => item.id === params!.id);
    if (!conversation) throw new LocalApiError("Conversation not found", 404);
    if (!conversation.assignedAgentId) {
      conversation.assignedAgentId = user.id;
      conversation.status = "OPEN";
    } else if (conversation.status === "CLOSED") {
      conversation.status = "OPEN";
    }
    const message = addMessage(db, {
      conversationId: params!.id,
      senderType: "AGENT",
      senderId: user.id,
      content: parsed.data.content,
      read: false,
    });
    const summary = toConversationSummary(db, params!.id);
    events.push({
      type: "message.created",
      conversationId: params!.id,
      message: serializeMessage(message),
    });
    if (summary) {
      events.push({ type: "conversation.upserted", conversation: summary });
    }
    return { message: serializeMessage(message) };
  }

  params = matchRoute(path, "/api/conversations/:id/read");
  if (params && method === "POST") {
    requireAgent(db);
    const conversation = db.conversations.find((item) => item.id === params!.id);
    if (!conversation) throw new LocalApiError("Conversation not found", 404);
    for (const message of db.messages) {
      if (
        message.conversationId === params!.id &&
        message.senderType === "CUSTOMER" &&
        !message.read
      ) {
        message.read = true;
      }
    }
    events.push({ type: "conversation.read", conversationId: params!.id });
    return { ok: true };
  }

  params = matchRoute(path, "/api/conversations/:id/typing");
  if (params && method === "POST") {
    requireAgent(db);
    db.typing = {
      conversationId: params!.id,
      senderType: "AGENT",
      at: new Date().toISOString(),
    };
    events.push({
      type: "typing",
      conversationId: params!.id,
      senderType: "AGENT",
    });
    return { ok: true };
  }

  params = matchRoute(path, "/api/conversations/:id");
  if (params && method === "GET") {
    requireAgent(db);
    const conversation = getConversationDetail(db, params!.id);
    if (!conversation) throw new LocalApiError("Conversation not found", 404);
    return { conversation };
  }

  params = matchRoute(path, "/api/conversations/:id");
  if (params && method === "PATCH") {
    requireAgent(db);
    const parsed = z.object({ status: z.enum(["OPEN", "CLOSED"]) }).safeParse(body);
    if (!parsed.success) {
      throw new LocalApiError("Invalid conversation update");
    }
    const conversation = db.conversations.find((item) => item.id === params!.id);
    if (!conversation) throw new LocalApiError("Conversation not found", 404);
    conversation.status = parsed.data.status;
    conversation.updatedAt = new Date().toISOString();
    events.push({
      type: "conversation.updated",
      conversationId: conversation.id,
      status: conversation.status,
    });
    return { conversation: getConversationDetail(db, params!.id) };
  }

  if (method === "POST" && matchRoute(path, "/api/widget/session")) {
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(80),
        email: z.email("Enter a valid email"),
      })
      .safeParse(body);
    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Invalid details",
      );
    }
    const email = parsed.data.email.toLowerCase();
    const now = new Date().toISOString();
    let customer = db.customers.find((item) => item.email === email);
    if (!customer) {
      customer = {
        id: newId("cust"),
        name: parsed.data.name,
        email,
        phone: null,
        company: null,
        avatar: null,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      };
      db.customers.unshift(customer);
    } else if (customer.name !== parsed.data.name) {
      customer.name = parsed.data.name;
      customer.updatedAt = now;
    }

    let conversation = db.conversations
      .filter((item) => item.customerId === customer.id && item.status === "OPEN")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )[0];
    let created = false;
    if (!conversation) {
      conversation = {
        id: newId("conv"),
        customerId: customer.id,
        assignedAgentId: null,
        status: "OPEN",
        createdAt: now,
        updatedAt: now,
      };
      db.conversations.unshift(conversation);
      created = true;
    }

    if (!db.onlineCustomerIds.includes(customer.id)) {
      db.onlineCustomerIds.push(customer.id);
    }
    events.push({ type: "presence", customerId: customer.id, online: true });

    if (created) {
      const summary = toConversationSummary(db, conversation.id);
      if (summary) {
        events.push({ type: "conversation.upserted", conversation: summary });
      }
      notifyUsers(db, {
        userIds: db.users.map((user) => user.id),
        type: "conversation",
        title: `New conversation from ${customer.name}`,
        message: `${customer.email} started a chat from the website widget.`,
        href: `/chat?conversation=${conversation.id}`,
      });
    }

    return {
      customer: { id: customer.id, name: customer.name, email: customer.email },
      conversation: getConversationDetail(db, conversation.id),
    };
  }

  params = matchRoute(path, "/api/widget/conversations/:id/messages");
  if (params && method === "POST") {
    const parsed = z
      .object({
        customerId: z.string().min(1),
        content: z.string().trim().min(1).max(4000),
      })
      .safeParse(body);
    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Invalid message",
      );
    }
    const conversation = db.conversations.find((item) => item.id === params!.id);
    if (!conversation || conversation.customerId !== parsed.data.customerId) {
      throw new LocalApiError("Conversation not found", 404);
    }
    if (conversation.status === "CLOSED") conversation.status = "OPEN";
    const message = addMessage(db, {
      conversationId: params!.id,
      senderType: "CUSTOMER",
      senderId: parsed.data.customerId,
      content: parsed.data.content,
      read: false,
    });
    const summary = toConversationSummary(db, params!.id);
    events.push({
      type: "message.created",
      conversationId: params!.id,
      message: serializeMessage(message),
    });
    if (summary) {
      events.push({ type: "conversation.upserted", conversation: summary });
    }
    notifyUsers(db, {
      userIds: conversation.assignedAgentId
        ? [conversation.assignedAgentId]
        : db.users.map((user) => user.id),
      type: "conversation",
      title: "New customer message",
      message: parsed.data.content.slice(0, 140),
      href: `/chat?conversation=${params!.id}`,
    });
    return { message: serializeMessage(message) };
  }

  params = matchRoute(path, "/api/widget/conversations/:id/typing");
  if (params && method === "POST") {
    const parsed = z.object({ customerId: z.string().min(1) }).safeParse(body);
    if (!parsed.success) throw new LocalApiError("Invalid typing payload");
    const conversation = db.conversations.find((item) => item.id === params!.id);
    if (!conversation || conversation.customerId !== parsed.data.customerId) {
      throw new LocalApiError("Conversation not found", 404);
    }
    db.typing = {
      conversationId: params!.id,
      senderType: "CUSTOMER",
      at: new Date().toISOString(),
    };
    events.push({
      type: "typing",
      conversationId: params!.id,
      senderType: "CUSTOMER",
    });
    return { ok: true };
  }

  params = matchRoute(path, "/api/widget/conversations/:id");
  if (params && method === "GET") {
    const customerId = search.get("customerId");
    if (!customerId) throw new LocalApiError("Missing customer", 400);
    const conversation = db.conversations.find((item) => item.id === params!.id);
    if (!conversation || conversation.customerId !== customerId) {
      throw new LocalApiError("Conversation not found", 404);
    }
    return { conversation: getConversationDetail(db, params!.id) };
  }

  if (method === "GET" && matchRoute(path, "/api/tickets")) {
    requireAgent(db);
    return { tickets: listTickets(db) };
  }

  if (method === "POST" && matchRoute(path, "/api/tickets")) {
    const user = requireAgent(db);
    const parsed = z
      .object({
        customerId: z.string().min(1),
        conversationId: z.string().min(1).optional().nullable(),
        subject: z.string().trim().min(1, "Subject is required").max(160),
        description: z
          .string()
          .trim()
          .min(1, "Description is required")
          .max(4000),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
        assignedAgentId: z.string().min(1).optional().nullable(),
      })
      .safeParse(body);
    if (!parsed.success) {
      throw new LocalApiError(
        parsed.error.issues[0]?.message ?? "Invalid ticket",
      );
    }
    const customer = db.customers.find(
      (item) => item.id === parsed.data.customerId,
    );
    if (!customer) throw new LocalApiError("Customer not found", 404);
    if (parsed.data.conversationId) {
      const conversation = db.conversations.find(
        (item) => item.id === parsed.data.conversationId,
      );
      if (!conversation || conversation.customerId !== customer.id) {
        throw new LocalApiError(
          "Conversation does not belong to this customer",
        );
      }
    }

    const cutoff = Date.now() - 20_000;
    const duplicate = db.tickets.find(
      (ticket) =>
        ticket.customerId === parsed.data.customerId &&
        ticket.subject === parsed.data.subject &&
        ticket.conversationId === (parsed.data.conversationId ?? null) &&
        new Date(ticket.createdAt).getTime() >= cutoff,
    );
    if (duplicate) return { ticket: duplicate, reused: true };

    const now = new Date().toISOString();
    const assigneeId = parsed.data.assignedAgentId || user.id;
    const ticket: AppTicket = {
      id: newId("ticket"),
      ticketNumber: nextTicketNumber(db),
      customerId: customer.id,
      conversationId: parsed.data.conversationId ?? null,
      assignedAgentId: assigneeId,
      subject: parsed.data.subject,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
    };
    db.tickets.unshift(ticket);
    recordActivity(db, {
      customerId: customer.id,
      actorId: user.id,
      type: "ticket.created",
      title: "Ticket created",
      message: `${ticket.ticketNumber} · ${ticket.subject}`,
      href: `/tickets/${ticket.id}`,
      ticketId: ticket.id,
      conversationId: ticket.conversationId,
    });
    notifyUsers(db, {
      userIds: [...new Set([assigneeId, user.id])],
      type: "ticket",
      title: "New ticket",
      message: `${ticket.ticketNumber} ${ticket.subject} was created.`,
      href: `/tickets/${ticket.id}`,
    });
    if (assigneeId !== user.id) {
      notifyUsers(db, {
        userIds: [assigneeId],
        type: "ticket",
        title: "Ticket assigned",
        message: `${ticket.ticketNumber} was assigned to you.`,
        href: `/tickets/${ticket.id}`,
      });
    }
    return { ticket, reused: false };
  }

  params = matchRoute(path, "/api/tickets/:id");
  if (params && method === "GET") {
    requireAgent(db);
    const ticket = getTicketDetail(db, params!.id);
    if (!ticket) throw new LocalApiError("Ticket not found", 404);
    return { ticket };
  }

  params = matchRoute(path, "/api/tickets/:id");
  if (params && method === "PATCH") {
    const user = requireAgent(db);
    const parsed = z
      .object({
        status: z.enum(["OPEN", "IN_PROGRESS", "PENDING", "RESOLVED"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        assignedAgentId: z.string().min(1).nullable().optional(),
      })
      .safeParse(body);
    if (!parsed.success) throw new LocalApiError("Invalid ticket update");
    const ticket = db.tickets.find((item) => item.id === params!.id);
    if (!ticket) throw new LocalApiError("Ticket not found", 404);
    const previousStatus = ticket.status;
    const previousAssignee = ticket.assignedAgentId;
    if (parsed.data.status) ticket.status = parsed.data.status;
    if (parsed.data.priority) ticket.priority = parsed.data.priority;
    if (parsed.data.assignedAgentId !== undefined) {
      ticket.assignedAgentId = parsed.data.assignedAgentId;
    }
    ticket.updatedAt = new Date().toISOString();

    if (parsed.data.status && parsed.data.status !== previousStatus) {
      recordActivity(db, {
        customerId: ticket.customerId,
        actorId: user.id,
        type: "ticket.status_changed",
        title: "Ticket status changed",
        message: `Ticket status changed to ${prettyLabel(parsed.data.status)}`,
        href: `/tickets/${ticket.id}`,
        ticketId: ticket.id,
        conversationId: ticket.conversationId,
      });
      notifyUsers(db, {
        userIds: [ticket.assignedAgentId, user.id],
        type: "ticket",
        title: "Ticket status update",
        message: `${ticket.ticketNumber} is now ${prettyLabel(parsed.data.status)}.`,
        href: `/tickets/${ticket.id}`,
      });
    }

    if (
      parsed.data.assignedAgentId &&
      parsed.data.assignedAgentId !== previousAssignee
    ) {
      recordActivity(db, {
        customerId: ticket.customerId,
        actorId: user.id,
        type: "ticket.assigned",
        title: "Ticket assigned",
        message: `${ticket.ticketNumber} was reassigned.`,
        href: `/tickets/${ticket.id}`,
        ticketId: ticket.id,
      });
      notifyUsers(db, {
        userIds: [parsed.data.assignedAgentId],
        type: "ticket",
        title: "Ticket assigned",
        message: `${ticket.ticketNumber} ${ticket.subject} was assigned to you.`,
        href: `/tickets/${ticket.id}`,
      });
    }

    return { ticket: getTicketDetail(db, params!.id) };
  }

  if (method === "GET" && matchRoute(path, "/api/customers")) {
    requireAgent(db);
    return listCustomers(db, {
      query: search.get("q") ?? undefined,
      status: search.get("status") ?? undefined,
      page: Number(search.get("page") ?? "1"),
      pageSize: Number(search.get("pageSize") ?? "8"),
      sort: search.get("sort") ?? undefined,
    });
  }

  params = matchRoute(path, "/api/customers/:id/notes/:noteId");
  if (params && method === "PATCH") {
    const user = requireAgent(db);
    const parsed = z
      .object({ content: z.string().trim().min(1).max(2000) })
      .safeParse(body);
    if (!parsed.success) throw new LocalApiError("Invalid note");
    const note = db.notes.find(
      (item) => item.id === params!.noteId && item.customerId === params!.id,
    );
    if (!note) throw new LocalApiError("Note not found", 404);
    note.content = parsed.data.content;
    note.updatedAt = new Date().toISOString();
    recordActivity(db, {
      customerId: params!.id,
      actorId: user.id,
      type: "note.updated",
      title: "Note updated",
      message: parsed.data.content.slice(0, 140),
      href: `/customers/${params!.id}`,
    });
    return { customer: getCustomerProfile(db, params!.id) };
  }

  params = matchRoute(path, "/api/customers/:id/notes/:noteId");
  if (params && method === "DELETE") {
    requireAgent(db);
    const index = db.notes.findIndex(
      (item) => item.id === params!.noteId && item.customerId === params!.id,
    );
    if (index < 0) throw new LocalApiError("Note not found", 404);
    db.notes.splice(index, 1);
    return { customer: getCustomerProfile(db, params!.id) };
  }

  params = matchRoute(path, "/api/customers/:id/notes");
  if (params && method === "POST") {
    const user = requireAgent(db);
    const parsed = z
      .object({
        content: z.string().trim().min(1, "Note cannot be empty").max(2000),
      })
      .safeParse(body);
    if (!parsed.success) {
      throw new LocalApiError(parsed.error.issues[0]?.message ?? "Invalid note");
    }
    const customer = db.customers.find((item) => item.id === params!.id);
    if (!customer) throw new LocalApiError("Customer not found", 404);
    const now = new Date().toISOString();
    const note = {
      id: newId("note"),
      customerId: params!.id,
      authorId: user.id,
      content: parsed.data.content,
      createdAt: now,
      updatedAt: now,
    };
    db.notes.unshift(note);
    recordActivity(db, {
      customerId: params!.id,
      actorId: user.id,
      type: "note.added",
      title: "Note added",
      message: parsed.data.content.slice(0, 140),
      href: `/customers/${params!.id}`,
    });
    const conversationId = search.get("conversationId");
    if (conversationId) {
      return {
        conversation: getConversationDetail(db, conversationId),
        note,
      };
    }
    return { customer: getCustomerProfile(db, params!.id), note };
  }

  params = matchRoute(path, "/api/customers/:id/tags/:tagId");
  if (params && method === "DELETE") {
    const user = requireAgent(db);
    const existing = db.customerTags.find(
      (item) => item.customerId === params!.id && item.tagId === params!.tagId,
    );
    const tag = db.tags.find((item) => item.id === params!.tagId);
    const customer = db.customers.find((item) => item.id === params!.id);
    if (!existing || !tag || !customer) {
      throw new LocalApiError("Tag not found on this customer", 404);
    }
    db.customerTags = db.customerTags.filter(
      (item) =>
        !(item.customerId === params!.id && item.tagId === params!.tagId),
    );
    recordActivity(db, {
      customerId: params!.id,
      actorId: user.id,
      type: "tag.removed",
      title: "Tag removed",
      message: `${tag.name} was removed from ${customer.name}.`,
      href: `/customers/${params!.id}`,
    });
    return { customer: getCustomerProfile(db, params!.id) };
  }

  params = matchRoute(path, "/api/customers/:id/tags");
  if (params && method === "POST") {
    const user = requireAgent(db);
    const parsed = z.object({ name: z.string().trim().min(1).max(40) }).safeParse(body);
    if (!parsed.success) throw new LocalApiError("Tag name is required");
    const customer = db.customers.find((item) => item.id === params!.id);
    if (!customer) throw new LocalApiError("Customer not found", 404);
    const name = parsed.data.name;
    let tag = db.tags.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );
    if (!tag) {
      tag = { id: newId("tag"), name };
      db.tags.push(tag);
    }
    const already = db.customerTags.some(
      (item) => item.customerId === params!.id && item.tagId === tag.id,
    );
    if (!already) {
      db.customerTags.push({ customerId: params!.id, tagId: tag.id });
    }
    recordActivity(db, {
      customerId: params!.id,
      actorId: user.id,
      type: "tag.added",
      title: "Tag added",
      message: `${name} was added to ${customer.name}.`,
      href: `/customers/${params!.id}`,
    });
    return { customer: getCustomerProfile(db, params!.id) };
  }

  params = matchRoute(path, "/api/customers/:id");
  if (params && method === "GET") {
    requireAgent(db);
    const customer = getCustomerProfile(db, params!.id);
    if (!customer) throw new LocalApiError("Customer not found", 404);
    return { customer };
  }

  params = matchRoute(path, "/api/customers/:id");
  if (params && method === "PATCH") {
    const user = requireAgent(db);
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(80).optional(),
        email: z.email().optional(),
        phone: z.string().trim().max(40).nullable().optional(),
        company: z.string().trim().max(80).nullable().optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
      })
      .safeParse(body);
    if (!parsed.success) throw new LocalApiError("Invalid customer update");
    const customer = db.customers.find((item) => item.id === params!.id);
    if (!customer) throw new LocalApiError("Customer not found", 404);
    if (parsed.data.email && parsed.data.email !== customer.email) {
      const clash = db.customers.find(
        (item) => item.email === parsed.data.email!.toLowerCase(),
      );
      if (clash) throw new LocalApiError("Email already in use", 409);
    }
    if (parsed.data.name) customer.name = parsed.data.name;
    if (parsed.data.email) customer.email = parsed.data.email.toLowerCase();
    if (parsed.data.phone !== undefined) customer.phone = parsed.data.phone;
    if (parsed.data.company !== undefined) customer.company = parsed.data.company;
    if (parsed.data.status) customer.status = parsed.data.status;
    customer.updatedAt = new Date().toISOString();
    recordActivity(db, {
      customerId: params!.id,
      actorId: user.id,
      type: "customer.updated",
      title: "Customer updated",
      message: `${customer.name}'s profile was updated.`,
      href: `/customers/${params!.id}`,
    });
    return { customer: getCustomerProfile(db, params!.id) };
  }

  if (method === "GET" && matchRoute(path, "/api/agents")) {
    requireAgent(db);
    return { agents: listAgents(db) };
  }

  params = matchRoute(path, "/api/notifications/:id/read");
  if (params && method === "POST") {
    const user = requireAgent(db);
    const notification = db.notifications.find((item) => item.id === params!.id);
    if (!notification || notification.userId !== user.id) {
      throw new LocalApiError("Notification not found", 404);
    }
    notification.read = true;
    return { ok: true };
  }

  params = matchRoute(path, "/api/presence");
  if (params && method === "POST") {
    const parsed = z
      .object({
        customerId: z.string().min(1),
        online: z.boolean(),
      })
      .safeParse(body);
    if (!parsed.success) throw new LocalApiError("Invalid presence payload");
    const { customerId, online } = parsed.data;
    if (online && !db.onlineCustomerIds.includes(customerId)) {
      db.onlineCustomerIds.push(customerId);
    }
    if (!online) {
      db.onlineCustomerIds = db.onlineCustomerIds.filter((id) => id !== customerId);
    }
    events.push({ type: "presence", customerId, online });
    return { ok: true };
  }

  throw new LocalApiError("Not found", 404);
}
