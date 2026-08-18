export const DEMO_PASSWORD = "Demo123!";

export const DEMO_ACCOUNTS = [
  {
    name: "Alex Johnson",
    email: "alex@supporthub.local",
    role: "Admin",
  },
  {
    name: "Sarah Williams",
    email: "sarah@supporthub.local",
    role: "Agent",
  },
  {
    name: "David Kumar",
    email: "david@supporthub.local",
    role: "Agent",
  },
] as const;

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
