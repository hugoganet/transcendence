import * as fs from "fs";
import * as path from "path";

// ── ANSI colors ──────────────────────────────────────────────────────────────
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

// ── Types ────────────────────────────────────────────────────────────────────
interface Mission {
  id: string;
  order: number;
  name: string;
  description: string;
  exerciseType: string;
  estimatedMinutes: number;
  lastReviewedDate: string;
  progressiveReveal: unknown;
}

interface Chapter {
  id: string;
  order: number;
  name: string;
  description: string;
  disclaimerRequired: boolean;
  missions: Mission[];
}

interface Category {
  id: string;
  order: number;
  name: string;
  description: string;
  platformMechanic: string;
  chapters: Chapter[];
}

type MissionsLocale = Record<string, unknown>;
type TooltipsLocale = Record<string, { term: string; definition: string }>;
type TooltipTriggersLocale = Record<string, string[]>;
type UiLocale = Record<string, unknown>;

// ── Helpers ──────────────────────────────────────────────────────────────────
const CONTENT_DIR = path.resolve(__dirname, "..", "content");

function loadJson<T>(relativePath: string): T {
  const fullPath = path.join(CONTENT_DIR, relativePath);
  const raw = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(raw) as T;
}

let totalChecks = 0;
let passedChecks = 0;
let failed = false;

function pass(label: string, detail?: string): void {
  totalChecks++;
  passedChecks++;
  const extra = detail ? ` ${DIM}(${detail})${RESET}` : "";
  console.log(`  ${GREEN}PASS${RESET}  ${label}${extra}`);
}

function fail(label: string, details: string[]): void {
  totalChecks++;
  failed = true;
  console.log(`  ${RED}FAIL${RESET}  ${label}`);
  for (const d of details) {
    console.log(`        ${RED}- ${d}${RESET}`);
  }
}

function setDiff(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((x) => !b.has(x));
}

// ── Load data ────────────────────────────────────────────────────────────────
const structure = loadJson<Category[]>("structure.json");
const enMissions = loadJson<MissionsLocale>("en/missions.json");
const frMissions = loadJson<MissionsLocale>("fr/missions.json");
const enTooltips = loadJson<TooltipsLocale>("en/tooltips.json");
const frTooltips = loadJson<TooltipsLocale>("fr/tooltips.json");
const enTriggers = loadJson<TooltipTriggersLocale>("en/tooltip-triggers.json");
const frTriggers = loadJson<TooltipTriggersLocale>("fr/tooltip-triggers.json");
const enUi = loadJson<UiLocale>("en/ui.json");
const frUi = loadJson<UiLocale>("fr/ui.json");

// ── Extract IDs from structure ───────────────────────────────────────────────
const categories = structure;
const chapters: Chapter[] = categories.flatMap((c) => c.chapters);
const missions: Mission[] = chapters.flatMap((ch) => ch.missions);
const structureMissionIds = new Set(missions.map((m) => m.id));

// ── Checks ───────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}Content Validation${RESET}\n`);

// 1. Structure completeness
const EXPECTED_CATEGORIES = 6;
const EXPECTED_CHAPTERS = 18;
const EXPECTED_MISSIONS = 69;

const catCount = categories.length;
const chapCount = chapters.length;
const misCount = missions.length;

const completenessErrors: string[] = [];
if (catCount !== EXPECTED_CATEGORIES)
  completenessErrors.push(
    `Expected ${EXPECTED_CATEGORIES} categories, found ${catCount}`
  );
if (chapCount !== EXPECTED_CHAPTERS)
  completenessErrors.push(
    `Expected ${EXPECTED_CHAPTERS} chapters, found ${chapCount}`
  );
if (misCount !== EXPECTED_MISSIONS)
  completenessErrors.push(
    `Expected ${EXPECTED_MISSIONS} missions, found ${misCount}`
  );

if (completenessErrors.length === 0) {
  pass(
    "Structure completeness",
    `${catCount} categories, ${chapCount} chapters, ${misCount} missions`
  );
} else {
  fail("Structure completeness", completenessErrors);
}

// 2. Mission ID parity — every structure ID exists in both locale files
const enMissionIds = new Set(Object.keys(enMissions));
const frMissionIds = new Set(Object.keys(frMissions));

const missingInEn = setDiff(structureMissionIds, enMissionIds);
const missingInFr = setDiff(structureMissionIds, frMissionIds);

if (missingInEn.length === 0 && missingInFr.length === 0) {
  pass("Mission ID parity", `all ${structureMissionIds.size} IDs present in EN and FR`);
} else {
  const errors: string[] = [];
  if (missingInEn.length > 0)
    errors.push(`Missing in EN: ${missingInEn.join(", ")}`);
  if (missingInFr.length > 0)
    errors.push(`Missing in FR: ${missingInFr.join(", ")}`);
  fail("Mission ID parity", errors);
}

// 3. No orphan missions — no IDs in locale files that aren't in structure
const orphansEn = setDiff(enMissionIds, structureMissionIds);
const orphansFr = setDiff(frMissionIds, structureMissionIds);

if (orphansEn.length === 0 && orphansFr.length === 0) {
  pass("No orphan missions");
} else {
  const errors: string[] = [];
  if (orphansEn.length > 0)
    errors.push(`Orphans in EN: ${orphansEn.join(", ")}`);
  if (orphansFr.length > 0)
    errors.push(`Orphans in FR: ${orphansFr.join(", ")}`);
  fail("No orphan missions", errors);
}

// 4. EN/FR key parity for missions.json
const enOnlyMissions = setDiff(enMissionIds, frMissionIds);
const frOnlyMissions = setDiff(frMissionIds, enMissionIds);

if (enOnlyMissions.length === 0 && frOnlyMissions.length === 0) {
  pass("EN/FR mission key parity", `${enMissionIds.size} keys match`);
} else {
  const errors: string[] = [];
  if (enOnlyMissions.length > 0)
    errors.push(`EN-only keys: ${enOnlyMissions.join(", ")}`);
  if (frOnlyMissions.length > 0)
    errors.push(`FR-only keys: ${frOnlyMissions.join(", ")}`);
  fail("EN/FR mission key parity", errors);
}

// 5. Tooltip term parity
const enTooltipTerms = new Set(Object.keys(enTooltips));
const frTooltipTerms = new Set(Object.keys(frTooltips));

const enOnlyTooltips = setDiff(enTooltipTerms, frTooltipTerms);
const frOnlyTooltips = setDiff(frTooltipTerms, enTooltipTerms);

if (enOnlyTooltips.length === 0 && frOnlyTooltips.length === 0) {
  pass("Tooltip term parity", `${enTooltipTerms.size} terms match`);
} else {
  const errors: string[] = [];
  if (enOnlyTooltips.length > 0)
    errors.push(`EN-only terms: ${enOnlyTooltips.join(", ")}`);
  if (frOnlyTooltips.length > 0)
    errors.push(`FR-only terms: ${frOnlyTooltips.join(", ")}`);
  fail("Tooltip term parity", errors);
}

// 6. Tooltip trigger validity — every referenced term exists in the locale's tooltips
function checkTriggerTerms(
  triggers: TooltipTriggersLocale,
  tooltips: TooltipsLocale,
  locale: string
): string[] {
  const tooltipKeys = new Set(Object.keys(tooltips));
  const errors: string[] = [];
  for (const [missionId, terms] of Object.entries(triggers)) {
    for (const term of terms) {
      if (!tooltipKeys.has(term)) {
        errors.push(`[${locale}] Mission ${missionId} references unknown term "${term}"`);
      }
    }
  }
  return errors;
}

const triggerTermErrorsEn = checkTriggerTerms(enTriggers, enTooltips, "EN");
const triggerTermErrorsFr = checkTriggerTerms(frTriggers, frTooltips, "FR");
const allTriggerTermErrors = [...triggerTermErrorsEn, ...triggerTermErrorsFr];

if (allTriggerTermErrors.length === 0) {
  const totalRefs =
    Object.values(enTriggers).flat().length +
    Object.values(frTriggers).flat().length;
  pass("Tooltip trigger validity", `${totalRefs} term references valid`);
} else {
  fail("Tooltip trigger validity", allTriggerTermErrors);
}

// 7. Tooltip trigger mission validity — every missionId in triggers exists in structure
const enTriggerMissionIds = new Set(Object.keys(enTriggers));
const frTriggerMissionIds = new Set(Object.keys(frTriggers));

const invalidEnTriggerMissions = setDiff(enTriggerMissionIds, structureMissionIds);
const invalidFrTriggerMissions = setDiff(frTriggerMissionIds, structureMissionIds);

if (
  invalidEnTriggerMissions.length === 0 &&
  invalidFrTriggerMissions.length === 0
) {
  pass(
    "Tooltip trigger mission validity",
    `${enTriggerMissionIds.size} EN + ${frTriggerMissionIds.size} FR mission IDs valid`
  );
} else {
  const errors: string[] = [];
  if (invalidEnTriggerMissions.length > 0)
    errors.push(
      `EN triggers reference unknown missions: ${invalidEnTriggerMissions.join(", ")}`
    );
  if (invalidFrTriggerMissions.length > 0)
    errors.push(
      `FR triggers reference unknown missions: ${invalidFrTriggerMissions.join(", ")}`
    );
  fail("Tooltip trigger mission validity", errors);
}

// 8. UI copy parity — same top-level keys
const enUiKeys = new Set(Object.keys(enUi));
const frUiKeys = new Set(Object.keys(frUi));

const enOnlyUi = setDiff(enUiKeys, frUiKeys);
const frOnlyUi = setDiff(frUiKeys, enUiKeys);

if (enOnlyUi.length === 0 && frOnlyUi.length === 0) {
  pass("UI copy parity", `${enUiKeys.size} top-level keys match`);
} else {
  const errors: string[] = [];
  if (enOnlyUi.length > 0)
    errors.push(`EN-only keys: ${enOnlyUi.join(", ")}`);
  if (frOnlyUi.length > 0)
    errors.push(`FR-only keys: ${frOnlyUi.join(", ")}`);
  fail("UI copy parity", errors);
}

// 9. Exercise type check — valid types: SI, CM, IP, ST
const VALID_EXERCISE_TYPES = new Set(["SI", "CM", "IP", "ST"]);

const invalidExerciseTypes: string[] = [];
for (const mission of missions) {
  if (!VALID_EXERCISE_TYPES.has(mission.exerciseType)) {
    invalidExerciseTypes.push(
      `Mission ${mission.id} has invalid exerciseType "${mission.exerciseType}"`
    );
  }
}

if (invalidExerciseTypes.length === 0) {
  pass("Exercise type check", `all ${missions.length} missions have valid types`);
} else {
  fail("Exercise type check", invalidExerciseTypes);
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(
  `\n${BOLD}${passedChecks === totalChecks ? GREEN : RED}${passedChecks}/${totalChecks} checks passed${RESET}\n`
);

process.exit(failed ? 1 : 0);
