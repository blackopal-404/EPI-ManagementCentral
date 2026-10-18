import { AlertTriangle, Ban, Info } from "lucide-react";
import type { AlertItem } from "@/types";
import { cn } from "@/lib/utils";

const config = {
  info: { icon: Info, wrap: "border-primary/25 bg-accent", text: "text-accent-foreground" },
  warning: { icon: AlertTriangle, wrap: "border-warning/40 bg-warning-soft", text: "text-warning-foreground" },
  danger: { icon: Ban, wrap: "border-danger/30 bg-danger-soft", text: "text-danger" },
} as const;

export function AlertRow({ alert }: { alert: AlertItem }) {
  const c = config[alert.severity];
  const Icon = c.icon;
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-3", c.wrap)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", c.text)} aria-hidden="true" />
      <div className="min-w-0">
        <p className={cn("text-sm font-semibold", c.text)}>{alert.title}</p>
        <p className="mt-0.5 text-sm break-words text-muted-foreground">{alert.message}</p>
      </div>
    </div>
  );
}
