/**
 * @file MissionPage — Mission Page — mission detail with exercises list.
 * FR: Page Mission — detail de mission avec liste d'exercices.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock, ChevronLeft, Clock } from "lucide-react";
import { useMissionDetail } from "../hooks/useMissionDetail.js";
import { disclaimersApi } from "../api/disclaimers.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { StatusBadge } from "../components/ui/StatusBadge.js";
import { ExerciseTypeBadge } from "../components/ui/ExerciseTypeBadge.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";
import { DisclaimerModal } from "../components/DisclaimerModal.js";
import type { MissionStatusValue } from "@transcendence/shared";

const DISCLAIMER_MODULES = ["2.3", "6.1", "6.2"];

export function MissionPage() {
  const { t } = useTranslation();
  const { missionId } = useParams<{ missionId: string }>();
  const { mission, isLoading, error, isLocked } = useMissionDetail(
    missionId ?? "",
  );

  const [disclaimerText, setDisclaimerText] = useState<string | null>(null);
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(false);

  useEffect(() => {
    if (mission) {
      document.title = `${mission.title} — Unblock.chain`;
    } else {
      document.title = `${t("labels.mission")} — Unblock.chain`;
    }
  }, [mission, t]);

  // Check for module disclaimer
  useEffect(() => {
    if (!mission) return;
    // Extract module id (e.g. "2.3" from mission id "2.3.1")
    const parts = mission.id.split(".");
    const moduleId = `${parts[0]}.${parts[1]}`;
    if (!DISCLAIMER_MODULES.includes(moduleId)) return;

    let cancelled = false;
    disclaimersApi.getModule(moduleId).then(
      (data) => {
        if (!cancelled) setDisclaimerText(data.text);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [mission]);

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
        <Card>
          <div className="py-6">
            <Lock className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-warm-50">
              {t("pages.mission.lockedTitle")}
            </h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-warm-200">
              {t("pages.mission.lockedBody")}
            </p>
            <Link to="/curriculum">
              <Button variant="ghost">{t("pages.mission.backToCurriculum")}</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !mission) {
    return <Alert variant="error">{error ?? t("pages.mission.loadError")}</Alert>;
  }

  const canStart =
    mission.status === "available" || mission.status === "inProgress";

  // Show disclaimer modal for investment-adjacent modules
  if (disclaimerText && !disclaimerDismissed) {
    return (
      <DisclaimerModal
        text={disclaimerText}
        onAccept={() => setDisclaimerDismissed(true)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/curriculum"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-warm-200 hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("labels.curriculum")}
      </Link>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400 dark:text-warm-300">
              {mission.id}
            </span>
            <StatusBadge status={mission.status as MissionStatusValue} />
            <ExerciseTypeBadge
              type={mission.exerciseType as "SI" | "CM" | "IP" | "ST"}
            />
          </div>

          <h1 className="text-xl font-bold text-gray-900 dark:text-warm-50 font-heading">
            {mission.title}
          </h1>

          <p className="text-sm text-gray-600 dark:text-warm-200">{mission.description}</p>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {t("labels.learningObjective")}
            </p>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              {mission.learningObjective}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-warm-200">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              ~{mission.estimatedMinutes} {t("labels.minutes")}
            </span>
          </div>

          {canStart && (
            <div className="pt-2">
              <Link to={`/missions/${mission.id}/exercise`}>
                <Button className="w-full sm:w-auto">
                  {mission.status === "inProgress"
                    ? t("pages.mission.continueExercise")
                    : t("pages.mission.startExercise")}
                </Button>
              </Link>
            </div>
          )}

          {mission.status === "completed" && (
            <Alert variant="success">
              {t("pages.mission.alreadyCompleted")}
            </Alert>
          )}
        </div>
      </Card>

      {mission.tooltipTerms && mission.tooltipTerms.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-warm-50">
            {t("pages.mission.keyTerms")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {mission.tooltipTerms.map((term) => (
              <span
                key={term}
                className="rounded-full bg-gray-100 dark:bg-warm-700 px-3 py-1 text-xs text-gray-600 dark:text-warm-200"
              >
                {term}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
