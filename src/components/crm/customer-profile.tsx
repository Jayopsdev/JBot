"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { OnlineDot } from "@/components/chat/online-dot";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { formatRelativeTime } from "@/lib/format";
import { requestJson } from "@/lib/request-json";
import type { CustomerProfile } from "@/lib/data/customers";

export function CustomerProfileView({
  initial,
  agents,
  online = false,
}: {
  initial: CustomerProfile;
  agents: { id: string; name: string }[];
  online?: boolean;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState(initial);
  const [editOpen, setEditOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tagName, setTagName] = useState("");
  const [saving, setSaving] = useState(false);

  async function refreshFrom(payload: { customer: CustomerProfile }) {
    setCustomer(payload.customer);
    router.refresh();
  }

  async function saveCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const payload = await requestJson<{ customer: CustomerProfile }>(
        `/api/customers/${customer.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone") || null,
            company: form.get("company") || null,
            status: form.get("status"),
          }),
        },
      );
      await refreshFrom(payload);
      setEditOpen(false);
      toast.success("Customer updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update customer");
    } finally {
      setSaving(false);
    }
  }

  async function saveNote() {
    const content = noteContent.trim();
    if (!content) return;
    setSaving(true);
    try {
      const url = editingNoteId
        ? `/api/customers/${customer.id}/notes/${editingNoteId}`
        : `/api/customers/${customer.id}/notes`;
      const payload = await requestJson<{ customer: CustomerProfile }>(url, {
        method: editingNoteId ? "PATCH" : "POST",
        body: JSON.stringify({ content }),
      });
      await refreshFrom(payload);
      setNoteContent("");
      setEditingNoteId(null);
      toast.success(editingNoteId ? "Note updated" : "Note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save note");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(noteId: string) {
    try {
      const payload = await requestJson<{ customer: CustomerProfile }>(
        `/api/customers/${customer.id}/notes/${noteId}`,
        { method: "DELETE" },
      );
      await refreshFrom(payload);
      toast.success("Note deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete note");
    }
  }

  async function addTag(event: React.FormEvent) {
    event.preventDefault();
    const name = tagName.trim();
    if (!name) return;
    try {
      const payload = await requestJson<{ customer: CustomerProfile }>(
        `/api/customers/${customer.id}/tags`,
        { method: "POST", body: JSON.stringify({ name }) },
      );
      await refreshFrom(payload);
      setTagName("");
      toast.success("Tag added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add tag");
    }
  }

  async function removeTag(tagId: string) {
    const payload = await requestJson<{ customer: CustomerProfile }>(
      `/api/customers/${customer.id}/tags/${tagId}`,
      { method: "DELETE" },
    );
    await refreshFrom(payload);
  }

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div className="flex flex-col justify-between gap-4 rounded-xl border bg-background p-5 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar name={customer.name} avatar={customer.avatar} size="lg" />
            <OnlineDot online={online} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">
              {online ? "Online" : "Offline"} · {customer.email}
            </p>
            <p className="text-sm text-muted-foreground">
              {customer.phone ?? "No phone"} · {customer.company ?? "No company"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit Customer
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingNoteId(null);
              setNoteContent("");
              setTab("notes");
            }}
          >
            Add Note
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTab("overview");
              window.setTimeout(() => document.getElementById("customer-tag")?.focus(), 0);
            }}
          >
            Add Tag
          </Button>
          <Button onClick={() => setTicketOpen(true)}>Create Ticket</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Conversations" value={customer.stats.totalConversations} />
        <SummaryCard label="Open Tickets" value={customer.stats.openTickets} />
        <SummaryCard label="Resolved Tickets" value={customer.stats.resolvedTickets} />
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Last Contact</p>
            <p className="mt-2 text-lg font-semibold">
              {formatRelativeTime(new Date(customer.stats.lastContact))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(String(value ?? "overview"))}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Contact information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Email" value={customer.email} />
              <Row label="Phone" value={customer.phone ?? "Not provided"} />
              <Row label="Company" value={customer.company ?? "Not provided"} />
              <div>
                <p className="text-muted-foreground">Customer status</p>
                <div className="mt-1">
                  <StatusBadge status={customer.status} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {customer.tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags yet.</p>
                ) : (
                  customer.tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => void removeTag(tag.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      {tag.name}
                      <span className="text-indigo-400">×</span>
                    </button>
                  ))
                )}
              </div>
              <form onSubmit={addTag} className="mt-4 flex gap-2">
                <Input
                  id="customer-tag"
                  value={tagName}
                  onChange={(event) => setTagName(event.target.value)}
                  placeholder="Add tag, e.g. VIP"
                />
                <Button type="submit" variant="outline">
                  <Plus className="size-4" />
                  Add Tag
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {customer.conversations.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No conversations yet.
                </p>
              ) : (
                <div className="divide-y">
                  {customer.conversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/chat?conversation=${conversation.id}`}
                      className="block px-5 py-4 hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-xs text-muted-foreground">
                          {conversation.id}
                        </p>
                        <StatusBadge status={conversation.status} />
                      </div>
                      <p className="mt-1 truncate text-sm">
                        {conversation.lastMessage?.content ?? "No messages yet"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {conversation.assignedAgent?.name ?? "Unassigned"} ·{" "}
                        {formatRelativeTime(new Date(conversation.updatedAt))}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {customer.tickets.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No tickets yet.
                </p>
              ) : (
                <div className="divide-y">
                  {customer.tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="block px-5 py-4 hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          {ticket.ticketNumber} · {ticket.subject}
                        </p>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <PriorityBadge priority={ticket.priority} />
                        <span className="text-xs text-muted-foreground">
                          {ticket.assignedAgent?.name ?? "Unassigned"} ·{" "}
                          {formatRelativeTime(new Date(ticket.updatedAt))}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Internal notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer-note">
                  {editingNoteId ? "Edit note" : "Add note"}
                </Label>
                <Textarea
                  id="customer-note"
                  value={noteContent}
                  onChange={(event) => setNoteContent(event.target.value)}
                  className="mt-2 min-h-24"
                />
                <Button className="mt-2" disabled={saving} onClick={() => void saveNote()}>
                  {editingNoteId ? "Update note" : "Add Note"}
                </Button>
              </div>
              {customer.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                customer.notes.map((note) => (
                  <div key={note.id} className="rounded-lg border p-3">
                    <p className="text-sm">{note.content}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {note.author.name} · {formatRelativeTime(new Date(note.createdAt))}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setNoteContent(note.content);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void deleteNote(note.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                customer.timeline.slice(0, 40).map((event) => (
                  <Link
                    key={event.id}
                    href={event.href ?? `/customers/${customer.id}`}
                    className="block border-l-2 border-indigo-200 pl-4 hover:bg-muted/40"
                  >
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(event.createdAt))}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={saveCustomer}>
            <DialogHeader>
              <DialogTitle>Edit customer</DialogTitle>
            </DialogHeader>
            <div className="mt-3 space-y-3">
              <Field name="name" label="Name" defaultValue={customer.name} />
              <Field name="email" label="Email" defaultValue={customer.email} />
              <Field name="phone" label="Phone" defaultValue={customer.phone ?? ""} />
              <Field name="company" label="Company" defaultValue={customer.company ?? ""} />
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={customer.status}
                  className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreateTicketDialog
        open={ticketOpen}
        onOpenChange={setTicketOpen}
        customer={customer}
        conversations={customer.conversations}
        agents={agents}
        onCreated={(ticket) => {
          toast.success(`Ticket ${ticket.ticketNumber} created.`);
          router.refresh();
          void requestJson<{ customer: CustomerProfile }>(`/api/customers/${customer.id}`).then(
            (payload) => setCustomer(payload.customer),
          );
        }}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="shadow-sm">
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} />
    </div>
  );
}
