import { prisma } from "../config/database.js";
import { getContent } from "../utils/contentLoader.js";
import { AppError } from "../utils/AppError.js";
import { getMissionAccessStatus } from "./curriculumService.js";
import { deductGasFeeWithClient, checkTokenDebt } from "./tokenService.js";
import { GAS_FEE_PER_SUBMISSION } from "@transcendence/shared";
import type {
  ExerciseResult,
  ExerciseFeedbackItem,
  MissionExerciseStatus,
  ExerciseSubmission,
  SIExerciseContent,
  CMExerciseContent,
  IPExerciseContent,
  STExerciseContent,
  Mission,
  Category,
} from "@transcendence/shared";

/**
 * Finds a mission's metadata in the curriculum structure by ID.
 */
function findMission(
  curriculum: Category[],
  missionId: string,
): Mission | null {
  for (const category of curriculum) {
    for (const chapter of category.chapters) {
      for (const mission of chapter.missions) {
        if (mission.id === missionId) {
          return mission;
        }
      }
    }
  }
  return null;
}

/**
 * Resolves locale-aware mission content with fallback to "en".
 */
function resolveMissionContent(missionId: string, locale: string) {
  const content = getContent();
  let missions = content.missions.get(locale);
  if (!missions) {
    missions = content.missions.get("en");
  }
  if (!missions) {
    throw new AppError(500, "CONTENT_UNAVAILABLE", "Mission content not available");
  }
  const missionContent = missions[missionId];
  if (!missionContent) {
    throw new AppError(500, "CONTENT_UNAVAILABLE", `Content for mission ${missionId} not available`);
  }
  return missionContent;
}

/**
 * Validates an SI (Scenario Interpretation) exercise submission.
 */
function validateSI(
  submission: { selectedOptionId: string },
  content: SIExerciseContent,
): { score: number; totalPoints: number; feedback: ExerciseFeedbackItem[] } {
  const selectedOption = content.options.find((o) => o.id === submission.selectedOptionId);
  if (!selectedOption) {
    throw new AppError(400, "INVALID_INPUT", `Option '${submission.selectedOptionId}' not found in exercise`, {
      selectedOptionId: "Option ID not found in exercise content",
    });
  }

  const correctOption = content.options.find((o) => o.isCorrect);
  const feedback: ExerciseFeedbackItem[] = [{
    itemId: selectedOption.id,
    correct: selectedOption.isCorrect,
    explanation: selectedOption.explanation,
    correctAnswer: selectedOption.isCorrect ? null : (correctOption?.text ?? null),
  }];

  return {
    score: selectedOption.isCorrect ? 1 : 0,
    totalPoints: 1,
    feedback,
  };
}

/**
 * Validates a CM (Concept Matching) exercise submission.
 * A match is correct when termId === definitionId (same pair ID).
 */
function validateCM(
  submission: { matches: Array<{ termId: string; definitionId: string }> },
  content: CMExerciseContent,
): { score: number; totalPoints: number; feedback: ExerciseFeedbackItem[] } {
  const pairMap = new Map(content.pairs.map((p) => [p.id, p]));
  const submittedMatchMap = new Map(submission.matches.map((m) => [m.termId, m.definitionId]));

  let score = 0;
  const feedback: ExerciseFeedbackItem[] = [];

  for (const pair of content.pairs) {
    const userDefinitionId = submittedMatchMap.get(pair.id);
    const isCorrect = userDefinitionId === pair.id;
    if (isCorrect) score++;

    let correctAnswer: string | null = null;
    if (!isCorrect) {
      correctAnswer = pair.definition;
    }

    feedback.push({
      itemId: pair.id,
      correct: isCorrect,
      explanation: isCorrect
        ? `Correct: "${pair.term}" matches "${pair.definition}"`
        : `"${pair.term}" should match "${pair.definition}"`,
      correctAnswer,
    });
  }

  return { score, totalPoints: content.pairs.length, feedback };
}

/**
 * Validates an IP (Interactive Placement) exercise submission.
 */
function validateIP(
  submission: { positions: Array<{ itemId: string; position: number }> },
  content: IPExerciseContent,
): { score: number; totalPoints: number; feedback: ExerciseFeedbackItem[] } {
  // Check for duplicate positions
  const positionValues = submission.positions.map((p) => p.position);
  const uniquePositions = new Set(positionValues);
  if (uniquePositions.size !== positionValues.length) {
    throw new AppError(400, "INVALID_INPUT", "Duplicate positions are not allowed", {
      positions: "Each item must have a unique position",
    });
  }

  const itemMap = new Map(content.items.map((i) => [i.id, i]));
  const submittedPositionMap = new Map(submission.positions.map((p) => [p.itemId, p.position]));

  let score = 0;
  const feedback: ExerciseFeedbackItem[] = [];

  for (const item of content.items) {
    const userPosition = submittedPositionMap.get(item.id);
    const isCorrect = userPosition === item.correctPosition;
    if (isCorrect) score++;

    feedback.push({
      itemId: item.id,
      correct: isCorrect,
      explanation: isCorrect
        ? `"${item.label}" is in the correct position`
        : `"${item.label}" should be at position ${item.correctPosition}`,
      correctAnswer: isCorrect ? null : String(item.correctPosition),
    });
  }

  return { score, totalPoints: content.items.length, feedback };
}

/**
 * Validates an ST (Step-by-Step) exercise submission.
 */
function validateST(
  submission: { stepAnswers: Array<{ stepId: string; selectedOptionId: string }> },
  content: STExerciseContent,
): { score: number; totalPoints: number; feedback: ExerciseFeedbackItem[] } {
  // Require answers for all steps
  if (submission.stepAnswers.length < content.steps.length) {
    throw new AppError(400, "INVALID_INPUT", "Answers required for all steps", {
      stepAnswers: `Expected ${content.steps.length} step answers, got ${submission.stepAnswers.length}`,
    });
  }

  const answerMap = new Map(submission.stepAnswers.map((a) => [a.stepId, a.selectedOptionId]));

  let score = 0;
  const feedback: ExerciseFeedbackItem[] = [];

  for (const step of content.steps) {
    const selectedOptionId = answerMap.get(step.id);
    if (!selectedOptionId) {
      feedback.push({
        itemId: step.id,
        correct: false,
        explanation: step.microExplanation,
        correctAnswer: step.options.find((o) => o.isCorrect)?.text ?? null,
      });
      continue;
    }

    const selectedOption = step.options.find((o) => o.id === selectedOptionId);
    if (!selectedOption) {
      throw new AppError(400, "INVALID_INPUT", `Option '${selectedOptionId}' not found in step '${step.id}'`, {
        selectedOptionId: "Option ID not found in step",
      });
    }

    const isCorrect = selectedOption.isCorrect;
    if (isCorrect) score++;

    const correctOption = step.options.find((o) => o.isCorrect);

    feedback.push({
      itemId: step.id,
      correct: isCorrect,
      explanation: isCorrect ? selectedOption.explanation : step.microExplanation,
      correctAnswer: isCorrect ? null : (correctOption?.text ?? null),
    });
  }

  return { score, totalPoints: content.steps.length, feedback };
}

/**
 * Submit an exercise answer and receive validation feedback.
 * Records the attempt in the database.
 */
export async function submitExercise(
  userId: string,
  exerciseId: string,
  body: ExerciseSubmission,
  locale: string,
): Promise<ExerciseResult> {
  const content = getContent();
  const curriculum = content.curriculum;

  // 1. Find mission in curriculum structure
  const mission = findMission(curriculum, exerciseId);
  if (!mission) {
    throw new AppError(404, "EXERCISE_NOT_FOUND", `Exercise ${exerciseId} not found`);
  }

  // 2. Check mission access status (must not be locked)
  const accessStatus = await getMissionAccessStatus(userId, exerciseId);
  if (accessStatus === "locked") {
    throw new AppError(403, "MISSION_LOCKED", `Mission ${exerciseId} is locked`);
  }

  // 3. Debt check: block first attempt on new mission if balance < 0
  // NOTE: This check runs outside the transaction intentionally. A TOCTOU race
  // is possible (two concurrent "first attempts" could both pass), but this is
  // an accepted trade-off — at worst a user in debt submits one extra time.
  const priorAttemptCount = await prisma.exerciseAttempt.count({
    where: { userId, exerciseId },
  });
  if (priorAttemptCount === 0) {
    await checkTokenDebt(userId);
  }

  // 4. Load exercise content
  const missionContent = resolveMissionContent(exerciseId, locale);
  const exerciseContent = missionContent.exerciseContent;

  // 5. Check for placeholder content
  if ("placeholder" in exerciseContent && exerciseContent.placeholder === true) {
    throw new AppError(501, "EXERCISE_CONTENT_UNAVAILABLE", `Exercise content for ${exerciseId} is not yet available`);
  }

  // 6. Validate type matches
  if (body.type !== mission.exerciseType) {
    throw new AppError(400, "INVALID_INPUT", `Exercise ${exerciseId} is type ${mission.exerciseType}, not ${body.type}`, {
      type: `Expected ${mission.exerciseType}`,
    });
  }

  // 7. Dispatch to type-specific validator
  let result: { score: number; totalPoints: number; feedback: ExerciseFeedbackItem[] };

  switch (body.type) {
    case "SI":
      result = validateSI(body.submission, exerciseContent as SIExerciseContent);
      break;
    case "CM":
      result = validateCM(body.submission, exerciseContent as CMExerciseContent);
      break;
    case "IP":
      result = validateIP(body.submission, exerciseContent as IPExerciseContent);
      break;
    case "ST":
      result = validateST(body.submission, exerciseContent as STExerciseContent);
      break;
  }

  const correct = result.score === result.totalPoints;

  // 8. Record attempt + deduct gas fee in a single transaction
  await prisma.$transaction(async (tx) => {
    await tx.exerciseAttempt.create({
      data: {
        userId,
        exerciseId,
        answer: body as unknown as Record<string, unknown>,
        correct,
      },
    });
    await deductGasFeeWithClient(tx, userId, exerciseId);
  });

  // 9. Get updated balance for response
  const updatedUser = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tokenBalance: true },
  });

  return {
    correct,
    score: result.score,
    totalPoints: result.totalPoints,
    feedback: result.feedback,
    gasFee: GAS_FEE_PER_SUBMISSION,
    tokenBalance: updatedUser.tokenBalance,
  };
}

/**
 * Get the exercise status for a mission (completable if any correct attempt exists).
 */
export async function getMissionExerciseStatus(
  userId: string,
  missionId: string,
): Promise<MissionExerciseStatus> {
  const content = getContent();
  const mission = findMission(content.curriculum, missionId);
  if (!mission) {
    throw new AppError(404, "MISSION_NOT_FOUND", `Mission ${missionId} not found`);
  }

  const attempts = await prisma.exerciseAttempt.findMany({
    where: { userId, exerciseId: missionId },
    orderBy: { createdAt: "desc" },
  });

  const hasCorrectAttempt = attempts.some((a) => a.correct);
  const lastAttempt = attempts.length > 0 ? attempts[0] : null;

  return {
    missionId,
    completable: hasCorrectAttempt,
    attempts: attempts.length,
    lastAttemptCorrect: lastAttempt?.correct ?? null,
  };
}
