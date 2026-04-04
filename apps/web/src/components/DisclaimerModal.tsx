/**
 * @file DisclaimerModal — gate modal requiring user acceptance before proceeding.
 * FR: DisclaimerModal — modale de consentement obligatoire avant de continuer.
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button.js";

/** Props for DisclaimerModal. / FR: Props pour DisclaimerModal. */
interface DisclaimerModalProps {
  text: string;
  onAccept: () => void;
}

/**
 * Shows a disclaimer with checkbox confirmation; blocks access until accepted.
 * FR: Affiche un avertissement avec case à cocher ; bloque l'accès tant qu'il n'est pas accepté.
 */
export function DisclaimerModal({ text, onAccept }: DisclaimerModalProps) {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);

  const modalContent = (
    <div
      className="fixed inset-0 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8"
      style={{ zIndex: 9999 }}
    >
      <div className="w-full max-w-md rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-[var(--color-text)] font-heading">
          {t("disclaimer.gateTitle")}
        </h2>

        <div className="mb-4 max-h-[50vh] overflow-y-auto rounded-lg bg-[var(--color-background)] px-4 py-3">
          <p className="text-sm text-[var(--color-text)] leading-relaxed">{text}</p>
        </div>

        <label className="mb-4 flex items-start gap-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-[var(--color-text-muted)]">
            {t("disclaimer.acceptButton")}
          </span>
        </label>

        <Button onClick={onAccept} disabled={!accepted} className="w-full">
          {t("labels.continue")}
        </Button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
