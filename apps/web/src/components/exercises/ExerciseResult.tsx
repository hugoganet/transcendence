/**
 * @file ExerciseResult — displays score, gas fee, token balance, and per-item feedback.
 * FR: ExerciseResult — affiche le score, les frais de gas, le solde de jetons et le feedback par item.
 */
import type { ExerciseResult as ExerciseResultType } from "@transcendence/shared";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useReveals } from "../../contexts/RevealContext.js";
import { Alert } from "../ui/Alert.js";

/** Props for ExerciseResultView. / FR: Props pour ExerciseResultView. */
interface ExerciseResultProps {
  result: ExerciseResultType;
}

export function ExerciseResultView({ result }: ExerciseResultProps) {
  const { t } = useTranslation();
  const { gasRevealed } = useReveals();

  return (
    <div className="space-y-4">
      <Alert variant={result.correct ? "success" : "error"}>
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {result.correct ? t("labels.correct") : t("labels.incorrect")}
          </span>
          <span className="text-sm">
            {result.score}/{result.totalPoints} points
          </span>
        </div>
      </Alert>

      {gasRevealed && result.gasFee !== undefined && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 text-sm">
          <span className="text-amber-800">{t("exercise.gasFeeLabel")}</span>
          <span className="font-medium text-amber-900">
            -{result.gasFee} tokens
          </span>
        </div>
      )}

      {gasRevealed && result.tokenBalance !== undefined && (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <span className="text-gray-600">{t("gamification.tokens.tokenBalance")}</span>
          <span className="font-medium text-gray-900">
            {result.tokenBalance}
          </span>
        </div>
      )}

      {result.feedback.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">{t("exercise.feedback.explanationLabel")}</h3>
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
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
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
                      {t("exercise.correctAnswerPrefix")}{item.correctAnswer}
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
