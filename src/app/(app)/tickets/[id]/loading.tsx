import { Skeleton } from "@/components/ui/skeleton";

export default function TicketDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 w-full" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
