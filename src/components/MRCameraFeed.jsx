import { useEffect, useRef } from "react";

/**
 * Full-screen rear (or front) camera for MR-style 3D overlays.
 * Tuned for iOS Safari: playsInline, muted, explicit play(), environment camera.
 */
export default function MRCameraFeed({ facingMode = "environment" }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => {});
      } catch (err) {
        console.error("MR camera error:", err);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [facingMode]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full min-h-full min-w-full object-cover bg-black"
      style={{ objectPosition: "center" }}
      playsInline
      muted
      autoPlay
      controls={false}
      disablePictureInPicture
    />
  );
}
