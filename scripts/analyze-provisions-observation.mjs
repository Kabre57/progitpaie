#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/analyze-provisions-observation.mjs <fichier-ou-dossier-logs>");
  process.exit(2);
}

function listFiles(path) {
  const absolutePath = resolve(path);
  const stats = statSync(absolutePath);
  if (stats.isFile()) return [absolutePath];
  if (!stats.isDirectory()) return [];
  return readdirSync(absolutePath, { withFileTypes: true })
    .flatMap((entry) => listFiles(resolve(absolutePath, entry.name)));
}

const durations = [];
let v2Calls = 0;
let legacyCalls = 0;
let serverErrors = 0;
let criticalErrors = 0;

for (const file of listFiles(target)) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (line.includes("[DEPRECATED_API] GET /api/payroll/provisions")) legacyCalls += 1;
    if (/PROVISION_CALCULATION_ERROR|ZodError|INVALID_RESPONSE|TENANT_MISMATCH/i.test(line)) {
      criticalErrors += 1;
    }
    const markerIndex = line.indexOf("[PROVISIONS_V2_REQUEST]");
    if (markerIndex < 0) continue;
    const jsonStart = line.indexOf("{", markerIndex);
    if (jsonStart < 0) continue;
    try {
      const event = JSON.parse(line.slice(jsonStart));
      v2Calls += 1;
      if (Number.isFinite(event.durationMs)) durations.push(Number(event.durationMs));
      if (Number(event.status) >= 500) serverErrors += 1;
    } catch {
      criticalErrors += 1;
    }
  }
}

durations.sort((left, right) => left - right);
const percentileIndex = durations.length === 0 ? -1 : Math.ceil(durations.length * 0.95) - 1;
const p95Ms = percentileIndex < 0 ? null : durations[percentileIndex];

console.log(JSON.stringify({
  filesAnalyzed: listFiles(target).length,
  v2Calls,
  legacyCalls,
  serverErrors,
  criticalErrors,
  p95Ms,
}, null, 2));

if (legacyCalls > 0 || serverErrors > 0 || criticalErrors > 0) process.exit(1);
