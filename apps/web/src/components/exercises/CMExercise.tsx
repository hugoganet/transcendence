/**
 * @file CMExercise — concept-matching exercise where users pair terms with definitions.
 * FR: CMExercise — exercice d'association de concepts où l'utilisateur relie termes et définitions.
 */
import { useState } from "react";
import type { CMExerciseContent } from "@transcendence/shared";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.js";

/** Props for CMExercise. / FR: Props pour CMExercise. */
interface CMExerciseProps {
  content: CMExerciseContent;
  onSubmit: (matches: Array<{ termId: string; definitionId: string }>) => void;
  isSubmitting: boolean;
}

/**
 * Interactive term-definition matching UI with undo support and shuffled definitions.
 * FR: Interface interactive d'association terme-définition avec annulation et définitions mélangées.
 */
export function CMExercise({
  content,
  onSubmit,
  isSubmitting,
}: CMExerciseProps) {
  const { t } = useTranslation();
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matches, setMatches] = useState<
    Array<{ termId: string; definitionId: string }>
  >([]);

  // Shuffled definitions (stable across renders via initial state)
  const [shuffledDefs] = useState(() =>
    [...content.pairs]
      .map((p) => ({ id: p.id, definition: p.definition }))
      .sort(() => Math.random() - 0.5),
  );

  const matchedTermIds = new Set(matches.map((m) => m.termId));
  const matchedDefIds = new Set(matches.map((m) => m.definitionId));

  const handleTermClick = (termId: string) => {
    if (matchedTermIds.has(termId)) return;
    setSelectedTerm(termId === selectedTerm ? null : termId);
  };

  const handleDefClick = (defId: string) => {
    if (matchedDefIds.has(defId)) return;
    if (!selectedTerm) return;

    setMatches((prev) => [
      ...prev,
      { termId: selectedTerm, definitionId: defId },
    ]);
    setSelectedTerm(null);
  };

  const handleUndo = (termId: string) => {
    setMatches((prev) => prev.filter((m) => m.termId !== termId));
  };

  const allMatched = matches.length === content.pairs.length;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-[var(--color-background)] p-4">
        <p className="text-sm text-[var(--color-text)] sm:text-base">{content.instruction}</p>
      </div>

      {/* Matched pairs display */}
      {matches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            {t("exercise.CM.matched", { count: matches.length, total: content.pairs.length })}
          </p>
          {matches.map((match) => {
            const term = content.pairs.find((p) => p.id === match.termId);
            const def = shuffledDefs.find((d) => d.id === match.definitionId);
            return (
              <div
                key={match.termId}
                className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/20 p-3 text-sm"
              >
                <span className="flex-1 font-medium text-[var(--color-text)]">
                  {term?.term}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-green-500 dark:text-green-400" />
                <span className="flex-1 text-[var(--color-text)]">{def?.definition}</span>
                <button
                  onClick={() => handleUndo(match.termId)}
                  className="ml-2 text-xs text-[var(--color-text-muted)] hover:text-red-500 dark:hover:text-red-400"
                  aria-label={t("exercise.CM.undoAriaLabel")}
                >
                  {t("exercise.CM.undoButton")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Unmatched terms and definitions */}
      {!allMatched && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">{t("exercise.CM.termsLabel")}</p>
            {content.pairs
              .filter((p) => !matchedTermIds.has(p.id))
              .map((pair) => (
                <button
                  key={pair.id}
                  type="button"
                  onClick={() => handleTermClick(pair.id)}
                  className={`w-full rounded-lg border p-3 text-left text-sm text-[var(--color-text)] sm:text-base transition-colors ${
                    selectedTerm === pair.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  {pair.term}
                </button>
              ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">{t("exercise.CM.definitionsLabel")}</p>
            {shuffledDefs
              .filter((d) => !matchedDefIds.has(d.id))
              .map((def) => (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => handleDefClick(def.id)}
                  className={`w-full rounded-lg border p-3 text-left text-sm text-[var(--color-text)] sm:text-base transition-colors ${
                    selectedTerm
                      ? "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-primary/40"
                      : "cursor-default border-[var(--color-border)] bg-[var(--color-surface)]"
                  }`}
                >
                  {def.definition}
                </button>
              ))}
          </div>
        </div>
      )}

      <Button
        onClick={() => onSubmit(matches)}
        disabled={!allMatched}
        isLoading={isSubmitting}
        className="w-full sm:w-auto"
      >
        {t("exercise.CM.checkMatches")}
      </Button>
    </div>
  );
}
