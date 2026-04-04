/**
 * @file ExerciseTypeBadge — small badge showing the exercise type code and label.
 * FR: ExerciseTypeBadge — petit badge affichant le code et le libellé du type d'exercice.
 */
import { useTranslation } from "react-i18next";

type ExerciseTypeValue = "SI" | "CM" | "IP" | "ST";

/** Props for ExerciseTypeBadge. / FR: Props pour ExerciseTypeBadge. */
interface ExerciseTypeBadgeProps {
  type: ExerciseTypeValue;
  className?: string;
}

/**
 * Displays a colored pill with the exercise type abbreviation (SI, CM, IP, ST).
 * FR: Affiche une pastille colorée avec l'abréviation du type d'exercice (SI, CM, IP, ST).
 */
export function ExerciseTypeBadge({
  type,
  className = "",
}: ExerciseTypeBadgeProps) {
  const { t } = useTranslation();
  const label = t(`exerciseTypes.${type}`);

  return (
    <span
      className={`inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ${className}`}
      title={label}
    >
      {type}
      <span className="ml-1 hidden sm:inline">{label}</span>
    </span>
  );
}
