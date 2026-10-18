
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-48 place-items-center p-8 text-center">
      <div>
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-3 font-semibold">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
