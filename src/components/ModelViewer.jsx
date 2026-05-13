import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function ModelViewer({ url, onClose, mrMode = false }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const frameRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

  const cleanup = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (controlsRef.current) controlsRef.current.dispose();
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.domElement?.remove();
    }
    sceneRef.current = null;
    cameraRef.current = null;
  }, []);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = null;
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
    camera.position.set(0, 1, 3);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: mrMode ? true : false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0); // Always transparent
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const el = renderer.domElement;
    el.style.touchAction = "none";
    el.style.userSelect = "none";

    // OrbitControls: 1-finger / drag = rotate, 2-finger pinch = zoom, 2-finger drag = pan (iOS + desktop)
    const controls = new OrbitControls(camera, el);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.25;
    controls.maxDistance = 80;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI - 0.08;
    controls.zoomSpeed = 0.85;
    controls.rotateSpeed = 0.65;
    controls.panSpeed = 0.75;
    controls.screenSpacePanning = true;
    controls.autoRotate = !mrMode;
    controls.autoRotateSpeed = 0.9;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
    });
    controls.addEventListener("end", () => {
      controls.autoRotate = !mrMode;
    });
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = false;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Environment map (simple)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Create a simple environment
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x303040);
    const envLight = new THREE.HemisphereLight(0x6699cc, 0x334455, 1);
    envScene.add(envLight);
    const envMap = pmremGenerator.fromScene(envScene).texture;
    scene.environment = envMap;
    pmremGenerator.dispose();



    // Load GLTF
    const loadModel = async () => {
      try {
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        const { DRACOLoader } = await import("three/addons/loaders/DRACOLoader.js");

        const manager = new THREE.LoadingManager();
        manager.onProgress = (_, loaded, total) => {
          setLoadProgress(Math.round((loaded / total) * 100));
        };

        const dracoLoader = new DRACOLoader(manager);
        dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");

        const loader = new GLTFLoader(manager);
        loader.setDRACOLoader(dracoLoader);

        loader.load(
          url,
          (gltf) => {
            const model = gltf.scene;

            // Center and scale model
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;

            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            model.position.y -= (box.min.y * scale);

            scene.add(model);

            const orbitTarget = new THREE.Vector3(0, size.y * scale * 0.4, 0);
            controls.target.copy(orbitTarget);
            camera.position.set(0, orbitTarget.y + 1, 3);
            controls.update();

            // Play animations
            if (gltf.animations.length > 0) {
              const mixer = new THREE.AnimationMixer(model);
              mixerRef.current = mixer;
              gltf.animations.forEach((clip) => {
                mixer.clipAction(clip).play();
              });
            }

            setModelInfo({
              name: url.split("/").pop().split("?")[0],
              vertices: countVertices(model),
              animations: gltf.animations.length,
              size: `${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)}`,
            });

            setLoading(false);
          },
          (xhr) => {
            if (xhr.total) {
              setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (err) => {
            console.error("Model load error:", err);
            setError("Failed to load 3D model. The URL might be invalid or the file format unsupported.");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Loader import error:", err);
        setError("Failed to initialize 3D viewer.");
        setLoading(false);
      }
    };

    loadModel();

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

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
      cleanup();
    };
  }, [url, mrMode, cleanup]);

  return (
    <div className="relative w-full h-full" style={{ background: 'transparent' }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {loading && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 ${
          mrMode ? 'bg-black/30 backdrop-blur-sm' : 'bg-background/90 backdrop-blur-sm'
        }`}>
          <div className="relative w-20 h-20 mb-6">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40" cy="40" r="36"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="4"
              />
              <circle
                cx="40" cy="40" r="36"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - loadProgress / 100)}`}
                style={{ transition: "stroke-dashoffset 0.3s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-mono font-medium text-primary">{loadProgress}%</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Loading 3D Model...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6"
             style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-center text-muted-foreground mb-4 max-w-xs">{error}</p>
        </div>
      )}

      {/* Model info badge (only in non-MR) */}
      {modelInfo && !loading && !mrMode && (
        <div className="absolute top-4 left-4 z-10 animate-float-up">
          <div className="px-3 py-2 rounded-lg bg-secondary/70 backdrop-blur-md border border-border/50">
            <p className="text-xs font-medium text-foreground truncate max-w-[200px]">{modelInfo.name}</p>
            <div className="flex gap-3 mt-1">
              <span className="text-[10px] text-muted-foreground">{modelInfo.vertices.toLocaleString()} verts</span>
              {modelInfo.animations > 0 && (
                <span className="text-[10px] text-primary">{modelInfo.animations} anim</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function countVertices(object) {
  let count = 0;
  object.traverse((node) => {
    if (node.isMesh && node.geometry) {
      count += node.geometry.attributes.position?.count || 0;
    }
  });
  return count;
}