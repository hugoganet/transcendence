/**
 * @file SIExercise — single-input multiple-choice exercise with scenario and question.
 * FR: SIExercise — exercice à choix unique avec scénario et question.
 */
import { useState } from "react";
import type { SIExerciseContent } from "@transcendence/shared";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.js";

/** Props for SIExercise. / FR: Props pour SIExercise. */
interface SIExerciseProps {
  content: SIExerciseContent;
  onSubmit: (selectedOptionId: string) => void;
  isSubmitting: boolean;
}

/**
 * Single-choice question with scenario context and selectable option cards.
 * FR: Question à choix unique avec contexte scénario et cartes d'options sélectionnables.
 */
export function SIExercise({
  content,
  onSubmit,
  isSubmitting,
}: SIExerciseProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-[var(--color-background)] p-4">
        <p className="text-sm leading-relaxed text-[var(--color-text)]">
          {content.scenario}
        </p>
      </div>

      <h3 className="text-base font-semibold text-[var(--color-text)]">
        {content.question}
      </h3>

      <div className="space-y-3">
        {content.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelected(option.id)}
            className={`w-full rounded-lg border p-4 text-left text-sm transition-colors ${
              selected === option.id
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-gray-300 dark:hover:border-warm-600"
            }`}
          >
            {option.text}
          </button>
        ))}
      </div>

      <Button
        onClick={() => selected && onSubmit(selected)}
        disabled={!selected}
        isLoading={isSubmitting}
        className="w-full sm:w-auto"
      >
        {t("exercise.SI.submitAnswer")}
      </Button>
    </div>
  );
}
