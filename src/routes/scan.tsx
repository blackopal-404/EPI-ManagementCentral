import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, ScanLine } from "lucide-react";
import { codeService, equipmentService, productService } from "@/services";
import { EquipmentStatusBadge } from "@/components/common/StatusBadge";
import { CameraQrScanner } from "@/components/qr/CameraQrScanner";

export const Route = createFileRoute("/scan")({ component: ScanPage });

function ScanPage() {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<any>();
  const [scanning, setScanning] = useState(false);
  const [format, setFormat] = useState<string | null>(null);
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => productService.getProducts() });

  async function lookup(value: string, detectedFormat?: string) {
    setRaw(value);
    setFormat(detectedFormat ?? null);
    setResult(await equipmentService.getEquipmentByScanCode(value));
  }

  async function demo() {
    setScanning(true);
    setFormat("QR (demo)");
    const code = await codeService.scan();
    await lookup(code, "QR (demo)");
    setScanning(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="label-caps">Identificación</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">Escanear equipo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Usa la cámara para leer el Data Matrix de una unidad Petzl o un código QR compatible. El contenido leído se usa para localizar la unidad por número de serie o código interno.
        </p>
      </header>

      <section className="panel p-4 sm:p-6">
        <CameraQrScanner onDetected={lookup} />

        {format && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-xs">
            <span className="font-bold">Formato detectado:</span> {format}
            {raw && <span className="ml-2 mono-code break-all">{raw}</span>}
          </div>
        )}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">o usa una simulación</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {import.meta.env.DEV && <button
          onClick={demo}
          disabled={scanning}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-bold hover:bg-muted disabled:opacity-50"
        >
          <ScanLine className="h-4 w-4" />
          {scanning ? "Identificando…" : "Simular identificación"}
        </button>}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">o introduce el contenido</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex gap-2">
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Número de serie, Data Matrix, EQUIPMENT:ARN-0001 o ARN-0001"
            className="h-10 min-w-0 flex-1 rounded-md border border-input px-3 text-sm"
          />
          <button
            onClick={() => lookup(raw)}
            className="rounded-md border border-border px-4 text-sm font-bold hover:bg-muted"
          >
            Buscar
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <img
              src="/qr-demo-arn-0001.png"
              alt="Código QR de prueba EQUIPMENT:ARN-0001"
              className="h-28 w-28 rounded bg-white p-2"
            />
            <div>
              <p className="text-sm font-bold">QR de prueba</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Este QR mantiene la prueba del lector existente. En producción, el mismo lector acepta Data Matrix y puede usar su número de serie para localizar el equipo.
              </p>
              <p className="mono-code mt-2 text-[11px]">EQUIPMENT:ARN-0001</p>
            </div>
          </div>
        </div>
      </section>

      {raw && result === undefined && (
        <div className="panel flex items-center gap-3 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <p className="font-semibold">No se encontró una unidad</p>
            <p className="text-muted-foreground">Revisa el número de serie o el contenido del código.</p>
          </div>
        </div>
      )}

      {result && (
        <section className="panel p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mono-code text-xs text-muted-foreground">
                {result.internalCode} · {result.serialNumber}
              </p>
              <h2 className="mt-1 font-display text-xl font-bold">
                {products.find(product => product.id === result.productId)?.name ?? "Producto"}
              </h2>
            </div>
            <EquipmentStatusBadge status={result.status} />
          </div>
          <Link
            to="/equipos/unidad/$internalCode"
            params={{ internalCode: result.internalCode }}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Abrir ficha individual <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}
    </div>
  );
}
