import { useState, useEffect, useCallback } from "react";
import type { MissionDetailResponse } from "@transcendence/shared";
import { curriculumApi } from "../api/curriculum.js";
import { ApiError } from "../api/client.js";

interface UseMissionDetailResult {
  mission: MissionDetailResponse | null;
  isLoading: boolean;
  error: string | null;
  isLocked: boolean;
  refresh: () => Promise<void>;
}

export function useMissionDetail(missionId: string): UseMissionDetailResult {
  const [mission, setMission] = useState<MissionDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsLocked(false);
    try {
      const data = await curriculumApi.getMissionDetail(missionId);
      setMission(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setIsLocked(true);
      } else {
        setError("Failed to load mission");
      }
    } finally {
      setIsLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { mission, isLoading, error, isLocked, refresh };
}
