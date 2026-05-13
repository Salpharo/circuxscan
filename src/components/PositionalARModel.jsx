import { useEffect, useRef } from "react";
import "@google/model-viewer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

/**
 * Room-scale / “positional” AR using the device AR runtime (not LiDAR APIs in JS).
 * User taps the model-viewer AR control, scans a surface, taps to place — the model
 * stays anchored so walking away makes it appear smaller, like retail AR viewers.
 */
export default function PositionalARModel({ url, onClose }) {
  const mvRef = useRef(null);

  useEffect(() => {
    const el = mvRef.current;
    if (!el) return;
    el.setAttribute("ar-modes", "webxr scene-viewer quick-look");
    el.setAttribute("touch-action", "none");
    el.setAttribute("shadow-intensity", "1");
    el.setAttribute("exposure", "1");
    el.setAttribute("interaction-prompt", "none");
  }, [url]);

  return (
    <div className="relative w-full h-full bg-zinc-950">
      <model-viewer
        ref={mvRef}
        src={url}
        alt="3D model"
        ar
        camera-controls
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(to bottom, #18181b, #09090b)",
        }}
      />

      <div className="absolute top-4 right-4 z-20">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full w-10 h-10 bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/70"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="absolute bottom-6 left-4 right-4 z-20 pointer-events-none">
        <p className="pointer-events-auto mx-auto max-w-md rounded-xl bg-black/65 px-4 py-3 text-center text-xs leading-relaxed text-white/95 backdrop-blur-md border border-white/10">
          Tap the <span className="font-semibold text-primary">AR</span> button on the
          model (cube icon). When the camera opens, point at your table or floor, then
          tap again to <span className="font-semibold">pin</span> the avatar. It stays
          in place as you move — moving farther away makes it look smaller, like store
          AR demos.
        </p>
      </div>
    </div>
  );
}
