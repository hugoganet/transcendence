import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
          ? "border-gray-100 bg-gray-50 text-gray-400"
          : mission.status === "completed"
            ? "border-green-100 bg-green-50/50"
            : "border-primary/20 bg-white hover:border-primary/40"
      }`}
    >
      <span
        className={`text-sm ${
          mission.status === "locked" ? "text-gray-400" : "text-gray-900"
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
  const [open, setOpen] = useState(defaultOpen);

  const completedCount = chapter.missions.filter(
    (m) => m.status === "completed",
  ).length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400">
            {chapter.chapterId}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                Chapter {chapter.chapterId}
              </span>
              <StatusBadge status={chapter.status} />
            </div>
            <span className="text-xs text-gray-500">
              {completedCount}/{chapter.missions.length} missions
            </span>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="space-y-2 border-t border-gray-100 px-4 py-3">
          {chapter.missions.map((mission) => (
            <MissionNode key={mission.missionId} mission={mission} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategorySection({ category }: { category: CategoryProgressOverlay }) {
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

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {category.categoryId}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                Category {category.categoryId}
              </h2>
              <StatusBadge status={category.status} />
            </div>
            <span className="text-xs text-gray-500">
              {completedMissions}/{totalMissions} missions
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
  const { curriculum, isLoading, error } = useCurriculum();

  useEffect(() => {
    document.title = "Curriculum — Transcendence";
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !curriculum) {
    return <Alert variant="error">{error ?? "Failed to load curriculum"}</Alert>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-heading">
          Curriculum
        </h1>
        <div className="mt-2 flex items-center gap-4">
          <ProgressBar
            value={curriculum.completedMissions}
            max={curriculum.totalMissions}
            showLabel
            className="flex-1"
          />
          <span className="text-sm text-gray-500">
            {curriculum.completedMissions}/{curriculum.totalMissions} missions
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {curriculum.categories.map((category) => (
          <CategorySection key={category.categoryId} category={category} />
        ))}
      </div>
    </div>
  );
}
