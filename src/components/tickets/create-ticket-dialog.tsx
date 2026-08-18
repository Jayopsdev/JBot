"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { requestJson } from "@/lib/request-json";

const ticketFormSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(160),
  description: z.string().trim().min(1, "Description is required").max(4000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

type TicketResponse = {
  ticket: { id: string; ticketNumber: string };
  reused?: boolean;
};

export type TicketDialogConversation = {
  id: string;
  status: string;
};

export type TicketDialogAgent = {
  id: string;
  name: string;
};

export function CreateTicketDialog({
  open,
  onOpenChange,
  customer,
  conversationId,
  conversations = [],
  agents = [],
  defaultAgentId,
  defaultSubject = "Payment issue",
  defaultDescription = "Customer needs help with a payment issue from live chat.",
  defaultPriority = "HIGH",
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: { id: string; name: string; email: string };
  conversationId?: string | null;
  conversations?: TicketDialogConversation[];
  agents?: TicketDialogAgent[];
  defaultAgentId?: string;
  defaultSubject?: string;
  defaultDescription?: string;
  defaultPriority?: string;
  onCreated: (ticket: { id: string; ticketNumber: string }) => void;
}) {
  const [subject, setSubject] = useState(defaultSubject);
  const [description, setDescription] = useState(defaultDescription);
  const [priority, setPriority] = useState(defaultPriority);
  const [selectedConversation, setSelectedConversation] = useState(
    conversationId ?? conversations[0]?.id ?? "",
  );
  const [assigneeId, setAssigneeId] = useState(
    defaultAgentId ?? agents[0]?.id ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const lockedConversation = Boolean(conversationId);

  async function handleCreate() {
    if (submitting) return;
    const parsed = ticketFormSchema.safeParse({ subject, description, priority });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the ticket details");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const payload = await requestJson<TicketResponse>("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          customerId: customer.id,
          conversationId: lockedConversation
            ? conversationId
            : selectedConversation || null,
          subject: parsed.data.subject,
          description: parsed.data.description,
          priority: parsed.data.priority,
          assignedAgentId: assigneeId || undefined,
        }),
      });
      onOpenChange(false);
      onCreated(payload.ticket);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create ticket</DialogTitle>
          <DialogDescription>
            Linked to this customer and saved to the local SQLite workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Input value={`${customer.name} · ${customer.email}`} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>Conversation</Label>
            {lockedConversation || conversations.length === 0 ? (
              <Input
                value={conversationId ?? "No linked conversation"}
                readOnly
                className="font-mono text-xs"
              />
            ) : (
              <Select
                value={selectedConversation}
                onValueChange={(value) => setSelectedConversation(String(value ?? ""))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conversations.map((conversation) => (
                    <SelectItem key={conversation.id} value={conversation.id}>
                      {conversation.id.slice(0, 10)} · {conversation.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(String(value ?? "HIGH"))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">LOW</SelectItem>
                <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                <SelectItem value="HIGH">HIGH</SelectItem>
                <SelectItem value="URGENT">URGENT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {agents.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Assigned agent</Label>
              <Select
                value={assigneeId}
                onValueChange={(value) => setAssigneeId(String(value ?? ""))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={submitting} onClick={() => void handleCreate()}>
            {submitting ? "Creating..." : "Create ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
