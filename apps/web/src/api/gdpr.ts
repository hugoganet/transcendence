import type {
  GdprExportResponse,
  GdprDeletionResponse,
  GdprExportData,
} from "@transcendence/shared";
import { api } from "./client.js";

export const gdprApi = {
  requestExport: () =>
    api.post<GdprExportResponse>("/api/v1/gdpr/export"),

  downloadExport: (token: string) =>
    api.get<GdprExportData>(`/api/v1/gdpr/export/${encodeURIComponent(token)}`),

  requestDeletion: () =>
    api.post<GdprDeletionResponse>("/api/v1/gdpr/delete"),

  confirmDeletion: (token: string) =>
    api.post<GdprDeletionResponse>(
      `/api/v1/gdpr/delete/confirm/${encodeURIComponent(token)}`,
    ),
};
