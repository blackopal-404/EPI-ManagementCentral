import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning-foreground",
  danger: "text-danger",
} as const;

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: keyof typeof tones;
}) {
  return (
    <article className="panel p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <p className="label-caps min-w-0">{label}</p>
        {Icon ? <Icon className={cn("h-4 w-4 shrink-0", tones[tone])} aria-hidden="true" /> : null}
      </div>
      <p className={cn("mt-2 text-3xl font-bold tracking-tight", tones[tone])}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </article>
  );
}
