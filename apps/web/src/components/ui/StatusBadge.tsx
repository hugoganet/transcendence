import { Check, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

type Status = "locked" | "available" | "inProgress" | "completed";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusClasses: Record<Status, string> = {
  locked: "bg-gray-100 text-gray-500 dark:bg-warm-700 dark:text-warm-200",
  available: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  inProgress: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const statusKeys: Record<Status, string> = {
  locked: "labels.locked",
  available: "labels.available",
  inProgress: "labels.inProgress",
  completed: "labels.completed",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { t } = useTranslation();
  const classes = statusClasses[status];
  const label = t(statusKeys[status]);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classes} ${className}`}
    >
      {status === "completed" && <Check className="mr-1 h-3 w-3" />}
      {status === "locked" && <Lock className="mr-1 h-3 w-3" />}
      {label}
    </span>
  );
}
