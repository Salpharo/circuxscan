import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, CameraOff, RefreshCw, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScanOverlay from "./ScanOverlay";

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);
        startScanning();
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Could not access camera: " + err.message);
      }
    }
  }, [facingMode]);

  const startScanning = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Try BarcodeDetector API (Chrome, Edge, Android)
      if ("BarcodeDetector" in window) {
        try {
          const detector = new BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            const value = barcodes[0].rawValue;
            if (value) {
              stopCamera();
              onScan(value);
              return;
            }
          }
        } catch (e) {
          // Fall through to image data approach
        }
      }

      // Fallback: try detecting via ImageBitmap
      try {
        if ("BarcodeDetector" in window) {
          const bitmap = await createImageBitmap(canvas);
          const detector = new BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(bitmap);
          if (barcodes.length > 0) {
            const value = barcodes[0].rawValue;
            if (value) {
              stopCamera();
              onScan(value);
              return;
            }
          }
        }
      } catch (e) {
        // Silent fallback
      }
    }, 300);
  }, [onScan, stopCamera]);

  const toggleFacing = useCallback(() => {
    stopCamera();
    setFacingMode((prev) =>
      prev === "environment" ? "user" : "environment"
    );
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

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
      <canvas ref={canvasRef} className="hidden" />

      {/* Scan overlay */}
      {isActive && <ScanOverlay isScanning={isActive} />}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-background/95 backdrop-blur-sm">
          <CameraOff className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground mb-6 max-w-xs">
            {error}
          </p>
          <Button onClick={startCamera} className="gap-2">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background">
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