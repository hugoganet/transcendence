/**
 * @file ExerciseContainer — dispatches to the correct exercise component by type and handles submission.
 * FR: ExerciseContainer — aiguille vers le bon composant d'exercice par type et gère la soumission.
 */
import { useState } from "react";
import type {
  ExerciseResult,
  SIExerciseContent,
  CMExerciseContent,
  IPExerciseContent,
  STExerciseContent,
  ExerciseSubmission,
} from "@transcendence/shared";
import { useTranslation } from "react-i18next";
import { exercisesApi } from "../../api/exercises.js";
import { ApiError } from "../../api/client.js";
import { SIExercise } from "./SIExercise.js";
import { CMExercise } from "./CMExercise.js";
import { IPExercise } from "./IPExercise.js";
import { STExercise } from "./STExercise.js";
import { ExerciseResultView } from "./ExerciseResult.js";
import { Alert } from "../ui/Alert.js";

/** Props for ExerciseContainer. / FR: Props pour ExerciseContainer. */
interface ExerciseContainerProps {
  exerciseId: string;
  exerciseType: string;
  exerciseContent: unknown;
  onComplete: (result: ExerciseResult) => void;
}

/**
 * Routes to the right exercise type (SI/CM/IP/ST), submits answers, and shows results.
 * FR: Dirige vers le bon type d'exercice (SI/CM/IP/ST), soumet les réponses et affiche les résultats.
 */
export function ExerciseContainer({
  exerciseId,
  exerciseType,
  exerciseContent,
  onComplete,
}: ExerciseContainerProps) {
  const { t } = useTranslation();
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (submission: ExerciseSubmission) => {
    setIsSubmitting(true);
    setError("");
    try {
      const data = await exercisesApi.submit(exerciseId, submission);
      setResult(data);
      onComplete(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.code === "TOKEN_DEBT"
            ? t("exercise.errors.insufficientTokens")
            : t("exercise.errors.submitFailed"),
        );
      } else {
        setError(t("errors.serverError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return <ExerciseResultView result={result} />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  const content = exerciseContent as Record<string, unknown>;

  switch (exerciseType) {
    case "SI":
      return (
        <SIExercise
          content={content as unknown as SIExerciseContent}
          onSubmit={(selectedOptionId) =>
            handleSubmit({
              type: "SI",
              submission: { selectedOptionId },
            })
          }
          isSubmitting={isSubmitting}
        />
      );
    case "CM":
      return (
        <CMExercise
          content={content as unknown as CMExerciseContent}
          onSubmit={(matches) =>
            handleSubmit({ type: "CM", submission: { matches } })
          }
          isSubmitting={isSubmitting}
        />
      );
    case "IP":
      return (
        <IPExercise
          content={content as unknown as IPExerciseContent}
          onSubmit={(positions) =>
            handleSubmit({ type: "IP", submission: { positions } })
          }
          isSubmitting={isSubmitting}
        />
      );
    case "ST":
      return (
        <STExercise
          content={content as unknown as STExerciseContent}
          onSubmit={(stepAnswers) =>
            handleSubmit({ type: "ST", submission: { stepAnswers } })
          }
          isSubmitting={isSubmitting}
        />
      );
    default:
      return (
        <Alert variant="error">
          {t("exercise.errors.unknownType")}{exerciseType}
        </Alert>
      );
  }
}
