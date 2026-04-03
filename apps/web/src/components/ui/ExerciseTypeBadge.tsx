import { useTranslation } from "react-i18next";

type ExerciseTypeValue = "SI" | "CM" | "IP" | "ST";

interface ExerciseTypeBadgeProps {
  type: ExerciseTypeValue;
  className?: string;
}

export function ExerciseTypeBadge({
  type,
  className = "",
}: ExerciseTypeBadgeProps) {
  const { t } = useTranslation();
  const label = t(`exerciseTypes.${type}`);

  return (
    <span
      className={`inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ${className}`}
      title={label}
    >
      {type}
      <span className="ml-1 hidden sm:inline">{label}</span>
    </span>
  );
}
