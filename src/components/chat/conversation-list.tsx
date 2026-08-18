"use client";

import { MessageSquare, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { StatusBadge } from "@/components/status-badge";
import { OnlineDot } from "@/components/chat/online-dot";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/chat-types";

export function ConversationList({
  conversations,
  selectedId,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onSelect,
}: {
  conversations: ConversationSummary[];
  selectedId: string | null;
  search: string;
  statusFilter: "ALL" | "OPEN" | "CLOSED";
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "ALL" | "OPEN" | "CLOSED") => void;
  onSelect: (id: string) => void;
}) {
  const visible = conversations.filter((conversation) => {
    const matchesStatus =
      statusFilter === "ALL" || conversation.status === statusFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      conversation.customer.name.toLowerCase().includes(query) ||
      conversation.customer.email.toLowerCase().includes(query) ||
      (conversation.lastMessage?.content.toLowerCase().includes(query) ?? false);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex h-full min-h-0 flex-col border-r bg-background">
      <div className="border-b p-3">
        <p className="mb-3 text-sm font-semibold">Conversations</p>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search customers..."
            className="h-9 bg-muted/40 pl-8"
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {(["ALL", "OPEN", "CLOSED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatusFilterChange(status)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium",
                statusFilter === status
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {status === "ALL" ? "All" : status === "OPEN" ? "Open" : "Closed"}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations"
            description="New customer chats from the website widget will appear here."
          />
        ) : (
          visible.map((conversation) => {
            const selected = conversation.id === selectedId;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelect(conversation.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b px-3 py-3 text-left hover:bg-muted/50",
                  selected && "bg-indigo-50 hover:bg-indigo-50",
                )}
              >
                <div className="relative">
                  <UserAvatar name={conversation.customer.name} />
                  <OnlineDot online={conversation.customerOnline} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        conversation.unreadCount > 0
                          ? "font-semibold"
                          : "font-medium",
                      )}
                    >
                      {conversation.customer.name}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(new Date(conversation.updatedAt))}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {conversation.lastMessage?.content ?? "No messages yet"}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <StatusBadge status={conversation.status} />
                    {conversation.unreadCount > 0 ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
