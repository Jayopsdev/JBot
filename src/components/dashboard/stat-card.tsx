import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  accent: string;
  href?: string;
}) {
  const content = (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            accent,
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
