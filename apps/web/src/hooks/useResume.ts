/**
 * @file useResume — useResume — finds the next incomplete mission to resume.
 * FR: useResume — trouve la prochaine mission incomplete a reprendre.
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { ResumeResponse } from "@transcendence/shared";
import { curriculumApi } from "../api/curriculum.js";

interface UseResumeResult {
  resume: ResumeResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useResume(): UseResumeResult {
  const { i18n } = useTranslation();
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
  }, [refresh, i18n.language]);

  return { resume, isLoading, error, refresh };
}
