import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  OPEN: "border-sky-200 bg-sky-50 text-sky-800",
  IN_PROGRESS: "border-indigo-200 bg-indigo-50 text-indigo-800",
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-700",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-800",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-700",
  ONLINE: "border-emerald-200 bg-emerald-50 text-emerald-800",
  AWAY: "border-amber-200 bg-amber-50 text-amber-800",
  OFFLINE: "border-slate-200 bg-slate-50 text-slate-700",
  ADMIN: "border-indigo-200 bg-indigo-50 text-indigo-800",
  AGENT: "border-slate-200 bg-slate-50 text-slate-700",
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-700",
  MEDIUM: "border-blue-200 bg-blue-50 text-blue-800",
  HIGH: "border-orange-200 bg-orange-50 text-orange-800",
  URGENT: "border-rose-200 bg-rose-50 text-rose-800",
};

function prettyLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_STYLES[status] ?? STATUS_STYLES.OPEN)}
    >
      {prettyLabel(status)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.MEDIUM,
      )}
    >
      {prettyLabel(priority)}
    </Badge>
  );
}
