import { cn } from "@/lib/utils";

export function OnlineDot({
  online,
  className,
}: {
  online: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-background",
        online ? "bg-emerald-500" : "bg-slate-300",
        className,
      )}
    />
  );
}
