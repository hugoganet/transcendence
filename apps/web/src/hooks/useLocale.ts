import { useTranslation } from "react-i18next";
import { useCallback } from "react";

export function useLocale() {
  const { i18n } = useTranslation();

  const changeLocale = useCallback(
    (locale: string) => {
      i18n.changeLanguage(locale);
    },
    [i18n],
  );

  return {
    locale: i18n.language,
    changeLocale,
  };
}
