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
      {status === "completed" && (
        <svg className="mr-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {status === "locked" && (
        <svg className="mr-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {label}
    </span>
  );
}
