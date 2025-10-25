import { useCallback, useEffect, useRef, useState } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";
import type { CreateTypes } from "canvas-confetti";

export default function Confetti() {
  const instanceRef = useRef<CreateTypes | null>(null);
  const hasFiredRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);

  const makeShot = useCallback(
    (ratio: number, opts: Parameters<CreateTypes>[0]) => {
      if (!instanceRef.current) return;
      instanceRef.current({
        ...opts,
        origin: { y: 0.6 },
        particleCount: Math.floor(200 * ratio),
        colors: ["#ec4899", "#8b5cf6", "#f59e0b", "#10b981", "#3b82f6"],
      });
    },
    []
  );

  const fire = useCallback(() => {
    makeShot(0.25, { spread: 26, startVelocity: 55 });
    makeShot(0.2,  { spread: 60 });
    makeShot(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    makeShot(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    makeShot(0.1,  { spread: 120, startVelocity: 45 });
  }, [makeShot]);

  const prefersReduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Accept either onInit(confetti) or onInit({ confetti })
  const onInit = (arg: any) => {
    const confettiFn =
      arg && typeof arg === "object" && "confetti" in arg
        ? (arg as { confetti: CreateTypes }).confetti
        : (arg as CreateTypes);

    instanceRef.current = confettiFn || null;
    setReady(true); // trigger the fire effect once the instance exists
  };

  useEffect(() => {
    if (!ready || hasFiredRef.current) return;
    hasFiredRef.current = true;

    if (!prefersReduced()) {
      // ensure canvas is sized before firing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fire();
        });
      });
    }

    // fade out but keep mounted (prevents flicker in the UI)
    const t = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(t);
  }, [ready, fire]);

  return (
    <ReactCanvasConfetti
      onInit={onInit}
      style={{
        position: "fixed",
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        inset: 0,
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transition: "opacity 300ms ease",
      }}
    />
  );
}
