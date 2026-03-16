import { Link } from "react-router-dom";
import type { CompleteMissionResponse } from "@transcendence/shared";
import { Card } from "../ui/Card.js";
import { Button } from "../ui/Button.js";
import { ProgressBar } from "../ui/ProgressBar.js";

interface MissionCompleteProps {
  data: CompleteMissionResponse;
}

export function MissionComplete({ data }: MissionCompleteProps) {
  return (
    <Card className="text-center">
      <div className="space-y-6 py-4">
        {/* Success icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 font-heading">
            Mission Complete!
          </h2>
          {data.chapterCompleted && (
            <p className="mt-1 text-sm text-secondary font-medium">
              Chapter completed!
            </p>
          )}
          {data.categoryCompleted && (
            <p className="mt-1 text-sm text-secondary font-medium">
              Category mastered!
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
          <p className="mt-1 text-xs text-gray-500">Overall progress</p>
        </div>

        {/* Progressive reveal announcement */}
        {data.revealTriggered && data.progressiveReveal && (
          <div className="rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3">
            <p className="text-sm font-medium text-secondary">
              New feature unlocked!
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
                  Achievement: {achievement.title}
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
              Congratulations! Your completion certificate has been generated.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col items-center gap-3">
          {data.nextMissionId ? (
            <Link to={`/missions/${data.nextMissionId}`}>
              <Button>Next Mission</Button>
            </Link>
          ) : (
            <Link to="/curriculum">
              <Button>Back to Curriculum</Button>
            </Link>
          )}
          <Link
            to="/curriculum"
            className="text-sm text-gray-500 hover:text-primary"
          >
            View Curriculum Map
          </Link>
        </div>
      </div>
    </Card>
  );
}
