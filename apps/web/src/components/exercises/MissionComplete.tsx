/**
 * @file MissionComplete — success screen shown after completing a mission with progress and rewards.
 * FR: MissionComplete — écran de succès affiché après la complétion d'une mission avec progression et récompenses.
 */
import { Link } from "react-router-dom";
import type { CompleteMissionResponse } from "@transcendence/shared";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../ui/Card.js";
import { Button } from "../ui/Button.js";
import { ProgressBar } from "../ui/ProgressBar.js";

/** Props for MissionComplete. / FR: Props pour MissionComplete. */
interface MissionCompleteProps {
  data: CompleteMissionResponse;
}

/**
 * Success screen with progress bar, achievements, reveals, and next-mission navigation.
 * FR: Écran de succès avec barre de progression, succès, révélations et navigation vers la mission suivante.
 */
export function MissionComplete({ data }: MissionCompleteProps) {
  const { t } = useTranslation();
  return (
    <Card className="text-center">
      <div className="space-y-6 py-4">
        {/* Success icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)] font-heading">
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
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t("exercise.overallProgress")}</p>
        </div>

        {/* Progressive reveal announcement */}
        {data.revealTriggered && data.progressiveReveal && (
          <div className="rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3">
            <p className="text-sm font-medium text-secondary">
              {t("exercise.featureUnlocked")}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text)]">
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
                className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3"
              >
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {t("exercise.achievementPrefix")}{achievement.title}
                </p>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
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
            className="text-sm text-[var(--color-text-muted)] hover:text-primary dark:hover:text-primary"
          >
            {t("exercise.viewCurriculumMap")}
          </Link>
        </div>
      </div>
    </Card>
  );
}
