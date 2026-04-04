/**
 * @file Input — styled text input with error state and forwarded ref.
 * FR: Input — champ de saisie stylisé avec état d'erreur et ref transmise.
 */
import { forwardRef, type InputHTMLAttributes } from "react";

/** Props for Input. / FR: Props pour Input. */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

/**
 * Forwarded-ref input with border highlighting on error and dark mode support.
 * FR: Input avec ref transmise, bordure d'erreur et support du mode sombre.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-warm-800 dark:text-warm-50 dark:placeholder:text-warm-500 ${
          error
            ? "border-red-500 focus:ring-red-500/50"
            : "border-gray-300 hover:border-gray-400 dark:border-warm-600 dark:hover:border-warm-500"
        } ${className}`}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
