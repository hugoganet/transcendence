import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  const { missionId } = useParams<{ missionId: string }>();
  const { mission, isLoading, error, isLocked } = useMissionDetail(
    missionId ?? "",
  );

  const [disclaimerText, setDisclaimerText] = useState<string | null>(null);
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(false);

  useEffect(() => {
    if (mission) {
      document.title = `${mission.title} — Transcendence`;
    } else {
      document.title = "Mission — Transcendence";
    }
  }, [mission]);

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
            <svg
              className="mx-auto mb-4 h-12 w-12 text-gray-300"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              Mission Locked
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Complete the previous missions to unlock this one.
            </p>
            <Link to="/curriculum">
              <Button variant="ghost">Back to Curriculum</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !mission) {
    return <Alert variant="error">{error ?? "Failed to load mission"}</Alert>;
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
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Curriculum
      </Link>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400">
              {mission.id}
            </span>
            <StatusBadge status={mission.status as MissionStatusValue} />
            <ExerciseTypeBadge
              type={mission.exerciseType as "SI" | "CM" | "IP" | "ST"}
            />
          </div>

          <h1 className="text-xl font-bold text-gray-900 font-heading">
            {mission.title}
          </h1>

          <p className="text-sm text-gray-600">{mission.description}</p>

          <div className="rounded-lg bg-blue-50 px-4 py-3">
            <p className="text-sm font-medium text-blue-800">
              Learning Objective
            </p>
            <p className="mt-1 text-sm text-blue-700">
              {mission.learningObjective}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              ~{mission.estimatedMinutes} min
            </span>
          </div>

          {canStart && (
            <div className="pt-2">
              <Link to={`/missions/${mission.id}/exercise`}>
                <Button className="w-full sm:w-auto">
                  {mission.status === "inProgress"
                    ? "Continue Exercise"
                    : "Start Exercise"}
                </Button>
              </Link>
            </div>
          )}

          {mission.status === "completed" && (
            <Alert variant="success">
              You've already completed this mission.
            </Alert>
          )}
        </div>
      </Card>

      {mission.tooltipTerms && mission.tooltipTerms.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Key Terms
          </h2>
          <div className="flex flex-wrap gap-2">
            {mission.tooltipTerms.map((term) => (
              <span
                key={term}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
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
