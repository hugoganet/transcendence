import type {
  CurriculumWithProgress,
  MissionDetailResponse,
  ResumeResponse,
  LearningChainResponse,
  CompleteMissionResponse,
} from "@transcendence/shared";
import { api } from "./client.js";

export const curriculumApi = {
  getCurriculum: () =>
    api.get<CurriculumWithProgress>("/api/v1/curriculum"),

  getMissionDetail: (missionId: string) =>
    api.get<MissionDetailResponse>(`/api/v1/curriculum/missions/${missionId}`),

  getResume: () =>
    api.get<ResumeResponse>("/api/v1/curriculum/resume"),

  getLearningChain: () =>
    api.get<LearningChainResponse>("/api/v1/curriculum/chain"),

  completeMission: (missionId: string, confidenceRating?: number) =>
    api.post<CompleteMissionResponse>(
      `/api/v1/curriculum/missions/${missionId}/complete`,
      confidenceRating !== undefined ? { confidenceRating } : {},
    ),
};
