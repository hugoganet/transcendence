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
export {
  updateProfileSchema,
  type UpdateProfileInput,
} from "./schemas/user.js";
export { moduleIdParamSchema } from "./schemas/disclaimer.js";
export { API_VERSION, DEFAULT_PORT, SESSION_TIMEOUT_MS } from "./constants/config.js";
export {
  exerciseTypeSchema,
  progressiveRevealMechanicSchema,
  progressiveRevealSchema,
  missionSchema,
  chapterSchema,
  categorySchema,
  curriculumStructureSchema,
} from "./schemas/curriculum.js";
export {
  siExerciseContentSchema,
  cmExerciseContentSchema,
  ipExerciseContentSchema,
  stExerciseContentSchema,
  exerciseContentSchema,
} from "./schemas/exercise.js";
export { tooltipSchema, tooltipCollectionSchema } from "./schemas/tooltip.js";
export type {
  ExerciseType,
  ProgressiveReveal,
  Mission,
  Chapter,
  Category,
  CurriculumStructure,
  SIExerciseContent,
  CMExerciseContent,
  IPExerciseContent,
  STExerciseContent,
  ExerciseContent,
  Tooltip,
  TooltipCollection,
  MissionContent,
  MissionContentCollection,
  UIStrings,
} from "./types/curriculum.js";
