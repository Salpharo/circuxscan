import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModelViewer from "../components/ModelViewer";

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
    <div className="relative w-full h-full bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full"
      >
        <ModelViewer url={modelUrl} />

        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full w-10 h-10 bg-secondary/70 backdrop-blur-md border border-border/50"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="px-3 py-2 rounded-lg bg-secondary/70 backdrop-blur-md border border-border/50 max-w-xs">
            <p className="text-xs font-medium text-foreground truncate">
              {currentModel.name}
            </p>
          </div>

          <Button
            size="icon"
            variant="secondary"
            className="rounded-full w-10 h-10 bg-secondary/70 backdrop-blur-md border border-border/50 hover:bg-destructive/20"
            onClick={handleDelete}
          >
            <Trash2 className="w-5 h-5 text-destructive" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}