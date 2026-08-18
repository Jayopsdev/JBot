"use client";

import { useEffect, useRef } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/chat-types";

export function MessageThread({
  messages,
  agentName,
  customerName,
  typingLabel,
  perspective = "agent",
  emptyLabel = "No messages yet. Send a reply to start helping this customer.",
}: {
  messages: ChatMessage[];
  agentName: string;
  customerName: string;
  typingLabel?: string | null;
  perspective?: "agent" | "customer";
  emptyLabel?: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingLabel]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <div className="space-y-4">
        {messages.map((message) => {
          const fromAgent = message.senderType === "AGENT";
          const fromSystem = message.senderType === "SYSTEM";
          const mine =
            perspective === "agent" ? fromAgent : message.senderType === "CUSTOMER";
          const name = fromAgent ? agentName : customerName;

          if (fromSystem) {
            return (
              <div
                key={message.id}
                className="text-center text-xs text-muted-foreground"
              >
                {message.content}
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={cn(
                "flex items-end gap-2",
                mine ? "justify-end" : "justify-start",
              )}
            >
              {!mine ? <UserAvatar name={name} size="sm" /> : null}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 shadow-sm",
                  mine
                    ? "rounded-br-md bg-indigo-600 text-white"
                    : "rounded-bl-md bg-slate-100 text-slate-900",
                )}
              >
                <p className="text-sm leading-5 whitespace-pre-wrap">
                  {message.content}
                </p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    mine ? "text-indigo-100" : "text-slate-500",
                  )}
                >
                  {formatTime(new Date(message.createdAt))}
                </p>
              </div>
              {mine ? <UserAvatar name={name} size="sm" /> : null}
            </div>
          );
        })}
        {typingLabel ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex gap-1 rounded-full bg-slate-100 px-2 py-2">
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400" />
              <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]" />
            </span>
            {typingLabel}
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
    </div>
  );
}
