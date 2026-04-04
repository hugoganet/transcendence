/**
 * @file useLocale — useLocale — detects and manages the active locale.
 * FR: useLocale — detecte et gere la locale active.
 */
import { useTranslation } from "react-i18next";
import { useCallback } from "react";

type SupportedLocale = "en" | "fr" | "es" | "ar";

const VALID_LOCALES: ReadonlySet<string> = new Set(["en", "fr", "es", "ar"]);

export function useLocale() {
  const { i18n } = useTranslation();

  const changeLocale = useCallback(
    (locale: SupportedLocale) => {
      if (!VALID_LOCALES.has(locale)) return;

      i18n.changeLanguage(locale);
      // document.documentElement.lang is set by the i18n.on("languageChanged") listener in i18n.ts

      // Fire-and-forget: persist locale to user profile when authenticated.
      // Silently ignores 401 (unauthenticated). Logs non-401 failures.
      fetch("/api/v1/users/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      })
        .then((res) => {
          if (!res.ok && res.status !== 401) {
            console.warn(`Failed to persist locale preference: ${res.status}`);
          }
        })
        .catch(() => {
          // Network error — preference is in localStorage via i18next
        });
    },
    [i18n],
  );

  return {
    locale: i18n.language,
    changeLocale,
  };
}
