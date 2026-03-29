import { useState } from "react";
import type { CMExerciseContent } from "@transcendence/shared";
import { Button } from "../ui/Button.js";

interface CMExerciseProps {
  content: CMExerciseContent;
  onSubmit: (matches: Array<{ termId: string; definitionId: string }>) => void;
  isSubmitting: boolean;
}

export function CMExercise({
  content,
  onSubmit,
  isSubmitting,
}: CMExerciseProps) {
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
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-700">{content.instruction}</p>
      </div>

      {/* Matched pairs display */}
      {matches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">
            Matched ({matches.length}/{content.pairs.length})
          </p>
          {matches.map((match) => {
            const term = content.pairs.find((p) => p.id === match.termId);
            const def = shuffledDefs.find((d) => d.id === match.definitionId);
            return (
              <div
                key={match.termId}
                className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm"
              >
                <span className="flex-1 font-medium text-gray-900">
                  {term?.term}
                </span>
                <svg
                  className="h-4 w-4 shrink-0 text-green-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="flex-1 text-gray-700">{def?.definition}</span>
                <button
                  onClick={() => handleUndo(match.termId)}
                  className="ml-2 text-xs text-gray-400 hover:text-red-500"
                  aria-label="Undo match"
                >
                  Undo
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
            <p className="text-xs font-medium text-gray-500">Terms</p>
            {content.pairs
              .filter((p) => !matchedTermIds.has(p.id))
              .map((pair) => (
                <button
                  key={pair.id}
                  type="button"
                  onClick={() => handleTermClick(pair.id)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    selectedTerm === pair.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {pair.term}
                </button>
              ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Definitions</p>
            {shuffledDefs
              .filter((d) => !matchedDefIds.has(d.id))
              .map((def) => (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => handleDefClick(def.id)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    selectedTerm
                      ? "border-gray-200 bg-white hover:border-primary/40"
                      : "cursor-default border-gray-200 bg-white"
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
        Submit Answer
      </Button>
    </div>
  );
}
