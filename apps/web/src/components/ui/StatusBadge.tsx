import { Check, Lock } from "lucide-react";

type Status = "locked" | "available" | "inProgress" | "completed";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const config: Record<Status, { label: string; classes: string }> = {
  locked: {
    label: "Locked",
    classes: "bg-gray-100 text-gray-500",
  },
  available: {
    label: "Available",
    classes: "bg-blue-50 text-blue-700",
  },
  inProgress: {
    label: "In Progress",
    classes: "bg-amber-50 text-amber-700",
  },
  completed: {
    label: "Completed",
    classes: "bg-green-50 text-green-700",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { label, classes } = config[status];

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
