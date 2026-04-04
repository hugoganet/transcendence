/**
 * @file GlossaryPage — Glossary Page — searchable financial terms glossary.
 * FR: Page Glossaire — glossaire consultable de termes financiers.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Search } from "lucide-react";
import type { TooltipResponse } from "@transcendence/shared";
import { tooltipsApi } from "../api/tooltips.js";
import { Card } from "../components/ui/Card.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

export function GlossaryPage() {
  const { t } = useTranslation();
  const [terms, setTerms] = useState<TooltipResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${t("pages.glossary.title")} — Unblock.chain`;
    let cancelled = false;
    tooltipsApi.getGlossary().then(
      (data) => {
        if (!cancelled) {
          setTerms(data.terms);
          setIsLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setError(t("pages.glossary.loadError"));
          setIsLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = terms.filter(
    (item) =>
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.definition.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)] font-heading">
        {t("pages.glossary.title")}
      </h1>

      {/* Search bar with icon */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-warm-400" />
        <input
          placeholder={t("pages.glossary.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm text-[var(--color-text)] transition-all placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary dark:border-warm-700 dark:bg-warm-800 dark:text-warm-50 dark:placeholder:text-warm-400"
        />
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-warm-300">
            {t("pages.glossary.noTermsFound")}
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-warm-700">
            {filtered.map((term, i) => (
              <button
                key={term.term}
                onClick={() =>
                  setExpanded(expanded === term.term ? null : term.term)
                }
                className="block w-full px-4 py-3 text-left transition-all hover:bg-gray-50 dark:hover:bg-warm-700/50"
                style={{
                  animation: "stagger-in 0.3s ease-out both",
                  animationDelay: `${i * 30}ms`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    {term.term}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 dark:text-warm-400 transition-transform duration-200 ${
                      expanded === term.term ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {term.definition}
                </p>
                {expanded === term.term && (
                  <div className="mt-3 space-y-2 animate-fade-in-up">
                    <div className="rounded-lg bg-teal-50 px-3 py-2 dark:bg-teal-900/20">
                      <p className="text-xs font-medium text-teal-800 dark:text-teal-300">
                        {t("pages.glossary.analogy")}
                      </p>
                      <p className="mt-0.5 text-sm text-teal-700 dark:text-teal-200">
                        {term.analogy}
                      </p>
                    </div>
                    {term.relatedTerms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs text-gray-400 dark:text-warm-400">
                          {t("pages.glossary.related")}:
                        </span>
                        {term.relatedTerms.map((rt) => (
                          <span
                            key={rt}
                            className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-teal-900/30 dark:text-teal-300"
                          >
                            {rt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        {t("pages.glossary.termCount", { count: filtered.length })}
      </p>
    </div>
  );
}
