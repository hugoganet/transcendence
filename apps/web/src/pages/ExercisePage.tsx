import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import type {
  ExerciseResult,
  CompleteMissionResponse,
} from "@transcendence/shared";
import { useMissionDetail } from "../hooks/useMissionDetail.js";
import { useReveals } from "../contexts/RevealContext.js";
import { curriculumApi } from "../api/curriculum.js";
import { ApiError } from "../api/client.js";
import { ExerciseContainer } from "../components/exercises/ExerciseContainer.js";
import { MissionComplete } from "../components/exercises/MissionComplete.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

export function ExercisePage() {
  const { t } = useTranslation();
  const { missionId } = useParams<{ missionId: string }>();
  const { mission, isLoading, error, isLocked } = useMissionDetail(
    missionId ?? "",
  );
  const { refresh: refreshReveals } = useReveals();

  const [exerciseResult, setExerciseResult] = useState<ExerciseResult | null>(
    null,
  );
  const [completionData, setCompletionData] =
    useState<CompleteMissionResponse | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [confidenceRating, setConfidenceRating] = useState<number>(3);

  useEffect(() => {
    if (mission) {
      document.title = `${mission.title} — Exercise — Unblock.chain`;
    }
  }, [mission]);

  const handleExerciseComplete = (result: ExerciseResult) => {
    setExerciseResult(result);
  };

  const handleCompleteMission = async () => {
    if (!missionId) return;
    setIsCompleting(true);
    setCompleteError("");
    try {
      const data = await curriculumApi.completeMission(
        missionId,
        confidenceRating,
      );
      setCompletionData(data);
      if (data.revealTriggered) {
        await refreshReveals();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setCompleteError(t("pages.exercise.completeMissionError"));
      }
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <Alert variant="error">
          {t("pages.exercise.lockedMessage")}
        </Alert>
        <Link to="/curriculum" className="mt-4 inline-block">
          <Button variant="ghost">{t("pages.mission.backToCurriculum")}</Button>
        </Link>
      </div>
    );
  }

  if (error || !mission) {
    return <Alert variant="error">{error ?? t("pages.mission.loadError")}</Alert>;
  }

  // Mission already completed — show completion view
  if (completionData) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <MissionComplete data={completionData} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to={`/missions/${mission.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("pages.exercise.missionDetails")}
      </Link>

      <Card>
        <div className="mb-4">
          <span className="text-xs font-medium text-gray-400">
            {mission.id}
          </span>
          <h1 className="text-lg font-bold text-gray-900 font-heading">
            {mission.title}
          </h1>
        </div>

        <ExerciseContainer
          exerciseId={mission.id}
          exerciseType={mission.exerciseType}
          exerciseContent={mission.exerciseContent}
          onComplete={handleExerciseComplete}
        />
      </Card>

      {/* Complete mission button — shown after exercise submission */}
      {exerciseResult && !completionData && (
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("pages.exercise.confidenceQuestion")}
            </h3>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setConfidenceRating(rating)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    confidenceRating === rating
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400">
              {t("pages.exercise.confidenceScale")}
            </p>

            {completeError && (
              <Alert variant="error">{completeError}</Alert>
            )}

            <Button
              onClick={handleCompleteMission}
              isLoading={isCompleting}
              className="w-full"
            >
              {t("pages.exercise.completeMission")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
