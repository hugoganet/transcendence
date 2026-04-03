/**
 * @file STExercise — step-through exercise with sequential prompts and per-step options.
 * FR: STExercise — exercice par étapes avec questions séquentielles et options par étape.
 */
import { useState } from "react";
import type { STExerciseContent } from "@transcendence/shared";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.js";

/** Props for STExercise. / FR: Props pour STExercise. */
interface STExerciseProps {
  content: STExerciseContent;
  onSubmit: (
    stepAnswers: Array<{ stepId: string; selectedOptionId: string }>,
  ) => void;
  isSubmitting: boolean;
}

/**
 * Multi-step exercise with sequential prompts, step progress bar, and back navigation.
 * FR: Exercice multi-étapes avec questions séquentielles, barre de progression et navigation arrière.
 */
export function STExercise({
  content,
  onSubmit,
  isSubmitting,
}: STExerciseProps) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const currentStep = content.steps[currentStepIdx];
  const isLastStep = currentStepIdx === content.steps.length - 1;
  const currentAnswer = currentStep ? answers[currentStep.id] : undefined;
  const allAnswered = content.steps.every((step) => answers[step.id]);

  const handleSelect = (optionId: string) => {
    if (!currentStep) return;
    setAnswers((prev) => ({ ...prev, [currentStep.id]: optionId }));
  };

  const handleNext = () => {
    if (isLastStep) return;
    setCurrentStepIdx((prev) => prev + 1);
  };

  const handleSubmit = () => {
    const stepAnswers = content.steps.map((step) => ({
      stepId: step.id,
      selectedOptionId: answers[step.id],
    }));
    onSubmit(stepAnswers);
  };

  if (!currentStep) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gray-50 dark:bg-warm-900 p-4">
        <p className="text-sm text-gray-700 dark:text-warm-200">{content.instruction}</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1">
        {content.steps.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => answers[step.id] !== undefined && setCurrentStepIdx(idx)}
            className={`h-2 flex-1 rounded-full transition-colors ${
              idx === currentStepIdx
                ? "bg-primary"
                : answers[step.id] !== undefined
                  ? "bg-primary/40 cursor-pointer"
                  : "bg-gray-200 dark:bg-warm-700"
            }`}
            aria-label={t("exercise.ST.step", { current: idx + 1, total: content.steps.length })}
          />
        ))}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-gray-400 dark:text-warm-300">
          {t("exercise.ST.step", { current: currentStepIdx + 1, total: content.steps.length })}
        </p>
        <h3 className="text-base font-semibold text-gray-900 dark:text-warm-50">
          {currentStep.prompt}
        </h3>
      </div>

      <div className="space-y-3">
        {currentStep.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            className={`w-full rounded-lg border p-4 text-left text-sm transition-colors ${
              currentAnswer === option.id
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-gray-200 dark:border-warm-700 bg-white dark:bg-warm-800 hover:border-gray-300 dark:hover:border-warm-600"
            }`}
          >
            {option.text}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        {currentStepIdx > 0 && (
          <Button
            variant="ghost"
            onClick={() => setCurrentStepIdx((prev) => prev - 1)}
          >
            {t("labels.back")}
          </Button>
        )}

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered}
            isLoading={isSubmitting}
            className="w-full sm:w-auto"
          >
            {t("labels.submit")}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!currentAnswer}
            className="w-full sm:w-auto"
          >
            {t("exercise.ST.nextStep")}
          </Button>
        )}
      </div>
    </div>
  );
}
