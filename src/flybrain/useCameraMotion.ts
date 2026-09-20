import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "active" | "denied" | "unavailable";

export interface Motion {
  left: number;
  right: number;
}

const SAMPLE_W = 32;
const SAMPLE_H = 18;

/**
 * Turns phone camera motion into a left/right "how much changed since the
 * last frame" signal — a crude stand-in for the elementary motion detectors
 * (Reichardt correlators) a fly's lobula plate actually computes from its
 * compound eyes. Feeds a continuous ref rather than React state so the
 * render loop can read it every frame without re-rendering the component
 * tree 60x/sec.
 */
export function useCameraMotion() {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const motionRef = useRef<Motion>({ left: 0, right: 0 });
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const rafRef = useRef<number>(0);
  const idleSeedRef = useRef(Math.random() * 1000);
  // While now() < this, a manual "startle" is in flight — idle/camera ticks must
  // not clobber motionRef until it has had a chance to reach the simulation.
  const forceUntilRef = useRef(0);

  const idleTick = useCallback((t: number) => {
    if (performance.now() < forceUntilRef.current) return;
    // No camera: gentle ambient drift so the brain stays alive rather than flatlining,
    // plus occasional small motion blips so the demo has something to look at.
    // Smooth, tiny, deliberately below anything that could cascade into an escape
    // response — real triggers should only come from the camera or the Startle button.
    const s = idleSeedRef.current;
    const base = 0.004 + 0.003 * Math.sin(t * 0.6 + s);
    motionRef.current = { left: base, right: base };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let idleRaf = 0;
    if (status !== "active") {
      const loop = (t: number) => {
        idleTick(t / 1000);
        idleRaf = requestAnimationFrame(loop);
      };
      idleRaf = requestAnimationFrame(loop);
    }
    return () => {
      cancelled = true;
      if (idleRaf) cancelAnimationFrame(idleRaf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    prevFrameRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return;
    }
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("no video element");
      video.srcObject = stream;
      await video.play();

      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = SAMPLE_W;
      canvas.height = SAMPLE_H;
      canvasRef.current = canvas;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("no 2d context");

      setStatus("active");

      const tick = () => {
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, SAMPLE_W, SAMPLE_H);
          const frame = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
          const prev = prevFrameRef.current;
          if (prev && performance.now() >= forceUntilRef.current) {
            let leftDiff = 0;
            let rightDiff = 0;
            const halfW = SAMPLE_W / 2;
            for (let y = 0; y < SAMPLE_H; y++) {
              for (let x = 0; x < SAMPLE_W; x++) {
                const idx = (y * SAMPLE_W + x) * 4;
                const lum = (frame[idx] + frame[idx + 1] + frame[idx + 2]) / 3;
                const prevLum = (prev[idx] + prev[idx + 1] + prev[idx + 2]) / 3;
                const d = Math.abs(lum - prevLum);
                if (x < halfW) leftDiff += d;
                else rightDiff += d;
              }
            }
            const norm = 255 * SAMPLE_W * SAMPLE_H * 0.5 * 0.12;
            motionRef.current = {
              left: Math.min(1.4, leftDiff / norm),
              right: Math.min(1.4, rightDiff / norm),
            };
          }
          prevFrameRef.current = frame;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setStatus("denied");
    }
  }, []);

  useEffect(() => stop, [stop]);

  const startle = useCallback(() => {
    forceUntilRef.current = performance.now() + 450;
    motionRef.current = { left: 1.0, right: 1.0 };
  }, []);

  return { status, videoRef, motionRef, start, startle };
}
