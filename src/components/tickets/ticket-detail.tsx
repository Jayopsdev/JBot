"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { formatRelativeTime } from "@/lib/format";
import { requestJson } from "@/lib/request-json";
import type { TicketDetail } from "@/lib/data/tickets";

const STATUSES = ["OPEN", "IN_PROGRESS", "PENDING", "RESOLVED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export function TicketDetailView({
  initial,
  agents,
}: {
  initial: TicketDetail;
  agents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initial);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function patchTicket(data: {
    status?: string;
    priority?: string;
    assignedAgentId?: string | null;
  }) {
    setSaving(true);
    try {
      const payload = await requestJson<{ ticket: TicketDetail }>(
        `/api/tickets/${ticket.id}`,
        { method: "PATCH", body: JSON.stringify(data) },
      );
      setTicket(payload.ticket);
      toast.success("Ticket updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update ticket");
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    const content = note.trim();
    if (!content) return;
    setSaving(true);
    try {
      await requestJson(`/api/customers/${ticket.customer.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      const payload = await requestJson<{ ticket: TicketDetail }>(
        `/api/tickets/${ticket.id}`,
      );
      setTicket(payload.ticket);
      setNote("");
      toast.success("Note added");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div className="flex flex-col justify-between gap-4 rounded-xl border bg-background p-5 lg:flex-row lg:items-start">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{ticket.ticketNumber}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{ticket.subject}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{ticket.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="text-xs text-muted-foreground">
              Created {formatRelativeTime(new Date(ticket.createdAt))} · Updated{" "}
              {formatRelativeTime(new Date(ticket.updatedAt))}
            </span>
          </div>
        </div>
        <div className="grid w-full max-w-md gap-3 sm:grid-cols-3 lg:w-96 lg:grid-cols-1">
          <Control
            label="Status"
            value={ticket.status}
            disabled={saving}
            onChange={(value) => void patchTicket({ status: value })}
            options={STATUSES.map((status) => [status, status])}
          />
          <Control
            label="Priority"
            value={ticket.priority}
            disabled={saving}
            onChange={(value) => void patchTicket({ priority: value })}
            options={PRIORITIES.map((priority) => [priority, priority])}
          />
          <Control
            label="Assigned agent"
            value={ticket.assignedAgent?.id ?? ""}
            disabled={saving}
            onChange={(value) => void patchTicket({ assignedAgentId: value || null })}
            options={agents.map((agent) => [agent.id, agent.name])}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Customer information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={ticket.customer.name} avatar={ticket.customer.avatar} />
              <div>
                <Link
                  href={`/customers/${ticket.customer.id}`}
                  className="font-medium hover:text-indigo-700"
                >
                  {ticket.customer.name}
                </Link>
                <p className="text-sm text-muted-foreground">{ticket.customer.email}</p>
              </div>
            </div>
            <p className="text-sm">{ticket.customer.phone ?? "No phone"}</p>
            <p className="text-sm">{ticket.customer.company ?? "No company"}</p>
            <StatusBadge status={ticket.customer.status} />
            <div className="flex flex-wrap gap-1.5">
              {ticket.customer.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Related conversation</CardTitle>
          </CardHeader>
          <CardContent>
            {!ticket.conversation ? (
              <p className="text-sm text-muted-foreground">No linked conversation.</p>
            ) : (
              <Link
                href={`/chat?conversation=${ticket.conversation.id}`}
                className="block rounded-lg border p-3 hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-muted-foreground">
                    {ticket.conversation.id}
                  </p>
                  <StatusBadge status={ticket.conversation.status} />
                </div>
                <p className="mt-2 truncate text-sm">
                  {ticket.conversation.messages[0]?.content ?? "No messages yet"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRelativeTime(new Date(ticket.conversation.updatedAt))}
                </p>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Internal notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="ticket-note" className="sr-only">
                Add note
              </Label>
              <Textarea
                id="ticket-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add an internal note..."
                className="min-h-20"
              />
              <Button
                className="mt-2"
                disabled={saving || note.trim().length === 0}
                onClick={() => void addNote()}
              >
                Add Note
              </Button>
            </div>
            {ticket.customer.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              ticket.customer.notes.map((item) => (
                <div key={item.id} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm">{item.content}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {item.author.name} · {formatRelativeTime(new Date(item.createdAt))}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Activity history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            ticket.activities.map((event) => (
              <div key={event.id} className="relative border-l-2 border-indigo-200 pl-4">
                <span className="absolute -left-1.5 top-1.5 size-2.5 rounded-full bg-indigo-500" />
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRelativeTime(new Date(event.createdAt))}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Control({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[] | [string, string][];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          const nextValue = String(next ?? "");
          if (nextValue && nextValue !== value) onChange(nextValue);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
