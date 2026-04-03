import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext.js";
import { useResume } from "../hooks/useResume.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { ProgressBar } from "../components/ui/ProgressBar.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { resume, isLoading } = useResume();

  useEffect(() => {
    document.title = `${t("labels.home")} — Transcendence`;
  }, [t]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-warm-50 font-heading">
          {user?.displayName ? t("pages.home.welcomeNamed", { name: user.displayName }) : t("pages.home.welcome")}
        </h1>
        <p className="mt-1 text-gray-500 dark:text-warm-200">
          {t("pages.home.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : resume ? (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 dark:text-warm-200">
                {t("pages.home.nextMission")}
              </span>
              <span className="text-xs text-gray-500 dark:text-warm-200">
                {resume.chapterTitle}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-warm-50">
              {resume.missionTitle}
            </h2>
            <ProgressBar
              value={resume.completionPercentage}
              showLabel
              className="mt-2"
            />
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link to={`/missions/${resume.missionId}`}>
                <Button className="w-full sm:w-auto">{t("pages.home.continueLearning")}</Button>
              </Link>
              <Link to="/curriculum">
                <Button variant="ghost" className="w-full sm:w-auto">
                  {t("pages.home.browseCurriculum")}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="py-8 text-center">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-warm-50">
              {t("pages.home.startLearning")}
            </h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-warm-200">
              {t("pages.home.startLearningSubtitle")}
            </p>
            <Link to="/curriculum">
              <Button>{t("pages.home.browseCurriculum")}</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
