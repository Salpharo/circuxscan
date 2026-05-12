import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, RefreshCw, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScanOverlay from "./ScanOverlay";
import QrScanner from "qr-scanner";
import workerUrl from "qr-scanner/qr-scanner-worker.min.js?url";

/** Nimiq [qr-scanner](https://github.com/nimiq/qr-scanner) (MIT): BarcodeDetector + WebWorker/jsQR fallback for reliable URL decoding. */
QrScanner.WORKER_PATH = workerUrl;

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  onScanRef.current = onScan;

  const startScanner = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setIsActive(false);

    if (scannerRef.current) {
      scannerRef.current.destroy();
      scannerRef.current = null;
    }

    try {
      const scanner = new QrScanner(
        video,
        (result) => {
          const text = (result?.data ?? "").trim();
          if (!text) return;
          scanner.stop();
          setIsActive(false);
          onScanRef.current(text);
        },
        {
          returnDetailedScanResult: true,
          preferredCamera: facingMode,
          maxScansPerSecond: 10,
          highlightScanRegion: false,
          highlightCodeOutline: false,
          onDecodeError: () => {},
        }
      );

      scannerRef.current = scanner;
      await scanner.start();
      setIsActive(true);
    } catch (err) {
      console.error("QR scanner error:", err);
      if (err?.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access.");
      } else if (err?.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError(err?.message ? `Could not start scanner: ${err.message}` : "Could not start camera.");
      }
      setIsActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      setIsActive(false);
    };
  }, [startScanner]);

  const toggleFacing = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {isActive && <ScanOverlay isScanning={isActive} />}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-background/95 backdrop-blur-sm z-30">
          <CameraOff className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground mb-6 max-w-xs">{error}</p>
          <Button onClick={() => void startScanner()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
        </div>
      )}

      {isActive && !error && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full w-10 h-10 bg-secondary/70 backdrop-blur-md border border-border/50 hover:bg-secondary"
            onClick={toggleFacing}
            type="button"
          >
            <SwitchCamera className="w-5 h-5" />
          </Button>
        </div>
      )}

      {!isActive && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
          <div className="relative mb-6">
            <Camera className="w-16 h-16 text-primary" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-primary/30 animate-pulse-ring" />
          </div>
          <p className="text-muted-foreground text-sm">Starting camera…</p>
        </div>
      )}
    </div>
  );
}
