/**
 * @file CurriculumPage — Curriculum Page — browse categories, modules, and missions.
 * FR: Page Curriculum — parcourir categories, modules et missions.
 */
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurriculum } from "../hooks/useCurriculum.js";
import { ProgressBar } from "../components/ui/ProgressBar.js";
import { StatusBadge } from "../components/ui/StatusBadge.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";
import type {
  CategoryProgressOverlay,
  ChapterProgressOverlay,
  MissionProgressOverlay,
} from "@transcendence/shared";

function MissionNode({ mission }: { mission: MissionProgressOverlay }) {
  const isClickable =
    mission.status === "available" || mission.status === "inProgress" || mission.status === "completed";

  const content = (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
        mission.status === "locked"
          ? "border-gray-100 dark:border-warm-700 bg-[var(--color-background)] text-gray-400 dark:text-warm-200"
          : mission.status === "completed"
            ? "border-green-100 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20"
            : "border-primary/20 bg-[var(--color-surface)] hover:border-primary/40"
      }`}
    >
      <span
        className={`text-sm ${
          mission.status === "locked" ? "text-gray-400 dark:text-warm-200" : "text-[var(--color-text)]"
        }`}
      >
        {mission.missionId}
      </span>
      <StatusBadge status={mission.status} />
    </div>
  );

  if (isClickable) {
    return <Link to={`/missions/${mission.missionId}`}>{content}</Link>;
  }

  return content;
}

function ChapterSection({
  chapter,
  defaultOpen,
}: {
  chapter: ChapterProgressOverlay;
  defaultOpen: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  const completedCount = chapter.missions.filter(
    (m) => m.status === "completed",
  ).length;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400 dark:text-warm-200">
            {chapter.chapterId}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--color-text)]">
                {t("pages.curriculum.chapterLabel", { id: chapter.chapterId })}
              </span>
              <StatusBadge status={chapter.status} />
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              {completedCount}/{chapter.missions.length} {t("labels.missions")}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 dark:text-warm-200 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-2 border-t border-gray-100 dark:border-warm-700 px-4 py-3">
          {chapter.missions.map((mission) => (
            <MissionNode key={mission.missionId} mission={mission} />
          ))}
        </div>
      )}
    </div>
  );
}

const categoryColors = [
  { bg: "bg-teal-500/10 dark:bg-teal-500/20", text: "text-teal-600 dark:text-teal-400", ring: "ring-teal-500/30" },
  { bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/30" },
  { bg: "bg-purple-500/10 dark:bg-purple-500/20", text: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30" },
  { bg: "bg-amber-500/10 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/30" },
  { bg: "bg-green-500/10 dark:bg-green-500/20", text: "text-green-600 dark:text-green-400", ring: "ring-green-500/30" },
  { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-600 dark:text-red-400", ring: "ring-red-500/30" },
];

function CategorySection({ category, index }: { category: CategoryProgressOverlay; index: number }) {
  const { t } = useTranslation();
  const colors = categoryColors[index % categoryColors.length];
  const totalMissions = category.chapters.reduce(
    (sum, ch) => sum + ch.missions.length,
    0,
  );
  const completedMissions = category.chapters.reduce(
    (sum, ch) =>
      sum + ch.missions.filter((m) => m.status === "completed").length,
    0,
  );

  const isActive =
    category.status === "inProgress" || category.status === "available";
  const isComplete = category.status === "completed";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ring-1 ${colors.bg} ${colors.text} ${colors.ring} ${isComplete ? "ring-2" : ""}`}>
            {isComplete ? "\u2713" : category.categoryId}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                {t("pages.curriculum.categoryLabel", { id: category.categoryId })}
              </h2>
              <StatusBadge status={category.status} />
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              {completedMissions}/{totalMissions} {t("labels.missions")}
            </span>
          </div>
        </div>
      </div>

      {totalMissions > 0 && (
        <ProgressBar value={completedMissions} max={totalMissions} />
      )}

      <div className="space-y-2 pl-2">
        {category.chapters.map((chapter) => (
          <ChapterSection
            key={chapter.chapterId}
            chapter={chapter}
            defaultOpen={
              isActive &&
              (chapter.status === "inProgress" ||
                chapter.status === "available")
            }
          />
        ))}
      </div>
    </section>
  );
}

export function CurriculumPage() {
  const { t } = useTranslation();
  const { curriculum, isLoading, error } = useCurriculum();

  useEffect(() => {
    document.title = `${t("labels.curriculum")} — Unblock.chain`;
  }, [t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !curriculum) {
    return <Alert variant="error">{error ?? t("pages.curriculum.loadError")}</Alert>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] font-heading">
          {t("labels.curriculum")}
        </h1>
        <div className="mt-2 flex items-center gap-4">
          <ProgressBar
            value={curriculum.completedMissions}
            max={curriculum.totalMissions}
            showLabel
            className="flex-1"
          />
          <span className="text-sm text-[var(--color-text-muted)]">
            {curriculum.completedMissions}/{curriculum.totalMissions} {t("labels.missions")}
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {curriculum.categories.map((category, i) => (
          <CategorySection key={category.categoryId} category={category} index={i} />
        ))}
      </div>
    </div>
  );
}
