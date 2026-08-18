import { Headset } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  inverted = false,
}: {
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-lg text-white shadow-sm",
          inverted ? "bg-white/15" : "bg-indigo-500",
        )}
      >
        <Headset className="size-4" />
      </div>
      {compact ? null : (
        <div>
          <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
          <p
            className={cn(
              "text-[11px]",
              inverted ? "text-white/60" : "text-muted-foreground",
            )}
          >
            {APP_TAGLINE}
          </p>
        </div>
      )}
    </div>
  );
}
