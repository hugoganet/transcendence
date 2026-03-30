import { useTranslation } from "react-i18next";
import { useCallback } from "react";

export function useLocale() {
  const { i18n } = useTranslation();

  const changeLocale = useCallback(
    (locale: string) => {
      i18n.changeLanguage(locale);
      document.documentElement.lang = locale;

      // Fire-and-forget: persist locale to user profile when authenticated.
      // Silently ignores 401 (unauthenticated) and all other network errors.
      fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      }).catch(() => {
        // Intentionally swallowed — auth context not yet available
      });
    },
    [i18n],
  );

  return {
    locale: i18n.language,
    changeLocale,
  };
}
