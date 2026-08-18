"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, MessageSquare, PanelRight, Wifi, WifiOff } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { StatusBadge } from "@/components/status-badge";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageThread } from "@/components/chat/message-thread";
import { MessageComposer } from "@/components/chat/message-composer";
import { CustomerPanel } from "@/components/chat/customer-panel";
import { OnlineDot } from "@/components/chat/online-dot";
import { useRealtime } from "@/hooks/use-realtime";
import { requestJson } from "@/lib/request-json";
import type { AuthUser } from "@/lib/auth";
import type {
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
  RealtimeEvent,
} from "@/lib/chat-types";
import { cn } from "@/lib/utils";

function upsertConversation(
  list: ConversationSummary[],
  conversation: ConversationSummary,
) {
  return [
    conversation,
    ...list.filter((item) => item.id !== conversation.id),
  ].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function upsertMessage(list: ChatMessage[], message: ChatMessage) {
  if (list.some((item) => item.id === message.id)) return list;
  const withoutTemp = list.filter(
    (item) =>
      !(
        item.id.startsWith("temp-") &&
        item.content === message.content &&
        item.senderType === message.senderType
      ),
  );
  return [...withoutTemp, message];
}

export function ChatWorkspace({
  agent,
  initialConversations,
  initialConversationId = null,
  initialDetail = null,
  agents = [],
}: {
  agent: AuthUser;
  initialConversations: ConversationSummary[];
  initialConversationId?: string | null;
  initialDetail?: ConversationDetail | null;
  agents?: { id: string; name: string }[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId);
  const [detail, setDetail] = useState<ConversationDetail | null>(initialDetail);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">(
    "ALL",
  );
  const [mobilePane, setMobilePane] = useState<"list" | "thread">(
    initialConversationId ? "thread" : "list",
  );
  const [showPanel, setShowPanel] = useState(true);
  const [typing, setTyping] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const typingTimeout = useRef<number | null>(null);
  const lastTypingSent = useRef(0);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const loadDetail = useCallback(async (id: string, markRead = false) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const payload = await requestJson<{ conversation: ConversationDetail }>(
        `/api/conversations/${id}`,
      );
      setDetail(payload.conversation);
      if (markRead) {
        await requestJson(`/api/conversations/${id}/read`, { method: "POST" });
        setConversations((current) =>
          current.map((item) =>
            item.id === id ? { ...item, unreadCount: 0 } : item,
          ),
        );
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load chat",
      );
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleEvent = useCallback((event: RealtimeEvent) => {
    if (event.type === "conversation.upserted") {
      setConversations((current) =>
        upsertConversation(current, event.conversation),
      );
      return;
    }

    if (event.type === "conversation.updated") {
      setConversations((current) =>
        current.map((item) =>
          item.id === event.conversationId
            ? { ...item, status: event.status }
            : item,
        ),
      );
      setDetail((current) =>
        current && current.id === event.conversationId
          ? { ...current, status: event.status }
          : current,
      );
      return;
    }

    if (event.type === "conversation.read") {
      setConversations((current) =>
        current.map((item) =>
          item.id === event.conversationId ? { ...item, unreadCount: 0 } : item,
        ),
      );
      return;
    }

    if (event.type === "presence") {
      setConversations((current) =>
        current.map((item) =>
          item.customer.id === event.customerId
            ? { ...item, customerOnline: event.online }
            : item,
        ),
      );
      setDetail((current) =>
        current && current.customer.id === event.customerId
          ? { ...current, customerOnline: event.online }
          : current,
      );
      return;
    }

    if (event.type === "typing" && event.senderType === "CUSTOMER") {
      if (event.conversationId !== selectedIdRef.current) return;
      setTyping("Customer is typing...");
      if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
      typingTimeout.current = window.setTimeout(() => setTyping(null), 2500);
      return;
    }

    if (event.type === "message.created") {
      setConversations((current) => {
        const exists = current.some((item) => item.id === event.conversationId);
        if (!exists) {
          void requestJson<{ conversations: ConversationSummary[] }>(
            "/api/conversations",
          ).then((payload) => setConversations(payload.conversations));
          return current;
        }

        return current.map((item) => {
          if (item.id !== event.conversationId) return item;
          const isSelected = selectedIdRef.current === item.id;
          const increment =
            event.message.senderType === "CUSTOMER" && !isSelected ? 1 : 0;
          return {
            ...item,
            updatedAt: event.message.createdAt,
            unreadCount: item.unreadCount + increment,
            lastMessage: {
              content: event.message.content,
              createdAt: event.message.createdAt,
              senderType: event.message.senderType,
            },
          };
        });
      });

      if (selectedIdRef.current === event.conversationId) {
        setDetail((current) =>
          current
            ? {
                ...current,
                messages: upsertMessage(current.messages, event.message),
              }
            : current,
        );
        if (event.message.senderType === "CUSTOMER") {
          void requestJson(`/api/conversations/${event.conversationId}/read`, {
            method: "POST",
          });
        }
      }
    }
  }, []);

  const connection = useRealtime(handleEvent);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void requestJson<{ conversations: ConversationSummary[] }>("/api/conversations")
        .then((payload) => {
          if (!cancelled) setConversations(payload.conversations);
        })
        .catch(() => undefined);
      if (initialConversationId) {
        void loadDetail(initialConversationId, true);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [initialConversationId, loadDetail]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const payload = await requestJson<{ conversations: ConversationSummary[] }>(
          "/api/conversations",
        );
        setConversations(payload.conversations);
        const currentId = selectedIdRef.current;
        if (!currentId) return;
        const selected = await requestJson<{ conversation: ConversationDetail }>(
          `/api/conversations/${currentId}`,
        );
        setDetail((current) => {
          if (!current || current.id !== currentId) return current;
          return {
            ...selected.conversation,
            messages: selected.conversation.messages.reduce(
              (messages, message) => upsertMessage(messages, message),
              current.messages,
            ),
          };
        });
      } catch {
        // keep the current view if a poll fails
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  async function sendMessage(content: string) {
    if (!selectedId) return;
    const temp: ChatMessage = {
      id: `temp-${crypto.randomUUID()}`,
      conversationId: selectedId,
      senderType: "AGENT",
      senderId: agent.id,
      content,
      read: true,
      createdAt: new Date().toISOString(),
    };
    setDetail((current) =>
      current ? { ...current, messages: [...current.messages, temp] } : current,
    );
    setSending(true);
    try {
      const payload = await requestJson<{ message: ChatMessage }>(
        `/api/conversations/${selectedId}/messages`,
        { method: "POST", body: JSON.stringify({ content }) },
      );
      setDetail((current) =>
        current
          ? { ...current, messages: upsertMessage(current.messages, payload.message) }
          : current,
      );
    } catch (sendError) {
      setDetail((current) =>
        current
          ? {
              ...current,
              messages: current.messages.filter((item) => item.id !== temp.id),
            }
          : current,
      );
      toast.error(sendError instanceof Error ? sendError.message : "Could not send");
    } finally {
      setSending(false);
    }
  }

  async function closeConversation() {
    if (!selectedId) return;
    try {
      await requestJson(`/api/conversations/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CLOSED" }),
      });
      toast.success("Conversation closed");
    } catch (closeError) {
      toast.error(
        closeError instanceof Error ? closeError.message : "Could not close chat",
      );
    }
  }

  function sendTyping() {
    if (!selectedId) return;
    const now = Date.now();
    if (now - lastTypingSent.current < 800) return;
    lastTypingSent.current = now;
    void requestJson(`/api/conversations/${selectedId}/typing`, { method: "POST" });
  }

  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  return (
    <div className="relative -m-4 mb-16 flex h-[calc(100dvh-4rem)] min-h-0 overflow-hidden border-y bg-background md:-m-6 md:mb-0 md:h-[calc(100vh-4rem)]">
      <div
        className={cn(
          "w-full shrink-0 md:w-80 md:border-r",
          mobilePane === "thread" ? "hidden md:block" : "block",
        )}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          search={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onSelect={(id) => {
            setSelectedId(id);
            setMobilePane("thread");
            void loadDetail(id, true);
          }}
        />
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 flex flex-col",
          mobilePane === "list" ? "hidden md:flex" : "flex",
        )}
      >
        {!selectedId ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Select a conversation"
              description="Choose a customer from the left to read messages, reply, and create a ticket."
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b px-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden"
                  onClick={() => setMobilePane("list")}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="relative">
                  <UserAvatar
                    name={detail?.customer.name ?? selected?.customer.name ?? "Customer"}
                  />
                  <OnlineDot
                    online={detail?.customerOnline ?? selected?.customerOnline ?? false}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {detail?.customer.name ?? selected?.customer.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(detail?.customerOnline ?? selected?.customerOnline)
                      ? "Online"
                      : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
                  {connection === "connected" ? (
                    <Wifi className="size-3.5 text-emerald-600" />
                  ) : (
                    <WifiOff className="size-3.5 text-amber-600" />
                  )}
                  {connection === "connected" ? "Live" : "Reconnecting"}
                </span>
                {detail ? <StatusBadge status={detail.status} /> : null}
                <Button
                  variant="outline"
                  size="sm"
                  className="xl:hidden"
                  onClick={() => setShowPanel((value) => !value)}
                >
                  <PanelRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={detail?.status === "CLOSED"}
                  onClick={() => void closeConversation()}
                >
                  Close
                </Button>
              </div>
            </div>

            {error ? (
              <div className="flex items-center justify-between gap-3 border-b bg-rose-50 px-4 py-2 text-sm text-rose-700">
                <span>{error}</span>
                {selectedId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void loadDetail(selectedId)}
                  >
                    Retry
                  </Button>
                ) : null}
              </div>
            ) : null}

            {loadingDetail && !detail ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Loading conversation...
              </div>
            ) : (
              <MessageThread
                messages={detail?.messages ?? []}
                agentName={agent.name}
                customerName={detail?.customer.name ?? "Customer"}
                typingLabel={typing}
              />
            )}

            <MessageComposer
              disabled={detail?.status === "CLOSED"}
              sending={sending}
              placeholder={
                detail?.status === "CLOSED"
                  ? "Conversation is closed"
                  : "Write a reply..."
              }
              onSend={sendMessage}
              onTyping={sendTyping}
            />
          </>
        )}
      </div>

      <div
        className={cn(
          "w-80 shrink-0 border-l bg-background xl:block",
          showPanel
            ? "absolute inset-y-0 right-0 z-20 block shadow-xl xl:static xl:shadow-none"
            : "hidden xl:block",
        )}
      >
        {detail ? (
          <CustomerPanel
            detail={detail}
            agents={agents}
            onCloseConversation={() => void closeConversation()}
            onRefresh={setDetail}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <EmptyState
              icon={MessageSquare}
              title="Customer details"
              description="Profile, tags, notes, and related tickets appear here after you open a conversation."
            />
          </div>
        )}
      </div>
    </div>
  );
}
