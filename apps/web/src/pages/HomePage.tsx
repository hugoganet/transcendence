/**
 * @file HomePage — Home Page — landing page for authenticated users.
 * FR: Page Accueil — page d'accueil pour utilisateurs authentifies.
 */
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const quotes = [
  { text: "The blockchain is an incorruptible digital ledger.", author: "Don & Alex Tapscott" },
  { text: "Bitcoin is a technological tour de force.", author: "Bill Gates" },
  { text: "Blockchain will do to finance what the internet did to media.", author: "Unknown" },
  { text: "Code is law.", author: "Lawrence Lessig" },
  { text: "In cryptography we trust.", author: "Unknown" },
  { text: "Not your keys, not your coins.", author: "Andreas Antonopoulos" },
  { text: "The best time to learn blockchain was yesterday. The second best time is now.", author: "Unknown" },
  { text: "Trust, but verify — that is the essence of blockchain.", author: "Unknown" },
];
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
  const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

  useEffect(() => {
    document.title = `${t("labels.home")} — Unblock.chain`;
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

      {/* Motivational quote */}
      <div className="rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 to-transparent p-4 dark:border-primary/20 dark:from-primary/10">
        <p className="text-sm italic text-gray-600 dark:text-warm-200">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-warm-300">
          — {quote.author}
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
