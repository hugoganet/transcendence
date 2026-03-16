import type { ExerciseResult as ExerciseResultType } from "@transcendence/shared";
import { useReveals } from "../../contexts/RevealContext.js";
import { Alert } from "../ui/Alert.js";

interface ExerciseResultProps {
  result: ExerciseResultType;
}

export function ExerciseResultView({ result }: ExerciseResultProps) {
  const { gasRevealed } = useReveals();

  return (
    <div className="space-y-4">
      <Alert variant={result.correct ? "success" : "error"}>
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {result.correct ? "Correct!" : "Not quite right"}
          </span>
          <span className="text-sm">
            {result.score}/{result.totalPoints} points
          </span>
        </div>
      </Alert>

      {gasRevealed && result.gasFee !== undefined && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 text-sm">
          <span className="text-amber-800">Gas fee</span>
          <span className="font-medium text-amber-900">
            -{result.gasFee} tokens
          </span>
        </div>
      )}

      {gasRevealed && result.tokenBalance !== undefined && (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <span className="text-gray-600">Token balance</span>
          <span className="font-medium text-gray-900">
            {result.tokenBalance}
          </span>
        </div>
      )}

      {result.feedback.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Feedback</h3>
          {result.feedback.map((item) => (
            <div
              key={item.itemId}
              className={`rounded-lg border p-3 text-sm ${
                item.correct
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-2">
                {item.correct ? (
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <div>
                  <p
                    className={
                      item.correct ? "text-green-800" : "text-red-800"
                    }
                  >
                    {item.explanation}
                  </p>
                  {item.correctAnswer && !item.correct && (
                    <p className="mt-1 text-xs text-red-600">
                      Correct answer: {item.correctAnswer}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
