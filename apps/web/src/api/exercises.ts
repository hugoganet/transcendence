/**
 * @file exercises API — submit exercise answers and fetch results.
 * FR: API exercises — soumettre les reponses et recuperer les resultats.
 */
import type {
  ExerciseSubmission,
  ExerciseResult,
  MissionExerciseStatus,
} from "@transcendence/shared";
import { api } from "./client.js";

export const exercisesApi = {
  submit: (exerciseId: string, submission: ExerciseSubmission) =>
    api.post<ExerciseResult>(
      `/api/v1/exercises/${exerciseId}/submit`,
      submission,
    ),

  getMissionStatus: (missionId: string) =>
    api.get<MissionExerciseStatus>(
      `/api/v1/exercises/missions/${missionId}/status`,
    ),
};
