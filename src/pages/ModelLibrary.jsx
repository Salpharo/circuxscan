import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModelViewer from "../components/ModelViewer";
import MRCameraFeed from "../components/MRCameraFeed";

export default function ModelLibrary() {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const [models, setModels] = useState({});

  // Load models from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("uploadedModels");
    if (saved) {
      setModels(JSON.parse(saved));
    }
  }, []);

  const currentModel = models[modelId];

  if (!currentModel) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-background gap-4 p-6">
        <p className="text-muted-foreground">Model not found</p>
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
      </div>
    );
  }

  const modelUrl = currentModel.url;

  const handleDelete = () => {
    const updated = { ...models };
    delete updated[modelId];
    setModels(updated);
    localStorage.setItem("uploadedModels", JSON.stringify(updated));
    navigate("/");
  };

  return (
    <div className="relative w-full h-full bg-black">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-full w-full overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <MRCameraFeed />
        </div>
        <div className="absolute inset-0 z-10">
          <ModelViewer url={modelUrl} mrMode />
        </div>

        {/* Top bar */}
        <div className="pointer-events-none absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <Button
            size="icon"
            variant="secondary"
            className="pointer-events-auto rounded-full w-10 h-10 bg-black/50 backdrop-blur-md border border-white/20"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="pointer-events-auto max-w-xs rounded-lg border border-white/20 bg-black/50 px-3 py-2 backdrop-blur-md">
            <p className="truncate text-xs font-medium text-white">
              {currentModel.name}
            </p>
          </div>

          <Button
            size="icon"
            variant="secondary"
            className="pointer-events-auto rounded-full w-10 h-10 border border-white/20 bg-black/50 backdrop-blur-md hover:bg-destructive/30"
            onClick={handleDelete}
          >
            <Trash2 className="w-5 h-5 text-destructive" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}