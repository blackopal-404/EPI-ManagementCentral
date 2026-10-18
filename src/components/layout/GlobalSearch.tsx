import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Box, Boxes, Search, Tag, User as UserIcon } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchService, type GlobalSearchResult } from "@/services";

const icons = {
  producto: Box,
  equipo: Boxes,
  categoria: Tag,
  usuario: UserIcon,
} as const;

const groups: { key: GlobalSearchResult["type"]; label: string }[] = [
  { key: "equipo", label: "Equipos individuales" },
  { key: "producto", label: "Productos" },
  { key: "categoria", label: "Categorías" },
  { key: "usuario", label: "Usuarios" },
];

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    searchService.search(query).then((r) => {
      if (active) setResults(r);
    });
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Buscar equipo, número de serie, producto, categoría o usuario…"
      />
      <CommandList>
        <CommandEmpty>
          {query.length < 2
            ? "Escribe al menos dos caracteres, por ejemplo ARN-0001."
            : "Sin resultados para esta búsqueda."}
        </CommandEmpty>
        {groups.map(({ key, label }) => {
          const items = results.filter((r) => r.type === key);
          if (!items.length) return null;
          const Icon = icons[key];
          return (
            <CommandGroup key={key} heading={label}>
              {items.map((item) => (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => {
                    onOpenChange(false);
                    setQuery("");
                    navigate({ to: item.to, params: item.params } as never);
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 min-w-0 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-navy-foreground/70 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label="Abrir búsqueda global"
    >
      <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="hidden truncate lg:inline">Buscar equipo o producto…</span>
    </button>
  );
}
