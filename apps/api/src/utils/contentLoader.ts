import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  curriculumStructureSchema,
  tooltipCollectionSchema,
  exerciseContentSchema,
  type CurriculumStructure,
  type MissionContentCollection,
  type TooltipCollection,
  type UIStrings,
} from "@transcendence/shared";
import { z } from "zod";

// Placeholder-only exercise content (e.g., French translations before Epic 8 i18n work)
const placeholderOnlySchema = z.object({ placeholder: z.literal(true) });

const missionContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  learningObjective: z.string().min(1),
  exerciseContent: z.union([exerciseContentSchema, placeholderOnlySchema]),
});

const missionContentCollectionSchema = z.record(z.string(), missionContentSchema);

const uiStringsSchema = z.object({
  categories: z.record(z.string(), z.string()),
  chapters: z.record(z.string(), z.string()),
  exerciseTypes: z.record(z.string(), z.string()),
  labels: z.record(z.string(), z.string()),
});

interface ContentCache {
  curriculum: CurriculumStructure;
  missions: Map<string, MissionContentCollection>;
  tooltips: Map<string, TooltipCollection>;
  uiStrings: Map<string, UIStrings>;
}

let cache: ContentCache | null = null;

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = resolve(__dirname, "../../../../content");

function readJsonFile(filePath: string): unknown {
  const absolutePath = resolve(CONTENT_ROOT, filePath);
  try {
    const raw = readFileSync(absolutePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read content file "${filePath}" (resolved: ${absolutePath}): ${message}`);
  }
}

function validateWithContext<T>(
  schema: z.ZodType<T>,
  data: unknown,
  file: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Content validation failed for ${file}:\n${issues}`,
    );
  }
  return result.data;
}

export function loadCurriculum(): CurriculumStructure {
  const data = readJsonFile("structure.json");
  return validateWithContext(curriculumStructureSchema, data, "structure.json");
}

export function loadMissions(locale: string): MissionContentCollection {
  const file = `${locale}/missions.json`;
  const data = readJsonFile(file);
  return validateWithContext<MissionContentCollection>(missionContentCollectionSchema, data, file);
}

export function loadTooltips(locale: string): TooltipCollection {
  const file = `${locale}/tooltips.json`;
  const data = readJsonFile(file);
  return validateWithContext(tooltipCollectionSchema, data, file);
}

export function loadUIStrings(locale: string): UIStrings {
  const file = `${locale}/ui.json`;
  const data = readJsonFile(file);
  return validateWithContext(uiStringsSchema, data, file);
}

export function initializeContent(locales: string[]): void {
  const curriculum = loadCurriculum();
  const missions = new Map<string, MissionContentCollection>();
  const tooltips = new Map<string, TooltipCollection>();
  const uiStrings = new Map<string, UIStrings>();

  for (const locale of locales) {
    missions.set(locale, loadMissions(locale));
    tooltips.set(locale, loadTooltips(locale));
    uiStrings.set(locale, loadUIStrings(locale));
  }

  cache = { curriculum, missions, tooltips, uiStrings };
  console.log(
    `Content loaded: ${locales.length} locale(s), ${curriculum.reduce((sum, cat) => sum + cat.chapters.reduce((s, ch) => s + ch.missions.length, 0), 0)} missions`,
  );
}

export function getContent(): ContentCache {
  if (!cache) {
    throw new Error("Content not initialized. Call initializeContent() first.");
  }
  return cache;
}

export function getStaleContent(months: number): Array<{ id: string; name: string; lastReviewedDate: string }> {
  const content = getContent();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const stale: Array<{ id: string; name: string; lastReviewedDate: string }> = [];
  for (const category of content.curriculum) {
    for (const chapter of category.chapters) {
      for (const mission of chapter.missions) {
        if (mission.lastReviewedDate < cutoffStr) {
          stale.push({
            id: mission.id,
            name: mission.name,
            lastReviewedDate: mission.lastReviewedDate,
          });
        }
      }
    }
  }
  return stale;
}
