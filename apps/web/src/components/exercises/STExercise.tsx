import { useState } from "react";
import type { STExerciseContent } from "@transcendence/shared";
import { Button } from "../ui/Button.js";

interface STExerciseProps {
  content: STExerciseContent;
  onSubmit: (
    stepAnswers: Array<{ stepId: string; selectedOptionId: string }>,
  ) => void;
  isSubmitting: boolean;
}

export function STExercise({
  content,
  onSubmit,
  isSubmitting,
}: STExerciseProps) {
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
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-700">{content.instruction}</p>
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
                  : "bg-gray-200"
            }`}
            aria-label={`Step ${idx + 1}`}
          />
        ))}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-gray-400">
          Step {currentStepIdx + 1} of {content.steps.length}
        </p>
        <h3 className="text-base font-semibold text-gray-900">
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
                : "border-gray-200 bg-white hover:border-gray-300"
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
            Back
          </Button>
        )}

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered}
            isLoading={isSubmitting}
            className="w-full sm:w-auto"
          >
            Submit All Answers
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!currentAnswer}
            className="w-full sm:w-auto"
          >
            Next Step
          </Button>
        )}
      </div>
    </div>
  );
}
