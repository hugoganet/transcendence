import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "../public/locales/en/translation.json";
import fr from "../public/locales/fr/translation.json";
import es from "../public/locales/es/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React JSX auto-escapes. NEVER use dangerouslySetInnerHTML with t() values.
    },
    detection: {
      // localStorage first so user's saved preference takes priority over browser locale [M5 fix]
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

// Sync <html lang=""> and dir attribute on every language change
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = ["ar", "he", "fa"].includes(lng) ? "rtl" : "ltr";
});

export default i18n;
