/**
 * @file Card — container card with optional mouse-tracking glow effect.
 * FR: Card — carte conteneur avec effet lumineux optionnel suivant la souris.
 */
import { type ReactNode } from "react";
import { useMouse } from "../../hooks/useMouse.js";

/** Props for Card. / FR: Props pour Card. */
interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

/**
 * Renders a bordered card with hover lift and an optional radial glow on mouse move.
 * FR: Affiche une carte bordée avec effet de levée au survol et un halo radial optionnel au mouvement de souris.
 */
export function Card({ children, className = "", glow = true }: CardProps) {
  const { mouse, ref } = useMouse<HTMLDivElement>();
  const showGlow = glow && mouse.x !== null && mouse.y !== null;

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-text)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      {showGlow && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            width: 300,
            height: 300,
            left: mouse.x as number,
            top: mouse.y as number,
            background: "radial-gradient(circle, rgba(43,158,158,0.12) 0%, transparent 70%)",
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
