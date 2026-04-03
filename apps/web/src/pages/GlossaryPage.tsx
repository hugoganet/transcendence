import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import type { TooltipResponse } from "@transcendence/shared";
import { tooltipsApi } from "../api/tooltips.js";
import { Card } from "../components/ui/Card.js";
import { Input } from "../components/ui/Input.js";
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
    document.title = `${t("pages.glossary.title")} — Transcendence`;
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
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        {t("pages.glossary.title")}
      </h1>

      <Input
        placeholder={t("pages.glossary.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Card>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            {t("pages.glossary.noTermsFound")}
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((term) => (
              <button
                key={term.term}
                onClick={() =>
                  setExpanded(expanded === term.term ? null : term.term)
                }
                className="block w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {term.term}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      expanded === term.term ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-600">{term.definition}</p>
                {expanded === term.term && (
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg bg-blue-50 px-3 py-2">
                      <p className="text-xs font-medium text-blue-800">
                        {t("pages.glossary.analogy")}
                      </p>
                      <p className="mt-0.5 text-sm text-blue-700">
                        {term.analogy}
                      </p>
                    </div>
                    {term.relatedTerms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs text-gray-400">{t("pages.glossary.related")}:</span>
                        {term.relatedTerms.map((rt) => (
                          <span
                            key={rt}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
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

      <p className="text-center text-xs text-gray-400">
        {t("pages.glossary.termCount", { count: filtered.length })}
      </p>
    </div>
  );
}
