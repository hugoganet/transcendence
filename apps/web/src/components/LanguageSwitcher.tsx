/**
 * @file LanguageSwitcher — accessible dropdown for switching the app language.
 * FR: LanguageSwitcher — menu déroulant accessible pour changer la langue de l'application.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "../hooks/useLocale";

const LANGUAGES = [
  { code: "en", flag: "\u{1F1EC}\u{1F1E7}", labelKey: "languageSwitcher.en" },
  { code: "fr", flag: "\u{1F1EB}\u{1F1F7}", labelKey: "languageSwitcher.fr" },
  { code: "es", flag: "\u{1F1EA}\u{1F1F8}", labelKey: "languageSwitcher.es" },
  { code: "ar", flag: "\u{1F1F8}\u{1F1E6}", labelKey: "languageSwitcher.ar" },
] as const;

type LanguageCode = (typeof LANGUAGES)[number]["code"];

/** Props for LanguageSwitcher. / FR: Props pour LanguageSwitcher. */
interface LanguageSwitcherProps {
  variant?: "pill" | "menu-item";
}

function getShortCode(locale: string | undefined): string {
  return (locale ?? "en").slice(0, 2).toLowerCase();
}

function findLanguage(locale: string | undefined) {
  const code = getShortCode(locale) as LanguageCode;
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

/**
 * Renders a language picker as a pill or menu-item with keyboard navigation and ARIA support.
 * FR: Affiche un sélecteur de langue en pastille ou élément de menu avec navigation clavier et support ARIA.
 */
export function LanguageSwitcher({ variant = "pill" }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const { locale, changeLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const current = findLanguage(locale);

  // Close on outside click — only when open [H3 fix]
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  // Close on Escape + return focus to trigger — only when open [H3 fix]
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus first/selected option when dropdown opens [H2 fix]
  useEffect(() => {
    if (!open || !listRef.current) return;
    requestAnimationFrame(() => {
      const selected = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      const firstOption = listRef.current?.querySelector<HTMLElement>('[role="option"]');
      (selected ?? firstOption)?.focus();
    });
  }, [open]);

  function handleSelect(code: LanguageCode) {
    changeLocale(code);
    const lang = LANGUAGES.find((l) => l.code === code);
    if (lang) {
      setAnnouncement(t(lang.labelKey));
    }
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Arrow key navigation handler for roving tabindex [H1 fix]
  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLLIElement>, code: LanguageCode) => {
      const options = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
      if (!options) return;

      const currentIndex = Array.from(options).findIndex((opt) => opt === e.currentTarget);
      let nextIndex = currentIndex;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          nextIndex = Math.min(currentIndex + 1, options.length - 1);
          options[nextIndex]?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          nextIndex = Math.max(currentIndex - 1, 0);
          options[nextIndex]?.focus();
          break;
        case "Home":
          e.preventDefault();
          options[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          options[options.length - 1]?.focus();
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          handleSelect(code);
          break;
        default:
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [changeLocale, t],
  );

  function renderOptions(dropdownDirection: "up" | "down") {
    const positionClass =
      dropdownDirection === "up"
        ? "bottom-full mb-2"
        : "top-full mt-2";

    const widthClass = variant === "menu-item" ? "left-0 right-0" : "right-0 min-w-[160px]";

    return (
      <ul
        ref={listRef}
        role="listbox"
        className={`absolute ${widthClass} ${positionClass} z-[100] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg`}
      >
        {LANGUAGES.map((lang) => {
          const isSelected = lang.code === current.code;
          return (
            <li
              key={lang.code}
              lang={lang.code}
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(lang.code)}
              onKeyDown={(e) => handleOptionKeyDown(e, lang.code)}
              tabIndex={isSelected ? 0 : -1}
              className={`flex cursor-pointer items-center gap-2.5 font-[var(--font-body)] text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                variant === "menu-item" ? "min-h-[44px] gap-3 px-4 py-3" : "min-h-[44px] px-3 py-2.5"
              } ${
                isSelected
                  ? "bg-[var(--color-teal-50)] font-semibold text-[var(--color-primary)]"
                  : "text-[var(--color-text)] hover:bg-[var(--color-warm-100)]"
              }`}
            >
              <span role="img" aria-label={t(lang.labelKey)} className={variant === "menu-item" ? "text-xl leading-none" : "text-lg leading-none"}>
                {lang.flag}
              </span>
              <span>{t(lang.labelKey)}</span>
              {isSelected && (
                <svg
                  aria-hidden="true"
                  className={`ml-auto text-[var(--color-primary)] ${variant === "menu-item" ? "h-4 w-4" : "h-3.5 w-3.5"}`}
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
    );
  }

  // Live region for screen reader announcement [A11y fix]
  const liveRegion = (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );

  if (variant === "menu-item") {
    return (
      <div ref={containerRef} className="relative w-full">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t("languageSwitcher.label")}
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left font-[var(--font-body)] text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-teal-50)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          <span className="flex items-center gap-2">
            <span role="img" aria-label={t(current.labelKey)} className="text-xl leading-none">
              {current.flag}
            </span>
            <span className="font-medium">{t(current.labelKey)}</span>
          </span>
          <svg
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 motion-reduce:duration-0 ${open ? "rotate-180" : ""}`}
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

        {open && renderOptions("down")}
        {liveRegion}
      </div>
    );
  }

  // Default: pill variant (compact, for nav/header)
  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("languageSwitcher.label")}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-[var(--font-body)] text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-teal-50)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        <span role="img" aria-label={t(current.labelKey)} className="text-base leading-none">
          {current.flag}
        </span>
        <span className="uppercase tracking-wide">{current.code}</span>
      </button>

      {open && renderOptions("down")}
      {liveRegion}
    </div>
  );
}
