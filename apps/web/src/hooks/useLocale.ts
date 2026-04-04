/**
 * @file useLocale — useLocale — detects and manages the active locale.
 * FR: useLocale — detecte et gere la locale active.
 */
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

type SupportedLocale = "en" | "fr" | "es" | "ar";

const VALID_LOCALES: ReadonlySet<string> = new Set(["en", "fr", "es", "ar"]);

export function useLocale() {
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuth();

  const changeLocale = useCallback(
    async (locale: SupportedLocale) => {
      if (!VALID_LOCALES.has(locale)) return;

      // Persist to DB first so subsequent API re-fetches read the updated locale.
      // Only call API when authenticated — guests use localStorage only.
      if (isAuthenticated) {
        try {
          const res = await fetch("/api/v1/users/me", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale }),
          });
          if (!res.ok) {
            console.warn(`Failed to persist locale preference: ${res.status}`);
          }
        } catch {
          // Network error — preference saved to localStorage via i18next
        }
      }

      // Then switch i18n — triggers hook re-fetches with DB already updated.
      // document.documentElement.lang is set by the i18n.on("languageChanged") listener in i18n.ts
      i18n.changeLanguage(locale);
    },
    [i18n, isAuthenticated],
  );

  return {
    locale: i18n.language,
    changeLocale,
  };
}
