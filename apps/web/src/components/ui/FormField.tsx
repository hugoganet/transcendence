/**
 * @file FormField — labeled form wrapper with optional error message.
 * FR: FormField — wrapper de formulaire avec label et message d'erreur optionnel.
 */
import type { ReactNode } from "react";

/** Props for FormField. / FR: Props pour FormField. */
interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}

/**
 * Wraps a form control with a label and optional inline error text.
 * FR: Enveloppe un contrôle de formulaire avec un label et un texte d'erreur optionnel.
 */
export function FormField({ label, error, children, htmlFor }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-[var(--color-text)]"
      >
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
