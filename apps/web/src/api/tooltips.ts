/**
 * @file tooltips API — fetch localized tooltips and glossary terms.
 * FR: API tooltips — recuperer les tooltips et termes du glossaire.
 */
import type { GlossaryResponse, TooltipResponse } from "@transcendence/shared";
import { api } from "./client.js";

export const tooltipsApi = {
  getGlossary: () => api.get<GlossaryResponse>("/api/v1/tooltips"),

  getTooltip: (term: string) =>
    api.get<TooltipResponse>(`/api/v1/tooltips/${encodeURIComponent(term)}`),
};
