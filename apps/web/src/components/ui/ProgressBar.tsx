interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className = "",
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-warm-700">
        <div
          className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-500 dark:text-warm-400">{percentage}%</span>
      )}
    </div>
  );
}
