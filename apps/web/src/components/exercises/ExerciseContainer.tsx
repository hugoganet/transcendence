import { useState } from "react";
import type {
  ExerciseResult,
  SIExerciseContent,
  CMExerciseContent,
  IPExerciseContent,
  STExerciseContent,
  ExerciseSubmission,
} from "@transcendence/shared";
import { exercisesApi } from "../../api/exercises.js";
import { ApiError } from "../../api/client.js";
import { SIExercise } from "./SIExercise.js";
import { CMExercise } from "./CMExercise.js";
import { IPExercise } from "./IPExercise.js";
import { STExercise } from "./STExercise.js";
import { ExerciseResultView } from "./ExerciseResult.js";
import { Alert } from "../ui/Alert.js";

interface ExerciseContainerProps {
  exerciseId: string;
  exerciseType: string;
  exerciseContent: unknown;
  onComplete: (result: ExerciseResult) => void;
}

export function ExerciseContainer({
  exerciseId,
  exerciseType,
  exerciseContent,
  onComplete,
}: ExerciseContainerProps) {
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
            ? "You don't have enough tokens. Complete more missions to earn tokens."
            : "Failed to submit answer. Please try again.",
        );
      } else {
        setError("Something went wrong. Please try again.");
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
          Unknown exercise type: {exerciseType}
        </Alert>
      );
  }
}
