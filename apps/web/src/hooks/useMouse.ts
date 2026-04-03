/**
 * @file useMouse — useMouse — tracks mouse position for interactive effects.
 * FR: useMouse — suit la position de la souris pour les effets interactifs.
 */
import { useState, useRef, useEffect } from "react";

interface MousePosition {
  x: number | null;
  y: number | null;
}

export function useMouse<T extends HTMLElement = HTMLDivElement>() {
  const [mouse, setMouse] = useState<MousePosition>({ x: null, y: null });
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleLeave = () => setMouse({ x: null, y: null });

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return { mouse, ref };
}
