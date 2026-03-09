import { getContent } from "../utils/contentLoader.js";
import { AppError } from "../utils/AppError.js";
import type { TooltipCollection, TooltipResponse, GlossaryResponse } from "@transcendence/shared";

function getTooltipsForLocale(locale: string): TooltipCollection {
  const content = getContent();
  const tooltips = content.tooltips.get(locale) ?? content.tooltips.get("en");
  if (!tooltips) {
    throw new AppError(500, "CONTENT_UNAVAILABLE", "Tooltip content not available");
  }
  return tooltips;
}

export function getTooltip(term: string, locale: string): TooltipResponse {
  const tooltips = getTooltipsForLocale(locale);
  const tooltip = tooltips[term];
  if (!tooltip) {
    throw new AppError(404, "TERM_NOT_FOUND", `Term "${term}" not found`);
  }

  return {
    term: tooltip.term,
    definition: tooltip.definition,
    analogy: tooltip.analogy,
    relatedTerms: tooltip.relatedTerms,
  };
}

export function getGlossary(locale: string): GlossaryResponse {
  const tooltips = getTooltipsForLocale(locale);

  const terms: TooltipResponse[] = Object.values(tooltips)
    .map((t) => ({
      term: t.term,
      definition: t.definition,
      analogy: t.analogy,
      relatedTerms: t.relatedTerms,
    }))
    .sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base" }));

  return { terms };
}
