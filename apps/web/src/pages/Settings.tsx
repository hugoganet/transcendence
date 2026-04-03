import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function Settings() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("settings.title")} — Unblock.chain`;
  }, [t]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8 font-[var(--font-body)]">
      <h1 className="mb-8 font-[var(--font-heading)] text-2xl font-bold text-[var(--color-text)]">
        {t("settings.title")}
      </h1>

      <section aria-labelledby="language-section-heading">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2
            id="language-section-heading"
            className="mb-1 font-[var(--font-heading)] text-base font-semibold text-[var(--color-text)]"
          >
            {t("settings.language")}
          </h2>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            {t("settings.languageDescription")}
          </p>
          <LanguageSwitcher variant="menu-item" />
        </div>
      </section>
    </div>
  );
}
