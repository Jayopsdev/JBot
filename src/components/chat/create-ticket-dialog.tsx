"use client";

import { CreateTicketDialog as SharedCreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import type { ConversationDetail } from "@/lib/chat-types";

export function CreateTicketDialog({
  open,
  onOpenChange,
  detail,
  agents = [],
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: ConversationDetail;
  agents?: { id: string; name: string }[];
  onCreated: (ticketNumber: string) => void;
}) {
  return (
    <SharedCreateTicketDialog
      open={open}
      onOpenChange={onOpenChange}
      customer={detail.customer}
      conversationId={detail.id}
      agents={agents}
      defaultAgentId={detail.assignedAgent?.id ?? agents[0]?.id}
      onCreated={(ticket) => onCreated(ticket.ticketNumber)}
    />
  );
}
