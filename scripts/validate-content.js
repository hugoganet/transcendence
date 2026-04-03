#!/usr/bin/env node

/**
 * Content Validation Script
 * Checks consistency across all locales (en, fr, es) and structure.json
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const LOCALES = ['en', 'fr', 'es'];
const LOCALES_DIR = path.join(__dirname, '..', 'apps', 'web', 'public', 'locales');

let totalChecks = 0;
let passed = 0;
let failed = 0;
let warnings = 0;

function loadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function report(checkName, pass, details) {
  totalChecks++;
  if (pass) {
    passed++;
    console.log(`  PASS  ${checkName}`);
  } else {
    failed++;
    console.log(`  FAIL  ${checkName}`);
    if (details) console.log(`        ${details}`);
  }
}

function warn(checkName, details) {
  warnings++;
  console.log(`  WARN  ${checkName}`);
  if (details) console.log(`        ${details}`);
}

function getKeysRecursive(obj, prefix = '') {
  const keys = [];
  for (const key of Object.keys(obj).sort()) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getKeysRecursive(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function diffArrays(a, b) {
  const setB = new Set(b);
  const setA = new Set(a);
  return {
    onlyInA: a.filter(x => !setB.has(x)),
    onlyInB: b.filter(x => !setA.has(x)),
  };
}

// Extract mission IDs from structure.json (recursive)
function extractStructureMissionIds(structure) {
  const ids = [];
  for (const category of structure) {
    if (category.chapters) {
      for (const chapter of category.chapters) {
        if (chapter.missions) {
          for (const mission of chapter.missions) {
            ids.push(mission.id);
          }
        }
      }
    }
  }
  return ids.sort();
}

console.log('\n=== Content Validation ===\n');

// --- Check 1: Mission IDs consistency across locales ---
console.log('[1] Mission IDs across locales');
const missionsByLocale = {};
for (const locale of LOCALES) {
  const data = loadJSON(path.join(CONTENT_DIR, locale, 'missions.json'));
  if (!data) {
    report(`Load ${locale}/missions.json`, false, 'File not found or invalid JSON');
    continue;
  }
  missionsByLocale[locale] = Object.keys(data).sort();
}

if (missionsByLocale.en && missionsByLocale.fr) {
  const diff = diffArrays(missionsByLocale.en, missionsByLocale.fr);
  const match = diff.onlyInA.length === 0 && diff.onlyInB.length === 0;
  report('en vs fr mission IDs match', match,
    match ? null : `Only in en: [${diff.onlyInA.join(', ')}] | Only in fr: [${diff.onlyInB.join(', ')}]`);
}
if (missionsByLocale.en && missionsByLocale.es) {
  const diff = diffArrays(missionsByLocale.en, missionsByLocale.es);
  const match = diff.onlyInA.length === 0 && diff.onlyInB.length === 0;
  report('en vs es mission IDs match', match,
    match ? null : `Only in en: [${diff.onlyInA.join(', ')}] | Only in es: [${diff.onlyInB.join(', ')}]`);
}

// --- Check 2: Tooltip count across locales ---
console.log('\n[2] Tooltip count across locales');
const tooltipsByLocale = {};
for (const locale of LOCALES) {
  const data = loadJSON(path.join(CONTENT_DIR, locale, 'tooltips.json'));
  if (!data) {
    report(`Load ${locale}/tooltips.json`, false, 'File not found or invalid JSON');
    continue;
  }
  tooltipsByLocale[locale] = Object.keys(data).sort();
}

if (tooltipsByLocale.en && tooltipsByLocale.fr) {
  const diff = diffArrays(tooltipsByLocale.en, tooltipsByLocale.fr);
  const match = diff.onlyInA.length === 0 && diff.onlyInB.length === 0;
  report(`en (${tooltipsByLocale.en.length}) vs fr (${tooltipsByLocale.fr.length}) tooltip count match`, match,
    match ? null : `Only in en: [${diff.onlyInA.join(', ')}] | Only in fr: [${diff.onlyInB.join(', ')}]`);
}
if (tooltipsByLocale.en && tooltipsByLocale.es) {
  const diff = diffArrays(tooltipsByLocale.en, tooltipsByLocale.es);
  const match = diff.onlyInA.length === 0 && diff.onlyInB.length === 0;
  report(`en (${tooltipsByLocale.en.length}) vs es (${tooltipsByLocale.es.length}) tooltip count match`, match,
    match ? null : `Only in en: [${diff.onlyInA.join(', ')}] | Only in es: [${diff.onlyInB.join(', ')}]`);
}

// --- Check 3: UI key structure across locales ---
console.log('\n[3] UI key structure across locales');
const uiKeysByLocale = {};
for (const locale of LOCALES) {
  const data = loadJSON(path.join(CONTENT_DIR, locale, 'ui.json'));
  if (!data) {
    report(`Load ${locale}/ui.json`, false, 'File not found or invalid JSON');
    continue;
  }
  uiKeysByLocale[locale] = getKeysRecursive(data);
}

if (uiKeysByLocale.en && uiKeysByLocale.fr) {
  const diff = diffArrays(uiKeysByLocale.en, uiKeysByLocale.fr);
  const match = diff.onlyInA.length === 0 && diff.onlyInB.length === 0;
  let details = null;
  if (!match) {
    const parts = [];
    if (diff.onlyInA.length) parts.push(`Only in en (${diff.onlyInA.length}): ${diff.onlyInA.slice(0, 10).join(', ')}${diff.onlyInA.length > 10 ? '...' : ''}`);
    if (diff.onlyInB.length) parts.push(`Only in fr (${diff.onlyInB.length}): ${diff.onlyInB.slice(0, 10).join(', ')}${diff.onlyInB.length > 10 ? '...' : ''}`);
    details = parts.join(' | ');
  }
  report('en vs fr UI key structure match', match, details);
}
if (uiKeysByLocale.en && uiKeysByLocale.es) {
  const diff = diffArrays(uiKeysByLocale.en, uiKeysByLocale.es);
  const match = diff.onlyInA.length === 0 && diff.onlyInB.length === 0;
  let details = null;
  if (!match) {
    const parts = [];
    if (diff.onlyInA.length) parts.push(`Only in en (${diff.onlyInA.length}): ${diff.onlyInA.slice(0, 10).join(', ')}${diff.onlyInA.length > 10 ? '...' : ''}`);
    if (diff.onlyInB.length) parts.push(`Only in es (${diff.onlyInB.length}): ${diff.onlyInB.slice(0, 10).join(', ')}${diff.onlyInB.length > 10 ? '...' : ''}`);
    details = parts.join(' | ');
  }
  report('en vs es UI key structure match', match, details);
}

// --- Check 4: Translation.json across locales ---
console.log('\n[4] Translation.json key structure across locales');
const translationKeysByLocale = {};
let translationsExist = false;
for (const locale of LOCALES) {
  const filePath = path.join(LOCALES_DIR, locale, 'translation.json');
  const data = loadJSON(filePath);
  if (data) {
    translationsExist = true;
    translationKeysByLocale[locale] = getKeysRecursive(data);
  }
}

if (!translationsExist) {
  report('translation.json files exist', false,
    `No translation.json files found in apps/web/public/locales/{locale}/. Directory may not exist yet.`);
} else {
  if (translationKeysByLocale.en && translationKeysByLocale.fr) {
    const diff = diffArrays(translationKeysByLocale.en, translationKeysByLocale.fr);
    const match = diff.onlyInA.length === 0 && diff.onlyInB.length === 0;
    report('en vs fr translation.json keys match', match,
      match ? null : `Only in en: ${diff.onlyInA.length} keys | Only in fr: ${diff.onlyInB.length} keys`);
  }
  if (translationKeysByLocale.en && translationKeysByLocale.es) {
    const diff = diffArrays(translationKeysByLocale.en, translationKeysByLocale.es);
    const match = diff.onlyInA.length === 0 && diff.onlyInB.length === 0;
    report('en vs es translation.json keys match', match,
      match ? null : `Only in en: ${diff.onlyInA.length} keys | Only in es: ${diff.onlyInB.length} keys`);
  }
}

// --- Check 5: Placeholder exerciseContent ---
console.log('\n[5] Placeholder exerciseContent check');
for (const locale of LOCALES) {
  const data = loadJSON(path.join(CONTENT_DIR, locale, 'missions.json'));
  if (!data) continue;
  const placeholders = [];
  for (const [id, mission] of Object.entries(data)) {
    if (mission.exerciseContent &&
        typeof mission.exerciseContent === 'object' &&
        mission.exerciseContent.placeholder === true) {
      placeholders.push(id);
    }
  }
  if (placeholders.length > 0) {
    warn(`${locale}/missions.json has ${placeholders.length} placeholder exercises`,
      `IDs: ${placeholders.join(', ')}`);
  } else {
    report(`${locale}/missions.json has no placeholder exercises`, true);
  }
}

// --- Check 6: structure.json mission IDs match en/missions.json ---
console.log('\n[6] structure.json mission IDs vs en/missions.json');
const structure = loadJSON(path.join(CONTENT_DIR, 'structure.json'));
if (!structure) {
  report('Load structure.json', false, 'File not found or invalid JSON');
} else if (!missionsByLocale.en) {
  report('Compare structure.json to en/missions.json', false, 'en/missions.json not loaded');
} else {
  const structureIds = extractStructureMissionIds(structure);
  const enIds = missionsByLocale.en;
  const diff = diffArrays(structureIds, enIds);
  const match = diff.onlyInA.length === 0 && diff.onlyInB.length === 0;
  let details = null;
  if (!match) {
    const parts = [];
    if (diff.onlyInA.length) parts.push(`In structure.json but not missions.json (${diff.onlyInA.length}): ${diff.onlyInA.slice(0, 15).join(', ')}${diff.onlyInA.length > 15 ? '...' : ''}`);
    if (diff.onlyInB.length) parts.push(`In missions.json but not structure.json (${diff.onlyInB.length}): ${diff.onlyInB.slice(0, 15).join(', ')}${diff.onlyInB.length > 15 ? '...' : ''}`);
    details = parts.join(' | ');
  }
  report(`structure.json (${structureIds.length} missions) vs en/missions.json (${enIds.length} missions)`, match, details);
}

// --- Check 7: tooltip-triggers.json terms exist in tooltips.json ---
console.log('\n[7] Tooltip triggers reference valid tooltip terms');
for (const locale of LOCALES) {
  const triggers = loadJSON(path.join(CONTENT_DIR, locale, 'tooltip-triggers.json'));
  const tooltips = loadJSON(path.join(CONTENT_DIR, locale, 'tooltips.json'));
  if (!triggers || !tooltips) {
    report(`Load ${locale}/tooltip-triggers.json & tooltips.json`, false, 'File(s) not found');
    continue;
  }
  const tooltipTerms = new Set(Object.keys(tooltips));
  const missing = [];
  for (const [missionId, terms] of Object.entries(triggers)) {
    for (const term of terms) {
      if (!tooltipTerms.has(term)) {
        missing.push(`${missionId} -> "${term}"`);
      }
    }
  }
  const pass = missing.length === 0;
  report(`${locale}: all trigger terms exist in tooltips.json`, pass,
    pass ? null : `Missing (${missing.length}): ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);
}

// --- Summary ---
console.log('\n=== Summary ===');
console.log(`  Total checks: ${totalChecks}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  Result: ${failed === 0 ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'}\n`);

process.exit(failed > 0 ? 1 : 0);
