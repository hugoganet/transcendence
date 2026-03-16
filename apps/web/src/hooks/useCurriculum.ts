import { useState, useEffect, useCallback } from "react";
import type { CurriculumWithProgress } from "@transcendence/shared";
import { curriculumApi } from "../api/curriculum.js";

interface UseCurriculumResult {
  curriculum: CurriculumWithProgress | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCurriculum(): UseCurriculumResult {
  const [curriculum, setCurriculum] =
    useState<CurriculumWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await curriculumApi.getCurriculum();
      setCurriculum(data);
    } catch {
      setError("Failed to load curriculum");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { curriculum, isLoading, error, refresh };
}
