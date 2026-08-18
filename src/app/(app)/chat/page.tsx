import { redirect } from "next/navigation";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { getCurrentUser } from "@/lib/auth";
import { getConversationDetail, listConversations } from "@/lib/data/chat";
import { listAgents } from "@/lib/data/tickets";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const [conversations, agents, initialDetail] = await Promise.all([
    listConversations(),
    listAgents(),
    params.conversation ? getConversationDetail(params.conversation) : Promise.resolve(null),
  ]);

  return (
    <ChatWorkspace
      key={initialDetail?.id ?? "inbox"}
      agent={user}
      initialConversations={conversations}
      initialConversationId={initialDetail?.id ?? null}
      initialDetail={initialDetail}
      agents={agents}
    />
  );
}
