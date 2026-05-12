import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Box, X, ArrowLeft, LinkIcon, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRScanner from "../components/QRScanner";
import ModelViewer from "../components/ModelViewer";

export default function Home() {
  const [mode, setMode] = useState("idle"); // idle, scanning, viewing, mr
  const [modelUrl, setModelUrl] = useState(null);
  const [manualUrl, setManualUrl] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const handleScan = useCallback((value) => {
    // If it's a URL, use MR mode; otherwise treat as model URL
    if (value.startsWith("http://") || value.startsWith("https://")) {
      setModelUrl(value);
      setMode("mr");
    } else {
      setModelUrl(value);
      setMode("viewing");
    }
  }, []);

  const handleManualLoad = useCallback(() => {
    if (manualUrl.trim()) {
      setModelUrl(manualUrl.trim());
      setMode("viewing");
      setShowManualInput(false);
    }
  }, [manualUrl]);

  const handleReset = useCallback(() => {
    setMode("idle");
    setModelUrl(null);
    setManualUrl("");
  }, []);

  const startScanning = useCallback(() => {
    setMode("scanning");
  }, []);

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Idle / Landing */}
        {mode === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-full px-6"
          >
            {/* Hero */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 blur-xl" />
                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50 flex items-center justify-center">
                  <Box className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  QR → 3D MR
                </span>
              </h1>
              <p className="text-muted-foreground text-base max-w-xs mx-auto leading-relaxed">
                Scan a QR code to view 3D models with Mixed Reality overlay
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="flex flex-col gap-3 w-full max-w-xs"
            >
              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold rounded-xl gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                onClick={startScanning}
              >
                <Camera className="w-5 h-5" />
                Scan QR Code
              </Button>

              <Button
                variant="secondary"
                size="lg"
                className="w-full h-12 rounded-xl gap-2 border border-border/50"
                onClick={() => setShowManualInput(!showManualInput)}
              >
                <LinkIcon className="w-4 h-4" />
                Enter Model URL
              </Button>

              <AnimatePresence>
                {showManualInput && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="https://example.com/model.glb"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleManualLoad()}
                        className="h-11 rounded-lg bg-secondary border-border/50 text-sm font-mono"
                      />
                      <Button
                        onClick={handleManualLoad}
                        className="h-11 px-4 rounded-lg"
                        disabled={!manualUrl.trim()}
                      >
                        Load
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Sample models */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-10 text-center"
            >
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Try a sample</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SAMPLE_MODELS.map((sample) => (
                  <button
                    key={sample.name}
                    onClick={() => {
                      setModelUrl(sample.url);
                      setMode("viewing");
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary transition-all duration-200"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Scanning Mode */}
        {mode === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full"
          >
            <QRScanner onScan={handleScan} />
            <div className="absolute top-4 left-4 z-20">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full w-10 h-10 bg-secondary/70 backdrop-blur-md border border-border/50"
                onClick={handleReset}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Viewing Mode (Regular) */}
        {mode === "viewing" && modelUrl && (
          <motion.div
            key="viewing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full bg-gradient-to-br from-background via-background/50 to-background/30"
          >
            <ModelViewer url={modelUrl} mrMode={false} />

            {/* Top bar */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full w-10 h-10 bg-secondary/70 backdrop-blur-md border border-border/50"
                onClick={handleReset}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Bottom action bar */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center">
              <div className="flex gap-2 px-4 py-2 rounded-full bg-secondary/70 backdrop-blur-md border border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full gap-2 text-xs"
                  onClick={() => {
                    setMode("scanning");
                    setModelUrl(null);
                  }}
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  Scan Another
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* MR Mode (3D with Camera Feed) */}
        {mode === "mr" && modelUrl && (
          <motion.div
            key="mr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full overflow-hidden"
          >
            {/* Camera feed behind */}
            <div className="absolute inset-0">
              <MRCameraFeed />
            </div>

            {/* 3D Model overlay */}
            <div className="absolute inset-0">
              <ModelViewer url={modelUrl} mrMode={true} />
            </div>

            {/* Controls overlay */}
            <div className="absolute top-4 right-4 z-20">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full w-10 h-10 bg-black/50 backdrop-blur-md border border-white/20"
                onClick={handleReset}
              >
                <X className="w-5 h-5 text-white" />
              </Button>
            </div>

            {/* Bottom action */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full gap-2 text-xs bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/60"
                onClick={() => {
                  setMode("scanning");
                  setModelUrl(null);
                }}
              >
                <ScanLine className="w-3.5 h-3.5" />
                Scan Another
              </Button>
            </div>

            {/* MR Badge */}
            <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
              🔴 MR Mode
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MRCameraFeed() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      playsInline
      muted
      autoPlay
    />
  );
}

const SAMPLE_MODELS = [
  {
    name: "Duck",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
  },
  {
    name: "Avocado",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb",
  },
  {
    name: "Damaged Helmet",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
  },
  {
    name: "Fox",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb",
  },
];