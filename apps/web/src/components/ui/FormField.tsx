/**
 * @file FormField — labeled form wrapper with optional error message.
 * FR: FormField — wrapper de formulaire avec label et message d'erreur optionnel.
 */
import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function FormField({ label, error, children, htmlFor }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700 dark:text-warm-200"
      >
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
