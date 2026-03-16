import { useState } from "react";
import type { SIExerciseContent } from "@transcendence/shared";
import { Button } from "../ui/Button.js";

interface SIExerciseProps {
  content: SIExerciseContent;
  onSubmit: (selectedOptionId: string) => void;
  isSubmitting: boolean;
}

export function SIExercise({
  content,
  onSubmit,
  isSubmitting,
}: SIExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm leading-relaxed text-gray-700">
          {content.scenario}
        </p>
      </div>

      <h3 className="text-base font-semibold text-gray-900">
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
                : "border-gray-200 bg-white hover:border-gray-300"
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
        Submit Answer
      </Button>
    </div>
  );
}
