import { MessageSquare, Settings, Ticket, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  countLabel,
  count,
}: {
  title: string;
  description: string;
  icon: typeof MessageSquare;
  countLabel: string;
  count: number;
}) {
  return (
    <div className="mx-auto max-w-2xl pb-16 md:pb-0">
      <Card className="shadow-none">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <Icon className="size-5" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium">{countLabel}</p>
            <p className="mt-1 text-2xl font-semibold">{count}</p>
            <p className="mt-2 text-muted-foreground">
              Seeded records are already in the local SQLite database and will
              be wired into this view in the next implementation step.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { MessageSquare, Settings, Ticket, Users };
