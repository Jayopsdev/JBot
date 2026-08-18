"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Headset, Minus, Wifi, WifiOff, X } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageComposer } from "@/components/chat/message-composer";
import { MessageThread } from "@/components/chat/message-thread";
import { useRealtime } from "@/hooks/use-realtime";
import { requestJson } from "@/lib/request-json";
import { SUPPORT_LABEL } from "@/lib/brand";
import type {
  ChatMessage,
  ConversationDetail,
  RealtimeEvent,
} from "@/lib/chat-types";

const STORAGE_KEY = "supporthub-widget-session";

type WidgetSession = {
  customerId: string;
  customerName: string;
  email: string;
  conversationId: string;
};

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

function readSession(): WidgetSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WidgetSession) : null;
  } catch {
    return null;
  }
}

const startSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.email("Enter a valid email"),
});

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Interview Customer");
  const [email, setEmail] = useState("interview@example.com");
  const [session, setSession] = useState<WidgetSession | null>(null);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const typingTimeout = useRef<number | null>(null);
  const lastTypingSent = useRef(0);
  const sessionRef = useRef<WidgetSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const restore = useCallback(async (stored: WidgetSession) => {
    try {
      const payload = await requestJson<{ conversation: ConversationDetail }>(
        `/api/widget/conversations/${stored.conversationId}?customerId=${stored.customerId}`,
      );
      setSession(stored);
      setConversation(payload.conversation);
      setName(stored.customerName);
      setEmail(stored.email);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setSession(null);
      setConversation(null);
    }
  }, []);

  const handleEvent = useCallback((event: RealtimeEvent) => {
    const current = sessionRef.current;
    if (!current) return;

    if (event.type === "typing" && event.senderType === "AGENT") {
      setTyping("Support is typing...");
      if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
      typingTimeout.current = window.setTimeout(() => setTyping(null), 2500);
      return;
    }

    if (
      event.type === "message.created" &&
      event.conversationId === current.conversationId
    ) {
      setConversation((value) =>
        value
          ? { ...value, messages: upsertMessage(value.messages, event.message) }
          : value,
      );
    }

    if (
      event.type === "conversation.updated" &&
      event.conversationId === current.conversationId
    ) {
      setConversation((value) =>
        value ? { ...value, status: event.status } : value,
      );
    }
  }, []);

  const realtimeQuery = session
    ? `?conversationId=${session.conversationId}&customerId=${session.customerId}`
    : "";
  const connection = useRealtime(handleEvent, realtimeQuery, Boolean(session));

  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(async () => {
      try {
        const payload = await requestJson<{ conversation: ConversationDetail }>(
          `/api/widget/conversations/${session.conversationId}?customerId=${session.customerId}`,
        );
        setConversation((current) => {
          if (!current) return payload.conversation;
          return {
            ...payload.conversation,
            messages: payload.conversation.messages.reduce(
              (messages, message) => upsertMessage(messages, message),
              current.messages,
            ),
          };
        });
      } catch {
        // keep existing messages if a poll fails
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [session]);

  async function startChat(event: React.FormEvent) {
    event.preventDefault();
    if (starting) return;
    const parsed = startSchema.safeParse({ name, email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const payload = await requestJson<{
        customer: { id: string; name: string; email: string };
        conversation: ConversationDetail;
      }>("/api/widget/session", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });

      const nextSession: WidgetSession = {
        customerId: payload.customer.id,
        customerName: payload.customer.name,
        email: payload.customer.email,
        conversationId: payload.conversation.id,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setConversation(payload.conversation);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not start chat");
    } finally {
      setStarting(false);
    }
  }

  async function sendMessage(content: string) {
    if (!session) return;
    const temp: ChatMessage = {
      id: `temp-${crypto.randomUUID()}`,
      conversationId: session.conversationId,
      senderType: "CUSTOMER",
      senderId: session.customerId,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setConversation((current) =>
      current ? { ...current, messages: [...current.messages, temp] } : current,
    );
    setSending(true);
    try {
      const payload = await requestJson<{ message: ChatMessage }>(
        `/api/widget/conversations/${session.conversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ customerId: session.customerId, content }),
        },
      );
      setConversation((current) =>
        current
          ? { ...current, messages: upsertMessage(current.messages, payload.message) }
          : current,
      );
    } catch (sendError) {
      setConversation((current) =>
        current
          ? {
              ...current,
              messages: current.messages.filter((item) => item.id !== temp.id),
            }
          : current,
      );
      setError(sendError instanceof Error ? sendError.message : "Could not send");
    } finally {
      setSending(false);
    }
  }

  function sendTyping() {
    if (!session) return;
    const now = Date.now();
    if (now - lastTypingSent.current < 800) return;
    lastTypingSent.current = now;
    void fetch(`/api/widget/conversations/${session.conversationId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: session.customerId }),
    });
  }

  return (
    <>
      {open ? (
        <div className="fixed right-4 bottom-24 z-50 flex h-[32rem] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-indigo-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">{SUPPORT_LABEL}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-indigo-100">
                <span className="size-1.5 rounded-full bg-emerald-300" />
                Agents online
                {session ? (
                  <>
                    <span className="text-indigo-200">·</span>
                    {connection === "connected" ? (
                      <Wifi className="size-3" />
                    ) : (
                      <WifiOff className="size-3" />
                    )}
                    {connection === "connected" ? "Connected" : "Reconnecting"}
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-md p-1 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <Minus className="size-4" />
              </button>
              <button
                type="button"
                className="rounded-md p-1 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {!session || !conversation ? (
            <form onSubmit={startChat} className="flex flex-1 flex-col p-4">
              <p className="text-base font-semibold text-slate-900">
                Hi! How can we help you?
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Start a conversation with the {SUPPORT_LABEL} team. We typically reply
                within a few minutes.
              </p>
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="widget-name">Name</Label>
                  <Input
                    id="widget-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="widget-email">Email</Label>
                  <Input
                    id="widget-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>
              {error ? (
                <p className="mt-3 text-sm text-rose-600">{error}</p>
              ) : null}
              <Button type="submit" className="mt-auto h-10 w-full" disabled={starting}>
                {starting ? "Starting..." : "Start Chat"}
              </Button>
            </form>
          ) : (
            <>
              {error ? (
                <div className="bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
              ) : null}
              <MessageThread
                messages={conversation.messages}
                agentName={SUPPORT_LABEL}
                customerName={session.customerName}
                typingLabel={typing}
                perspective="customer"
                emptyLabel="You're connected. Send a message to start the conversation."
              />
              <MessageComposer
                sending={sending}
                placeholder="Type your message..."
                onSend={sendMessage}
                onTyping={sendTyping}
              />
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            const stored = session ?? readSession();
            if (stored && !conversation) {
              void restore(stored);
            }
          }
        }}
        className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-indigo-500"
      >
        <Headset className="size-4" />
        Chat with us
      </button>
    </>
  );
}
