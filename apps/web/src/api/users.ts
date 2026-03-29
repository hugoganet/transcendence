import type {
  UserProfile,
  PublicProfile,
  Certificate,
  CertificateShareResponse,
} from "@transcendence/shared";
import { api } from "./client.js";

export const usersApi = {
  getProfile: () => api.get<UserProfile>("/api/v1/users/me"),

  updateProfile: (data: { displayName?: string; bio?: string }) =>
    api.patch<UserProfile>("/api/v1/users/me", data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.upload<UserProfile>("/api/v1/users/me/avatar", formData);
  },

  getPublicProfile: (userId: string) =>
    api.get<PublicProfile>(`/api/v1/users/${userId}/profile`),

  getCertificate: () =>
    api.get<Certificate>("/api/v1/users/me/certificate"),

  getCertificateShareUrl: () =>
    api.get<CertificateShareResponse>("/api/v1/users/me/certificate/share"),
};
