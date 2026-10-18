import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";
import { Camera, CameraOff, Loader2 } from "lucide-react";

type ScanFormat = "Data Matrix" | "QR";

function getFormatLabel(format: BarcodeFormat | undefined): ScanFormat {
  return format === BarcodeFormat.DATA_MATRIX ? "Data Matrix" : "QR";
}

export function CameraQrScanner({
  onDetected,
  formats = [BarcodeFormat.DATA_MATRIX, BarcodeFormat.QR_CODE],
  title = "Activar cámara y escanear",
  searchingLabel = "Buscando Data Matrix o QR…",
}: {
  onDetected: (value: string, format?: ScanFormat) => void;
  formats?: BarcodeFormat[];
  title?: string;
  searchingLabel?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [detectedFormat, setDetectedFormat] = useState<ScanFormat | null>(null);

  useEffect(() => () => stop(), []);

  async function start() {
    setError("");
    setDetectedFormat(null);

    if (!window.isSecureContext) {
      setError("La cámara requiere localhost o HTTPS.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador no permite acceso a la cámara.");
      return;
    }

    try {
      const reader = new BrowserMultiFormatReader();
      reader.possibleFormats = formats;
      readerRef.current = reader;

      setRunning(true);
      controlsRef.current = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        videoRef.current!,
        (result, decodeError) => {
          if (result) {
            const format = getFormatLabel(result.getBarcodeFormat());
            setDetectedFormat(format);
            onDetected(result.getText(), format);
            stop();
            return;
          }

          // ZXing reports NotFoundException continuously while searching.
          // Other errors are intentionally ignored here so the camera can keep scanning.
          void decodeError;
        },
      );
    } catch (e) {
      setRunning(false);
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Permiso de cámara denegado. Habilítalo en el navegador."
          : e instanceof Error
            ? e.message
            : "No se pudo iniciar la cámara.",
      );
    }
  }

  function stop() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-44 w-44 rounded-2xl border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,.28)]" />
        </div>
        {!running && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 text-white">
            <div className="text-center">
              <Camera className="mx-auto h-10 w-10" />
              <p className="mt-2 text-sm font-semibold">Cámara detenida</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {detectedFormat && !running && (
        <p className="text-xs font-semibold text-success">Código detectado: {detectedFormat}</p>
      )}

      {running ? (
        <button
          type="button"
          onClick={stop}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-bold"
        >
          <CameraOff className="h-4 w-4" /> Detener cámara
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
        >
          <Camera className="h-4 w-4" /> {title}
        </button>
      )}

      {running && (
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {searchingLabel}
        </p>
      )}
    </div>
  );
}
