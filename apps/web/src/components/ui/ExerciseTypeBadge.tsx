type ExerciseTypeValue = "SI" | "CM" | "IP" | "ST";

interface ExerciseTypeBadgeProps {
  type: ExerciseTypeValue;
  className?: string;
}

const labels: Record<ExerciseTypeValue, string> = {
  SI: "Scenario Interpretation",
  CM: "Concept Matching",
  IP: "Interactive Placement",
  ST: "Step-by-Step",
};

const shortLabels: Record<ExerciseTypeValue, string> = {
  SI: "SI",
  CM: "CM",
  IP: "IP",
  ST: "ST",
};

export function ExerciseTypeBadge({
  type,
  className = "",
}: ExerciseTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ${className}`}
      title={labels[type]}
    >
      {shortLabels[type]}
      <span className="ml-1 hidden sm:inline">{labels[type]}</span>
    </span>
  );
}
