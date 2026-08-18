import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Ticket,
  Users,
} from "lucide-react";

export const APP_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Live Chat", icon: MessageSquare, badgeKey: "chat" as const },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
