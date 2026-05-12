import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Folder, Loader2, AlertCircle, Upload, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GoogleDriveModels({ onSelectModel }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [qrDialog, setQrDialog] = useState({
    open: false,
    dataUrl: "",
    scanUrl: "",
    fileName: "",
    modelId: "",
  });

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await base44.functions.invoke("getGoogleDriveGLBFiles", {});
        const data = response?.data ?? response ?? {};
        if (data.success) {
          setFiles(data.files || []);
        } else {
          setError("Failed to load models");
        }
      } catch (err) {
        setError("Error connecting to Google Drive");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const openQrSuccess = useCallback(async (fileUrl, fileName, modelId) => {
    try {
      const dataUrl = await QRCode.toDataURL(fileUrl, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#0a0e17", light: "#ffffff" },
      });
      setQrDialog({
        open: true,
        dataUrl,
        scanUrl: fileUrl,
        fileName,
        modelId,
      });
    } catch (e) {
      console.error(e);
      onSelectModel(modelId, true);
    }
  }, [onSelectModel]);

  const processUpload = useCallback(
    async (glbFile) => {
      if (!glbFile) return;
      setUploading(true);
      try {
        const response = await base44.functions.invoke("uploadModel", { file: glbFile });
        const data = response?.data ?? response ?? {};

        if (data.success && data.file_url) {
          const modelId = `local_${Date.now()}`;
          const saved = localStorage.getItem("uploadedModels");
          const models = saved ? JSON.parse(saved) : {};
          models[modelId] = { url: data.file_url, name: data.file_name || glbFile.name };
          localStorage.setItem("uploadedModels", JSON.stringify(models));

          await openQrSuccess(data.file_url, data.file_name || glbFile.name, modelId);
        } else {
          alert(data.error || "Upload did not return a file URL. Check Base44 auth and function logs.");
        }
      } catch (err) {
        alert("Failed to upload model");
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [openQrSuccess]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const glbFile = droppedFiles.find((f) => f.name.endsWith(".glb") || f.name.endsWith(".gltf"));
    if (glbFile) {
      await processUpload(glbFile);
    } else {
      alert("Please drop a .glb or .gltf file");
    }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.name.endsWith(".glb") && !f.name.endsWith(".gltf")) {
      alert("Please choose a .glb or .gltf file");
      return;
    }
    await processUpload(f);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading models...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-4 w-full max-w-sm rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            isDragging ? "border-primary/60 bg-primary/5" : "border-border/50"
          }`}
        >
          <Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">You can still drag & drop a GLB to upload</p>
        </div>
      </div>
    );
  }

  const uploadZoneClass = `rounded-xl border-2 border-dashed transition-all ${
    isDragging ? "border-primary/60 bg-primary/5" : "border-border/50 hover:border-primary/30"
  }`;

  const emptyList = files.length === 0;

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex-shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-border/40">
        <p className="text-xs text-muted-foreground truncate">
          {emptyList ? "No Drive files — upload a model" : `${files.length} from Drive`}
        </p>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-2 shrink-0"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload GLB
          </Button>
        </div>
      </div>

      {emptyList ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center flex-1 gap-4 p-6 mx-4 my-4 ${uploadZoneClass}`}
        >
          <div className="text-center">
            <Upload className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Drag & drop your GLB file</p>
            <p className="text-xs text-muted-foreground">
              After upload, a QR code is generated. Scanning it opens the 3D model on any device.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mx-4 mt-4 mb-2 p-4 text-center ${uploadZoneClass}`}
          >
            <p className="text-xs text-muted-foreground">Drop another GLB here or use Upload GLB</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 pt-0">
            {files.map((file, idx) => (
              <motion.button
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                type="button"
                onClick={() => onSelectModel(file.url)}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300 p-4 text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Folder className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {file.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">GLB Model</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      Click to view →
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={qrDialog.open}
        onOpenChange={(open) => {
          if (!open) setQrDialog((s) => ({ ...s, open: false }));
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Model uploaded
            </DialogTitle>
            <DialogDescription>
              This QR encodes the public model URL so any phone can scan and open the 3D viewer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {qrDialog.dataUrl ? (
              <img src={qrDialog.dataUrl} alt="QR code linking to the uploaded 3D model" className="rounded-lg border border-border/50" />
            ) : null}
            <p className="text-xs text-center text-muted-foreground max-w-full truncate px-2" title={qrDialog.fileName}>
              {qrDialog.fileName}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setQrDialog((s) => ({ ...s, open: false }));
                if (qrDialog.modelId) onSelectModel(qrDialog.modelId, true);
              }}
            >
              Open in this device
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => setQrDialog((s) => ({ ...s, open: false }))}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
