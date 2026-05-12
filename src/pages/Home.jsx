import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Box, X, ArrowLeft, LinkIcon, Camera, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QRScanner from "../components/QRScanner";
import ModelViewer from "../components/ModelViewer";
import GoogleDriveModels from "../components/GoogleDriveModels";
import { resolveScanPayload, DEFAULT_ROOT_QR_MODEL_URL } from "@/lib/modelUrls";

function getLaunchState() {
  if (typeof window === "undefined") {
    return { mode: "idle", modelUrl: null };
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get("menu") === "1" || params.get("home") === "1") {
    return { mode: "idle", modelUrl: null };
  }
  const explicit = params.get("url") || params.get("model");
  if (explicit) {
    const resolved = resolveScanPayload(explicit);
    if (resolved?.type === "url") {
      return { mode: "viewing", modelUrl: resolved.url };
    }
    return { mode: "idle", modelUrl: null };
  }

  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  let path = window.location.pathname.replace(/\/$/, "") || "/";
  if (base && path.startsWith(base)) {
    path = path.slice(base.length) || "/";
  }
  const atRoot = path === "/" || path === "";
  if (atRoot) {
    const resolved = resolveScanPayload(DEFAULT_ROOT_QR_MODEL_URL);
    if (resolved?.type === "url") {
      return { mode: "viewing", modelUrl: resolved.url };
    }
  }
  return { mode: "idle", modelUrl: null };
}

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(() => getLaunchState().mode); // idle, scanning, viewing
  const [modelUrl, setModelUrl] = useState(() => getLaunchState().modelUrl);
  const [manualUrl, setManualUrl] = useState("");
  const [activeTab, setActiveTab] = useState("scan");

  const handleScan = useCallback(
    (value) => {
      const resolved = resolveScanPayload(value);
      if (!resolved) return;
      if (resolved.type === "library") {
        navigate(`/3dmodellibrary/${resolved.modelId}`);
        return;
      }
      setModelUrl(resolved.url);
      setMode("viewing");
    },
    [navigate]
  );

  const handleManualLoad = useCallback(() => {
    const resolved = resolveScanPayload(manualUrl);
    if (!resolved) return;
    if (resolved.type === "library") {
      navigate(`/3dmodellibrary/${resolved.modelId}`);
      return;
    }
    setModelUrl(resolved.url);
    setMode("viewing");
  }, [manualUrl, navigate]);

  const handleReset = useCallback(() => {
    setMode("idle");
    setModelUrl(null);
    setManualUrl("");
  }, []);

  const handleSelectModel = useCallback((modelId, isLocal = false) => {
    if (isLocal) {
      // Navigate to model library page
      window.location.href = `/3dmodellibrary/${modelId}`;
    } else {
      // Regular URL viewing
      setModelUrl(modelId);
      setMode("viewing");
    }
  }, []);

  const startScanning = useCallback(() => {
    setMode("scanning");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const explicit = params.get("url") || params.get("model");
    if (!explicit) return;
    const resolved = resolveScanPayload(explicit);
    if (resolved?.type === "library") {
      navigate(`/3dmodellibrary/${resolved.modelId}`);
    }
  }, [navigate]);

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
            className="flex flex-col h-full px-6"
          >
            {/* Hero */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-center mb-8 pt-8"
            >
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 blur-xl" />
                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50 flex items-center justify-center">
                  <Box className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  QR → 3D
                </span>
              </h1>
              <p className="text-muted-foreground text-base max-w-xs mx-auto leading-relaxed">
                Scan, view, and explore 3D models
              </p>
            </motion.div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <TabsList className="grid w-full max-w-xs mx-auto grid-cols-4 mb-6">
                  <TabsTrigger value="scan" className="gap-2">
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">Scan</span>
                  </TabsTrigger>
                  <TabsTrigger value="models" className="gap-2">
                    <Folder className="w-4 h-4" />
                    <span className="hidden sm:inline">Models</span>
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="gap-2">
                    <Box className="w-4 h-4" />
                    <span className="hidden sm:inline">AI</span>
                  </TabsTrigger>
                  <TabsTrigger value="url" className="gap-2">
                    <LinkIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">URL</span>
                  </TabsTrigger>
                </TabsList>
              </motion.div>

              {/* Scan Tab */}
              <TabsContent value="scan" className="flex-1 mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-6"
                >
                  <Button
                    size="lg"
                    className="h-14 text-base font-semibold rounded-xl gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                    onClick={startScanning}
                  >
                    <Camera className="w-5 h-5" />
                    Start Scanner
                  </Button>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Use your camera to scan QR codes linked to 3D models
                  </p>
                </motion.div>
              </TabsContent>

              {/* Models Tab */}
              <TabsContent value="models" className="flex-1 mt-0 -mx-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full"
                >
                  <GoogleDriveModels onSelectModel={handleSelectModel} />
                </motion.div>
              </TabsContent>

              {/* AI Models Tab */}
              <TabsContent value="ai" className="flex-1 mt-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full overflow-y-auto"
                >
                  <div className="p-4 space-y-3">
                    {AI_MODELS.map((model) => (
                      <motion.button
                        key={model.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => {
                          setModelUrl(model.url);
                          setMode("viewing");
                        }}
                        className="w-full text-left p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:border-primary/50 transition-all duration-200 group"
                      >
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">{model.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>

              {/* URL Tab */}
              <TabsContent value="url" className="flex-1 mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4"
                >
                  <div className="w-full max-w-xs">
                    <Input
                      placeholder="Raw GLB URL or github.com/.../blob/.../model.glb"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualLoad()}
                      className="h-11 rounded-lg bg-secondary border-border/50 text-sm font-mono mb-3"
                    />
                    <Button
                      onClick={handleManualLoad}
                      className="w-full h-11 rounded-lg"
                      disabled={!manualUrl.trim()}
                    >
                      Load Model
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Paste a direct GLB link, a raw GitHub file URL, or a regular GitHub blob link (it opens as the raw file).
                  </p>
                </motion.div>
              </TabsContent>

              {/* Sample models */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-auto pb-6 text-center"
              >
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Sample Models</p>
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
            </Tabs>
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

        {/* Full Screen Viewing Mode */}
        {mode === "viewing" && modelUrl && (
          <motion.div
            key="viewing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full"
          >
            <ModelViewer url={modelUrl} />

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
      </AnimatePresence>
    </div>
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

const AI_MODELS = [
  {
    name: "Robot",
    description: "Detailed robot model with articulated joints",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Suzanne/glTF-Binary/Suzanne.glb",
  },
  {
    name: "Lantern",
    description: "Decorative AI-designed lantern model",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb",
  },
  {
    name: "Animated Cube",
    description: "Spinning geometric cube with materials",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF-Binary/BarramundiFish.glb",
  },
  {
    name: "Brain Model",
    description: "AI neural network inspired brain visualization",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DragonAttenuation/glTF-Binary/DragonAttenuation.glb",
  },
  {
    name: "Morphing Head",
    description: "Complex character head model",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb",
  },
  {
    name: "Sci-Fi Structure",
    description: "Futuristic architectural design",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb",
  },
];