import type { PublicCertificate } from "@transcendence/shared";
import { api } from "./client.js";

export const certificatesApi = {
  getPublicCertificate: (shareToken: string) =>
    api.get<PublicCertificate>(
      `/api/v1/certificates/${encodeURIComponent(shareToken)}`,
    ),
};
