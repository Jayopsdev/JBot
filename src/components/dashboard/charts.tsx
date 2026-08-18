import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BarItem = {
  label: string;
  count: number;
};

export function DistributionBars({
  title,
  description,
  items,
  colorClass,
}: {
  title: string;
  description: string;
  items: BarItem[];
  colorClass: string;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${colorClass}`}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function VolumeChart({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: BarItem[];
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-end gap-3">
          {items.map((item) => (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-indigo-500/80"
                  style={{ height: `${Math.max((item.count / max) * 100, 8)}%` }}
                  title={`${item.count} messages`}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
