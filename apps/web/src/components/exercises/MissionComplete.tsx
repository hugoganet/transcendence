import { Link } from "react-router-dom";
import type { CompleteMissionResponse } from "@transcendence/shared";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../ui/Card.js";
import { Button } from "../ui/Button.js";
import { ProgressBar } from "../ui/ProgressBar.js";

interface MissionCompleteProps {
  data: CompleteMissionResponse;
}

export function MissionComplete({ data }: MissionCompleteProps) {
  const { t } = useTranslation();
  return (
    <Card className="text-center">
      <div className="space-y-6 py-4">
        {/* Success icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 font-heading">
            {t("labels.missionComplete")}
          </h2>
          {data.chapterCompleted && (
            <p className="mt-1 text-sm text-secondary font-medium">
              {t("exercise.chapterComplete")}
            </p>
          )}
          {data.categoryCompleted && (
            <p className="mt-1 text-sm text-secondary font-medium">
              {t("exercise.categoryMastered")}
            </p>
          )}
        </div>

        {/* Progress */}
        <div>
          <ProgressBar
            value={data.completionPercentage}
            showLabel
            className="mx-auto max-w-xs"
          />
          <p className="mt-1 text-xs text-gray-500">{t("exercise.overallProgress")}</p>
        </div>

        {/* Progressive reveal announcement */}
        {data.revealTriggered && data.progressiveReveal && (
          <div className="rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3">
            <p className="text-sm font-medium text-secondary">
              {t("exercise.featureUnlocked")}
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {data.progressiveReveal.description}
            </p>
          </div>
        )}

        {/* Achievements */}
        {data.newAchievements.length > 0 && (
          <div className="space-y-2">
            {data.newAchievements.map((achievement) => (
              <div
                key={achievement.code}
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <p className="text-sm font-medium text-amber-800">
                  {t("exercise.achievementPrefix")}{achievement.title}
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Certificate */}
        {data.certificateGenerated && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
            <p className="text-sm font-medium text-primary">
              {t("exercise.certificateGenerated")}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col items-center gap-3">
          {data.nextMissionId ? (
            <Link to={`/missions/${data.nextMissionId}`}>
              <Button>{t("exercise.nextMission")}</Button>
            </Link>
          ) : (
            <Link to="/curriculum">
              <Button>{t("pages.mission.backToCurriculum")}</Button>
            </Link>
          )}
          <Link
            to="/curriculum"
            className="text-sm text-gray-500 hover:text-primary"
          >
            {t("exercise.viewCurriculumMap")}
          </Link>
        </div>
      </div>
    </Card>
  );
}
