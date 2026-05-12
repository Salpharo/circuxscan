import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { normalizeModelLoadUrl } from "@/lib/modelUrls";
import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ARViewer({ glbUrl, onClose }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const frameRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !glbUrl) return;

    const loadUrl = normalizeModelLoadUrl(glbUrl);

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
    camera.position.set(0, 0, 2);
    cameraRef.current = camera;

    // Transparent WebGL renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Load GLB
    const loadModel = async () => {
      try {
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        const { DRACOLoader } = await import("three/addons/loaders/DRACOLoader.js");

        const manager = new THREE.LoadingManager();
        const dracoLoader = new DRACOLoader(manager);
        dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");

        const loader = new GLTFLoader(manager);
        loader.setDRACOLoader(dracoLoader);

        loader.load(
          loadUrl,
          (gltf) => {
            const model = gltf.scene;

            // Center and scale model
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.2 / maxDim;

            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            model.position.y -= box.min.y * scale * 0.5;

            scene.add(model);
            modelRef.current = model;
            setLoading(false);

            // Play animations
            if (gltf.animations.length > 0) {
              const mixer = new THREE.AnimationMixer(model);
              gltf.animations.forEach((clip) => {
                mixer.clipAction(clip).play();
              });

              const clock = new THREE.Clock();
              const animationUpdate = () => {
                const delta = clock.getDelta();
                mixer.update(delta);
              };
              frameRef.current = { update: animationUpdate };
            }
          },
          undefined,
          (err) => {
            console.error("Model load error:", err);
            setError("Failed to load 3D model");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Loader error:", err);
        setError("Failed to initialize 3D viewer");
        setLoading(false);
      }
    };

    loadModel();

    // Animation loop
    let rotationSpeed = 0.01;
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onPointerDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX || e.touches?.[0]?.clientX || 0, y: e.clientY || e.touches?.[0]?.clientY || 0 };
      rotationSpeed = 0;
    };

    const onPointerMove = (e) => {
      if (!isDragging || !modelRef.current) return;
      const x = e.clientX || e.touches?.[0]?.clientX || 0;
      const y = e.clientY || e.touches?.[0]?.clientY || 0;
      const dx = (x - prevMouse.x) * 0.01;
      const dy = (y - prevMouse.y) * 0.01;

      modelRef.current.rotation.y += dx;
      modelRef.current.rotation.x += dy;
      prevMouse = { x, y };
    };

    const onPointerUp = () => {
      isDragging = false;
      rotationSpeed = 0.01;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerUp);
    renderer.domElement.addEventListener("touchstart", onPointerDown, { passive: true });
    renderer.domElement.addEventListener("touchmove", onPointerMove, { passive: true });
    renderer.domElement.addEventListener("touchend", onPointerUp);

    const animate = () => {
      frameRef.current?.update?.();

      if (modelRef.current && !isDragging) {
        modelRef.current.rotation.y += rotationSpeed;
      }

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    // Resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerUp);
      renderer.domElement.removeEventListener("touchstart", onPointerDown);
      renderer.domElement.removeEventListener("touchmove", onPointerMove);
      renderer.domElement.removeEventListener("touchend", onPointerUp);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [glbUrl]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white text-sm">Loading 3D Model...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-center">
            <p className="text-white text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full w-10 h-10 bg-secondary/70 backdrop-blur-md border border-border/50"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Instructions */}
      {!loading && !error && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
          <div className="px-4 py-2 rounded-full bg-secondary/70 backdrop-blur-md border border-border/50 text-xs text-muted-foreground">
            Drag to rotate • Tap to reset
          </div>
        </div>
      )}
    </div>
  );
}