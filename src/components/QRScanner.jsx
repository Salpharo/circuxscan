import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, RefreshCw, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScanOverlay from "./ScanOverlay";
import QrScanner from "qr-scanner";
import workerUrl from "qr-scanner/qr-scanner-worker.min.js?url";

// Set worker path for Vite
QrScanner.WORKER_PATH = workerUrl;

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  // facingMode isn't easily toggleable on the fly with QrScanner start/stop sometimes,
  // but we can pass preferredCamera to the start method.
  const [facingMode, setFacingMode] = useState("environment");

  const startScanning = useCallback(async () => {
    setError(null);
    if (!videoRef.current) return;

    try {
      // Destroy previous instance if any
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }

      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setError("No camera found on this device.");
        return;
      }

      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          if (result && result.data) {
            onScan(result.data);
          } else if (typeof result === "string") {
            onScan(result);
          }
        },
        {
          onDecodeError: (err) => {
            // Ignore standard "No QR code found" errors
          },
          highlightScanRegion: false,
          highlightCodeOutline: false,
          preferredCamera: facingMode,
          maxScansPerSecond: 5,
        }
      );

      await scannerRef.current.start();
      setIsActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setIsActive(false);
      if (err.name === "NotAllowedError" || (err.message && err.message.includes("permission"))) {
        setError("Camera permission denied. Please allow camera access.");
      } else {
        setError("Could not access camera: " + (err.message || "Unknown error"));
      }
    }
  }, [facingMode, onScan]);

  const stopScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, [startScanning, stopScanning]);

  const toggleFacing = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      {/* Video feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Scan overlay */}
      {isActive && <ScanOverlay isScanning={isActive} />}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-background/95 backdrop-blur-sm z-30">
          <CameraOff className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground mb-6 max-w-xs">
            {error}
          </p>
          <Button onClick={startScanning} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
        </div>
      )}

      {/* Camera controls */}
      {isActive && (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full w-10 h-10 bg-secondary/70 backdrop-blur-md border border-border/50 hover:bg-secondary"
            onClick={toggleFacing}
          >
            <SwitchCamera className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Camera inactive placeholder */}
      {!isActive && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
          <div className="relative mb-6">
            <Camera className="w-16 h-16 text-primary" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-primary/30 animate-pulse-ring" />
          </div>
          <p className="text-muted-foreground text-sm">Starting camera...</p>
        </div>
      )}
    </div>
  );
}
