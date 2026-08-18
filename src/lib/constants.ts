export const DEMO_PASSWORD = "Demo123!";

export const DEMO_AGENTS = [
  {
    id: "user_alex",
    name: "Alex Johnson",
    email: "alex@supporthub.local",
    role: "ADMIN" as const,
    status: "ONLINE" as const,
  },
  {
    id: "user_sarah",
    name: "Sarah Williams",
    email: "sarah@supporthub.local",
    role: "AGENT" as const,
    status: "ONLINE" as const,
  },
  {
    id: "user_david",
    name: "David Kumar",
    email: "david@supporthub.local",
    role: "AGENT" as const,
    status: "AWAY" as const,
  },
] as const;

export const DEMO_ACCOUNTS = DEMO_AGENTS.map((agent) => ({
  name: agent.name,
  email: agent.email,
  role: agent.role === "ADMIN" ? "Admin" : "Agent",
}));

export const SESSION_COOKIE = "sh_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const AVATAR_COLORS = [
  "bg-indigo-600",
  "bg-sky-600",
  "bg-violet-600",
  "bg-teal-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-emerald-600",
  "bg-blue-700",
] as const;
