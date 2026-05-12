import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QRScanner({ onScan }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initScanner = () => {
      if (scannerRef.current && !isInitialized) {
        const scanner = new Html5QrcodeScanner(
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

        const onScanSuccess = (decodedText) => {
          scanner.pause();
          onScan(decodedText);
        };

        const onScanError = (error) => {
          // Silently ignore scan errors
        };

        scanner.render(onScanSuccess, onScanError);
        scannerRef.current = scanner;
        setIsInitialized(true);
      }
    };

    try {
      initScanner();
    } catch (err) {
      console.error("Scanner initialization error:", err);
      setError("Failed to access camera. Please check permissions.");
    }

    return () => {
      if (scannerRef.current && isInitialized) {
        scannerRef.current.getState() === Html5QrcodeScanner.STATES.SCANNING &&
          scannerRef.current.stop();
      }
    };
  }, [isInitialized, onScan]);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden flex flex-col">
      {error ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-background">
          <AlertCircle className="w-12 h-12 text-destructive mb-3" />
          <p className="text-center text-muted-foreground text-sm">{error}</p>
        </div>
      ) : (
        <div
          id="qr-scanner-container"
          className="w-full h-full"
          style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        />
      )}

      {/* Custom styles for html5-qrcode */}
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