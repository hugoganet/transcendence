/**
 * @file Button — reusable button with variant styles and loading state.
 * FR: Button — bouton réutilisable avec variantes de style et état de chargement.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

/** Props for Button. / FR: Props pour Button. */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-primary to-teal-500 text-white hover:shadow-md hover:shadow-primary/25 focus-visible:ring-primary/50",
  secondary:
    "bg-secondary text-white hover:bg-secondary/90 hover:shadow-md hover:shadow-secondary/25 focus-visible:ring-secondary/50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 hover:shadow-md focus-visible:ring-red-500/50",
  ghost:
    "bg-transparent text-[var(--color-text)] hover:bg-gray-100 dark:hover:bg-warm-700 focus-visible:ring-gray-300",
};

/**
 * Styled button with primary/secondary/danger/ghost variants and optional spinner.
 * FR: Bouton stylisé avec variantes primary/secondary/danger/ghost et spinner optionnel.
 */
export function Button({
  variant = "primary",
  isLoading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
