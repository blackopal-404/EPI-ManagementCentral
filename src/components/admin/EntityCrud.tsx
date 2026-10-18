import { useMemo, useState, type ReactNode } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CrudColumn<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  hideOnMobile?: boolean;
}

export interface CrudField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date" | "select" | "number";
  options?: { value: string; label: string }[];
  placeholder?: string;
  span?: 1 | 2;
}

type FormValues = Record<string, string>;

export function EntityCrud<T>({
  entityLabel,
  items,
  columns,
  fields,
  getId,
  getTitle,
  toSearchText,
  toForm,
  detail,
}: {
  entityLabel: string;
  items: T[];
  columns: CrudColumn<T>[];
  fields: CrudField[];
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  toSearchText: (item: T) => string;
  toForm: (item: T) => FormValues;
  detail?: (item: T) => ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | "view" | null>(null);
  const [current, setCurrent] = useState<T | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [deleting, setDeleting] = useState<T | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => toSearchText(item).toLowerCase().includes(q));
  }, [items, query, toSearchText]);

  const openCreate = () => {
    setCurrent(null);
    setValues({});
    setMode("create");
  };
  const openEdit = (item: T) => {
    setCurrent(item);
    setValues(toForm(item));
    setMode("edit");
  };
  const openView = (item: T) => {
    setCurrent(item);
    setMode("view");
  };

  const submit = () => {
    toast.success(
      mode === "create" ? `${entityLabel} creado (simulación)` : `${entityLabel} actualizado (simulación)`,
      { description: "Los cambios no se guardan: el backend se conectará más adelante." },
    );
    setMode(null);
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,320px)_auto] sm:items-center sm:justify-between">
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar ${entityLabel.toLowerCase()}…`}
            className="pl-9"
            aria-label={`Buscar ${entityLabel.toLowerCase()}`}
          />
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo {entityLabel.toLowerCase()}
        </Button>
      </div>

      {/* Tabla en pantallas medianas y superiores */}
      <div className="panel hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left">
              {columns.map((c) => (
                <th key={c.key} scope="col" className="px-4 py-2.5 label-caps">
                  {c.label}
                </th>
              ))}
              <th scope="col" className="px-4 py-2.5 text-right label-caps">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={getId(item)} className="border-b border-border last:border-0 hover:bg-muted/40">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 align-middle">
                    {c.render(item)}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <RowAction label="Ver" icon={Eye} onClick={() => openView(item)} />
                    <RowAction label="Editar" icon={Pencil} onClick={() => openEdit(item)} />
                    <RowAction label="Eliminar" icon={Trash2} onClick={() => setDeleting(item)} danger />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
        ) : null}
      </div>

      {/* Tarjetas en móvil */}
      <div className="grid gap-3 md:hidden">
        {filtered.map((item) => (
          <article key={getId(item)} className="panel p-4">
            <h3 className="text-sm font-bold break-words">{getTitle(item)}</h3>
            <dl className="mt-2 grid gap-2">
              {columns.slice(1).map((c) => (
                <div key={c.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <dt className="label-caps min-w-0">{c.label}</dt>
                  <dd className="text-right text-xs font-medium">{c.render(item)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => openView(item)}>
                Ver
              </Button>
              <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleting(item)}>
                Eliminar
              </Button>
            </div>
          </article>
        ))}
        {!filtered.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
        ) : null}
      </div>

      <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? `Nuevo ${entityLabel.toLowerCase()}`
                : mode === "edit"
                  ? `Editar ${entityLabel.toLowerCase()}`
                  : (current && getTitle(current)) || entityLabel}
            </DialogTitle>
            <DialogDescription>
              {mode === "view"
                ? "Vista de solo lectura con los datos simulados del registro."
                : "Formulario de demostración: los datos no se envían a ningún servidor."}
            </DialogDescription>
          </DialogHeader>

          {mode === "view" && current ? (
            (detail?.(current) ?? (
              <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(toForm(current)).map(([key, value]) => (
                  <div key={key} className="min-w-0">
                    <dt className="label-caps">
                      {fields.find((f) => f.name === key)?.label ?? key}
                    </dt>
                    <dd className="text-sm font-medium break-words">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
            ))
          ) : (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={field.span === 2 || field.type === "textarea" ? "sm:col-span-2" : undefined}
                >
                  <Label htmlFor={`f-${field.name}`} className="mb-1.5 block text-xs font-semibold">
                    {field.label}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={`f-${field.name}`}
                      value={values[field.name] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                      rows={3}
                    />
                  ) : field.type === "select" ? (
                    <Select
                      value={values[field.name] ?? ""}
                      onValueChange={(v) => setValues({ ...values, [field.name]: v })}
                    >
                      <SelectTrigger id={`f-${field.name}`}>
                        <SelectValue placeholder="Seleccionar…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options ?? []).map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`f-${field.name}`}
                      type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                      value={values[field.name] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                    />
                  )}
                </div>
              ))}
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setMode(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar {entityLabel.toLowerCase()}</DialogTitle>
            <DialogDescription>
              {deleting ? `${getTitle(deleting)} se eliminaría del sistema.` : ""} Esta acción es una
              simulación: el backend validará la autorización y la trazabilidad.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.success(`${entityLabel} eliminado (simulación)`);
                setDeleting(null);
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function RowAction({
  label,
  icon: Icon,
  onClick,
  danger,
}: {
  label: string;
  icon: typeof Eye;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-md border border-border transition-colors hover:bg-muted ${
        danger ? "text-danger" : "text-muted-foreground"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
