"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { formatRelativeTime } from "@/lib/format";
import { requestJson } from "@/lib/request-json";
import { CreateTicketDialog } from "@/components/chat/create-ticket-dialog";
import type { ConversationDetail } from "@/lib/chat-types";

export function CustomerPanel({
  detail,
  agents = [],
  onCloseConversation,
  onRefresh,
}: {
  detail: ConversationDetail;
  agents?: { id: string; name: string }[];
  onCloseConversation: () => void;
  onRefresh: (next: ConversationDetail) => void;
}) {
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const customer = detail.customer;
  const relatedTickets = customer.tickets.filter(
    (ticket) => ticket.conversationId === detail.id,
  );

  async function addNote() {
    const content = note.trim();
    if (!content) return;
    setSavingNote(true);
    try {
      const payload = await requestJson<{ conversation: ConversationDetail }>(
        `/api/customers/${customer.id}/notes?conversationId=${detail.id}`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        },
      );
      if (payload.conversation) {
        onRefresh(payload.conversation);
      }
      setNote("");
      toast.success("Note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add note");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-background">
      <div className="border-b p-4">
        <div className="flex flex-col items-center text-center">
          <UserAvatar name={customer.name} size="lg" />
          <h2 className="mt-3 text-base font-semibold">{customer.name}</h2>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
          <div className="mt-2">
            <StatusBadge status={customer.status} />
          </div>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{customer.phone ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Company</dt>
            <dd>{customer.company ?? "Not provided"}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {customer.tags.length === 0 ? (
            <span className="text-xs text-muted-foreground">No tags yet</span>
          ) : (
            customer.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
              >
                {tag.name}
              </span>
            ))
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/customers/${customer.id}`}
            className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            View Customer
          </Link>
          <Button variant="outline" onClick={() => setTicketOpen(true)}>
            Create Ticket
          </Button>
          <Button
            variant="outline"
            className="col-span-2"
            disabled={detail.status === "CLOSED"}
            onClick={onCloseConversation}
          >
            Close Conversation
          </Button>
        </div>
      </div>

      <div className="border-b p-4">
        <p className="text-sm font-semibold">Add note</p>
        <Label htmlFor="internal-note" className="sr-only">
          Internal note
        </Label>
        <Textarea
          id="internal-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add an internal note..."
          className="mt-2 min-h-20"
        />
        <Button
          className="mt-2 w-full"
          disabled={savingNote || note.trim().length === 0}
          onClick={() => void addNote()}
        >
          {savingNote ? "Saving..." : "Add Note"}
        </Button>
        <div className="mt-4 space-y-3">
          {customer.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            customer.notes.map((item) => (
              <div key={item.id} className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm">{item.content}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.author.name} · {formatRelativeTime(new Date(item.createdAt))}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm font-semibold">Related Tickets</p>
        <div className="mt-3 space-y-2">
          {relatedTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No related tickets yet.</p>
          ) : (
            relatedTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block rounded-lg border p-3 hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {ticket.ticketNumber}
                  </span>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-1 truncate text-sm font-medium">{ticket.subject}</p>
                <div className="mt-2 flex items-center justify-between">
                  <PriorityBadge priority={ticket.priority} />
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(new Date(ticket.updatedAt))}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <CreateTicketDialog
        open={ticketOpen}
        onOpenChange={setTicketOpen}
        detail={detail}
        agents={agents}
        onCreated={(ticketNumber) => {
          toast.success(`Ticket ${ticketNumber} created.`);
          void refreshAfterTicket(detail.id, onRefresh);
        }}
      />
    </div>
  );
}

async function refreshAfterTicket(
  conversationId: string,
  onRefresh: (next: ConversationDetail) => void,
) {
  const payload = await requestJson<{ conversation: ConversationDetail }>(
    `/api/conversations/${conversationId}`,
  );
  onRefresh(payload.conversation);
}
