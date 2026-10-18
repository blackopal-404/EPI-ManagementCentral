import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services";
import { Download, FileBarChart } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/reportes")({ component: ReportsPage });

function ReportsPage() {
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: reportService.getReports,
  });
  const [busy, setBusy] = useState<string | null>(null);

  async function exportReport(id: string, format: "excel" | "pdf") {
    setBusy(id + format);
    try {
      await reportService.export(id, format);
      alert(`Exportación demo preparada en formato ${format.toUpperCase()}.`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="label-caps">Información operativa</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">Reportes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catálogo de reportes preparados para una futura exportación real desde backend.
        </p>
      </header>

      <div className="grid gap-3">
        {(data ?? []).map((report) => (
          <section key={report.id} className="panel p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-accent text-primary">
                  <FileBarChart className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold">{report.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {report.rows} filas · Actualizado {report.updatedAt}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => exportReport(report.id, "excel")}
                  disabled={!!busy}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {busy === report.id + "excel" ? "Preparando…" : "Excel"}
                </button>
                <button
                  onClick={() => exportReport(report.id, "pdf")}
                  disabled={!!busy}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {busy === report.id + "pdf" ? "Preparando…" : "PDF"}
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
