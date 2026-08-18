import { redirect } from "next/navigation";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_AGENTS } from "@/lib/constants";

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

  return (
    <ChatWorkspace
      key={params.conversation ?? "inbox"}
      agent={user}
      initialConversations={[]}
      initialConversationId={params.conversation ?? null}
      initialDetail={null}
      agents={DEMO_AGENTS.map((agent) => ({ id: agent.id, name: agent.name }))}
    />
  );
}
