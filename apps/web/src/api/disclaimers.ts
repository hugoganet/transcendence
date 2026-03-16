import { api } from "./client.js";

interface DisclaimerResponse {
  text: string;
  type: "general" | "onboarding" | "module";
  moduleId?: string;
}

export const disclaimersApi = {
  getGeneral: () =>
    api.get<DisclaimerResponse>("/api/v1/disclaimers"),

  getOnboarding: () =>
    api.get<DisclaimerResponse>("/api/v1/disclaimers/onboarding"),

  getModule: (moduleId: string) =>
    api.get<DisclaimerResponse>(
      `/api/v1/disclaimers/module/${encodeURIComponent(moduleId)}`,
    ),

  accept: () =>
    api.post<unknown>("/api/v1/disclaimers/accept"),
};
