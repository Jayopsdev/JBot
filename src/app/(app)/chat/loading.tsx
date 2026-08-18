import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] gap-0 md:-m-6">
      <Skeleton className="h-full w-80 rounded-none" />
      <Skeleton className="h-full flex-1 rounded-none" />
      <Skeleton className="hidden h-full w-80 rounded-none xl:block" />
    </div>
  );
}
