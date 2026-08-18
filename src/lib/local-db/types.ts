export const STORAGE_KEY = "supportstall-db-v1";
export const AGENT_ID_KEY = "supportstall-agent-id";
export const DB_EVENT = "supportstall-db-changed";
export const REALTIME_EVENT = "supportstall-realtime";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  status: "ONLINE" | "OFFLINE" | "AWAY";
};

export type AppCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  avatar: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type AppConversation = {
  id: string;
  customerId: string;
  assignedAgentId: string | null;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  updatedAt: string;
};

export type AppMessage = {
  id: string;
  conversationId: string;
  senderType: "AGENT" | "CUSTOMER" | "SYSTEM";
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
};

export type AppTicket = {
  id: string;
  ticketNumber: string;
  customerId: string;
  conversationId: string | null;
  assignedAgentId: string | null;
  subject: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "PENDING" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
};

export type AppNote = {
  id: string;
  customerId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type AppTag = { id: string; name: string };
export type AppCustomerTag = { customerId: string; tagId: string };

export type AppNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export type AppActivity = {
  id: string;
  customerId: string;
  actorId: string | null;
  type: string;
  title: string;
  message: string;
  href: string | null;
  ticketId: string | null;
  conversationId: string | null;
  createdAt: string;
};

export type AppDatabase = {
  users: AppUser[];
  customers: AppCustomer[];
  conversations: AppConversation[];
  messages: AppMessage[];
  tickets: AppTicket[];
  notes: AppNote[];
  tags: AppTag[];
  customerTags: AppCustomerTag[];
  notifications: AppNotification[];
  activities: AppActivity[];
  onlineCustomerIds: string[];
  typing: { conversationId: string; senderType: "AGENT" | "CUSTOMER"; at: string } | null;
};
