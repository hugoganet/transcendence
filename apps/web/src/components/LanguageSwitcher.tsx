import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "../hooks/useLocale";

const LANGUAGES = [
  { code: "en", flag: "🇬🇧", labelKey: "languageSwitcher.en" },
  { code: "fr", flag: "🇫🇷", labelKey: "languageSwitcher.fr" },
  { code: "es", flag: "🇪🇸", labelKey: "languageSwitcher.es" },
] as const;

type LanguageCode = (typeof LANGUAGES)[number]["code"];

interface LanguageSwitcherProps {
  variant?: "pill" | "menu-item";
}

function getShortCode(locale: string): string {
  // i18next can return "en-US" style tags; normalise to 2-letter code
  return locale.slice(0, 2).toLowerCase();
}

function findLanguage(locale: string) {
  const code = getShortCode(locale) as LanguageCode;
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function LanguageSwitcher({ variant = "pill" }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const { locale, changeLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = findLanguage(locale);

  // Close on outside click
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSelect(code: LanguageCode) {
    changeLocale(code);
    setOpen(false);
  }

  if (variant === "menu-item") {
    return (
      <div ref={containerRef} className="relative w-full">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t("languageSwitcher.label")}
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left font-[var(--font-body)] text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-teal-50)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="text-xl leading-none">
              {current.flag}
            </span>
            <span className="font-medium">{t(current.labelKey)}</span>
          </span>
          <svg
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="4 6 8 10 12 6" />
          </svg>
        </button>

        {open && (
          <ul
            role="listbox"
            aria-label={t("languageSwitcher.label")}
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
          >
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === current.code;
              return (
                <li
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(lang.code)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(lang.code);
                    }
                  }}
                  tabIndex={0}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-3 px-4 py-3 font-[var(--font-body)] text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                    isSelected
                      ? "bg-[var(--color-teal-50)] font-semibold text-[var(--color-primary)]"
                      : "text-[var(--color-text)] hover:bg-[var(--color-warm-100)]"
                  }`}
                >
                  <span aria-hidden="true" className="text-xl leading-none">
                    {lang.flag}
                  </span>
                  <span>{t(lang.labelKey)}</span>
                  {isSelected && (
                    <svg
                      aria-hidden="true"
                      className="ml-auto h-4 w-4 text-[var(--color-primary)]"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 8 6.5 11.5 13 5" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  // Default: pill variant (compact, for nav/header)
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("languageSwitcher.label")}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-[var(--font-body)] text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-teal-50)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        <span aria-hidden="true" className="text-base leading-none">
          {current.flag}
        </span>
        <span className="uppercase tracking-wide">{current.code}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("languageSwitcher.label")}
          className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
        >
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === current.code;
            return (
              <li
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(lang.code)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(lang.code);
                  }
                }}
                tabIndex={0}
                className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 px-3 py-2.5 font-[var(--font-body)] text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                  isSelected
                    ? "bg-[var(--color-teal-50)] font-semibold text-[var(--color-primary)]"
                    : "text-[var(--color-text)] hover:bg-[var(--color-warm-100)]"
                }`}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {lang.flag}
                </span>
                <span>{t(lang.labelKey)}</span>
                {isSelected && (
                  <svg
                    aria-hidden="true"
                    className="ml-auto h-3.5 w-3.5 text-[var(--color-primary)]"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 8 6.5 11.5 13 5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
