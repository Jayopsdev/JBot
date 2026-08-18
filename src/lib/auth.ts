import { getSession } from "@/lib/session";
import { DEMO_AGENTS } from "@/lib/constants";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  avatar: string | null;
  status: "ONLINE" | "OFFLINE" | "AWAY";
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session) return null;

  const agent = DEMO_AGENTS.find((item) => item.id === session.sub);
  if (!agent) return null;

  return {
    id: agent.id,
    name: agent.name,
    email: agent.email,
    role: agent.role,
    avatar: null,
    status: agent.status,
  };
}
