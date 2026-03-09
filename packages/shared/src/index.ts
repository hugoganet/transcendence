export type { ApiResponse, ApiError } from "./types/api.js";
export { apiResponseSchema, apiErrorSchema } from "./schemas/common.js";
export {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  totpCodeSchema,
  userProfileSchema,
  oauthProviderSchema,
  type OAuthProvider,
  type RegisterInput,
  type LoginInput,
  type UserProfile,
} from "./schemas/auth.js";
export { API_VERSION, DEFAULT_PORT, SESSION_TIMEOUT_MS } from "./constants/config.js";
