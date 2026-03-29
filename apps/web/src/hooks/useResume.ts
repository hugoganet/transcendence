import { useState, useEffect, useCallback } from "react";
import type { ResumeResponse } from "@transcendence/shared";
import { curriculumApi } from "../api/curriculum.js";

interface UseResumeResult {
  resume: ResumeResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useResume(): UseResumeResult {
  const [resume, setResume] = useState<ResumeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await curriculumApi.getResume();
      setResume(data);
    } catch {
      setError("Failed to load resume point");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { resume, isLoading, error, refresh };
}
