import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { AlertCircle } from "lucide-react";

export default function QRScanner({ onScan }) {
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState(null);

  onScanRef.current = onScan;

  useEffect(() => {
    const root = document.getElementById("qr-scanner-container");
    if (!root) {
      setError("Scanner container not found.");
      return undefined;
    }

    setError(null);

    let scanner;
    try {
      scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          facingMode: "environment",
          showTorchButtonIfSupported: true,
        },
        false
      );
    } catch (err) {
      console.error("Scanner initialization error:", err);
      setError("Failed to start scanner. Please check permissions.");
      return undefined;
    }

    scannerRef.current = scanner;

    const onScanSuccess = (decodedText) => {
      scanner.pause(true);
      onScanRef.current(decodedText);
    };

    try {
      scanner.render(onScanSuccess, () => {});
    } catch (err) {
      console.error("Scanner render error:", err);
      setError("Failed to access camera. Please check permissions.");
    }

    return () => {
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (instance) {
        instance.clear().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden flex flex-col">
      <div
        id="qr-scanner-container"
        className="w-full h-full"
        style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      />

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-background z-10">
          <AlertCircle className="w-12 h-12 text-destructive mb-3" />
          <p className="text-center text-muted-foreground text-sm">{error}</p>
        </div>
      )}

      <style>{`
        #qr-scanner-container {
          width: 100% !important;
          height: 100% !important;
        }
        #qr-scanner-container video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        .qr-shaded-region {
          background: rgba(0, 0, 0, 0.5) !important;
        }
        .qr-shaded-region > div {
          border: 3px solid hsl(var(--primary)) !important;
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
}
