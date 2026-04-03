/**
 * @file LoadingSpinner — spinner and skeleton loading indicators.
 * FR: LoadingSpinner — indicateurs de chargement spinner et skeleton.
 */
/** Props for LoadingSpinner. / FR: Props pour LoadingSpinner. */
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots";
}

const sizeConfig = {
  sm: { container: "h-4", dot: "h-1.5 w-1.5", ring: "h-4 w-4" },
  md: { container: "h-8", dot: "h-2 w-2", ring: "h-8 w-8" },
  lg: { container: "h-12", dot: "h-3 w-3", ring: "h-12 w-12" },
};

/**
 * Renders a loading indicator as bouncing dots or a spinning ring.
 * FR: Affiche un indicateur de chargement sous forme de points rebondissants ou d'anneau tournant.
 */
export function LoadingSpinner({ size = "md", variant = "dots" }: LoadingSpinnerProps) {
  const cfg = sizeConfig[size];

  if (variant === "spinner") {
    return (
      <svg
        className={`animate-spin text-primary dark:text-teal-400 ${cfg.ring}`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-1.5 ${cfg.container}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-full bg-primary dark:bg-teal-400 ${cfg.dot}`}
          style={{
            animation: "loader-bounce 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Animated placeholder skeleton for content loading states.
 * FR: Squelette animé de remplacement pour les états de chargement de contenu.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-gray-200 dark:bg-warm-700 animate-skeleton ${className}`}
    />
  );
}
