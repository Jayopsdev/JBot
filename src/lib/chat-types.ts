export type ChatSenderType = "AGENT" | "CUSTOMER" | "SYSTEM";
export type ChatConversationStatus = "OPEN" | "CLOSED";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderType: ChatSenderType;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  status: ChatConversationStatus;
  updatedAt: string;
  unreadCount: number;
  customerOnline: boolean;
  customer: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderType: ChatSenderType;
  } | null;
};

export type CustomerPanelData = {
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
  tickets: {
    id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    priority: string;
    conversationId: string | null;
    updatedAt: string;
  }[];
};

export type ConversationDetail = {
  id: string;
  status: ChatConversationStatus;
  updatedAt: string;
  assignedAgent: { id: string; name: string } | null;
  customerOnline: boolean;
  customer: CustomerPanelData;
  messages: ChatMessage[];
};

export type RealtimeEvent =
  | { type: "connected" }
  | { type: "message.created"; conversationId: string; message: ChatMessage }
  | { type: "conversation.upserted"; conversation: ConversationSummary }
  | { type: "conversation.updated"; conversationId: string; status: ChatConversationStatus }
  | { type: "conversation.read"; conversationId: string }
  | { type: "presence"; customerId: string; online: boolean }
  | { type: "typing"; conversationId: string; senderType: ChatSenderType };