import type {
  RegisterInput,
  LoginInput,
  UserProfile,
} from "@transcendence/shared";
import { api } from "./client.js";

interface MessageResponse {
  message: string;
}

interface LoginResponse {
  requires2FA?: boolean;
}

export const authApi = {
  register: (data: RegisterInput) =>
    api.post<UserProfile>("/api/v1/auth/register", data),

  login: (data: LoginInput) =>
    api.post<UserProfile | LoginResponse>("/api/v1/auth/login", data),

  logout: () => api.post<MessageResponse>("/api/v1/auth/logout"),

  getMe: () => api.get<UserProfile>("/api/v1/auth/me"),

  forgotPassword: (email: string) =>
    api.post<MessageResponse>("/api/v1/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    api.post<MessageResponse>("/api/v1/auth/reset-password", {
      token,
      password,
    }),

  verify2FA: (code: string) =>
    api.post<UserProfile>("/api/v1/auth/2fa/verify", { code }),
};
