/**
 * Smoke checks for welding calc engine (run with: npx tsx scripts/smoke-check.ts)
 */
import { calculateAll, calcPipe, pipeJointCount } from "../src/lib/calculations";
import {
  buildClientCalcInputs,
  DEFAULT_PUBLIC_PROFILE,
} from "../src/lib/clientProfile";
import { DEFAULT_INPUTS, createPipeSegment } from "../src/lib/defaults";
import { PIPE_TEMPLATES } from "../src/lib/pipeTemplates";
import { calcTodayStats, sortJobs } from "../src/lib/jobsUtils";
import { mergeInputs, sanitizePrices } from "../src/lib/storage";
import type { SavedJob } from "../src/lib/types";

let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

// 1) Default calc finishes with finite numbers
{
  const r = calculateAll(DEFAULT_INPUTS);
  assert(Number.isFinite(r.costs.clientPrice), "default clientPrice finite");
  assert(r.materials.weldLengthM > 0, "default weld length > 0");
  assert(r.materials.pipeJointCount > 0, "default pipe joints > 0");
}

// 2) Multi-diameter: joints and length sum
{
  const pipe = {
    media: "water" as const,
    segments: [
      createPipeSegment({
        profileId: "pipe-33.7x2.5",
        lengthM: 10,
        buttJoints: 2,
        elbows: 1,
        tees: 0,
        flanges: 0,
      }),
      createPipeSegment({
        profileId: "pipe-48.3x3",
        lengthM: 5,
        buttJoints: 1,
        elbows: 0,
        tees: 1,
        flanges: 0,
      }),
    ],
  };
  // joints: (2+2) + (1+3) = 8
  assert(pipeJointCount(pipe) === 8, "multi-seg joint count = 8");
  const c = calcPipe(pipe, "mild", 0.05);
  assert(Math.abs(c.profileM - 15) < 1e-9, "multi-seg length = 15 m");
  assert(c.weldM > 0 && c.weightKg > 0, "multi-seg weld/weight > 0");
}

// 3) Prep 35% on hours
{
  const inputs = structuredClone(DEFAULT_INPUTS);
  inputs.prices.laborMode = "hour";
  inputs.prices.useManualHours = true;
  inputs.prices.manualHours = 10;
  inputs.factors.prepWorkPercent = 35;
  const r = calculateAll(inputs);
  assert(Math.abs(r.materials.laborHoursBase - 10) < 1e-9, "base hours = 10");
  assert(Math.abs(r.materials.laborHoursPrep - 3.5) < 1e-9, "prep = 3.5");
  assert(Math.abs(r.materials.laborHoursBilled - 13.5) < 1e-9, "billed = 13.5");
}

// 4) Purge uses more gas than butt
{
  const butt = structuredClone(DEFAULT_INPUTS);
  butt.welding.weldJointType = "butt";
  const purge = structuredClone(DEFAULT_INPUTS);
  purge.welding.weldJointType = "purge";
  const a = calculateAll(butt);
  const b = calculateAll(purge);
  assert(b.materials.gasLiters > a.materials.gasLiters, "purge gas > butt gas");
}

// 5) Templates apply
{
  for (const tpl of PIPE_TEMPLATES) {
    const inputs = structuredClone(DEFAULT_INPUTS);
    inputs.preset = "pipe";
    inputs.pipe = structuredClone(tpl.pipe);
    const r = calculateAll(inputs);
    assert(
      Number.isFinite(r.costs.clientPrice) && r.materials.profileLengthRawM > 0,
      `template ${tpl.id} calculates`,
    );
  }
}

// 6) Legacy pipe merge
{
  const merged = mergeInputs({
    preset: "pipe",
    pipe: {
      media: "hydraulic",
      profileId: "pipe-21.3x2",
      lengthM: 7,
      buttJoints: 3,
      elbows: 1,
      tees: 0,
      flanges: 0,
    },
  });
  assert(merged.pipe.segments.length === 1, "legacy pipe -> 1 segment");
  assert(merged.pipe.media === "hydraulic", "legacy media kept");
  assert(merged.pipe.segments[0].lengthM === 7, "legacy length kept");
}

// 7) Pin sort + today stats
{
  const now = Date.now();
  const jobs: SavedJob[] = [
    {
      id: "a",
      name: "old",
      updatedAt: now - 86400000 * 2,
      inputs: DEFAULT_INPUTS,
      note: "",
      photoDataUrl: null,
      pinned: false,
    },
    {
      id: "b",
      name: "today",
      updatedAt: now,
      inputs: DEFAULT_INPUTS,
      note: "",
      photoDataUrl: null,
      pinned: false,
    },
    {
      id: "c",
      name: "pinned",
      updatedAt: now - 1000,
      inputs: DEFAULT_INPUTS,
      note: "",
      photoDataUrl: null,
      pinned: true,
    },
  ];
  const sorted = sortJobs(jobs);
  assert(sorted[0].id === "c", "pinned first");
  const today = calcTodayStats(jobs);
  assert(today.jobs === 2, "today jobs = 2 (b+c)");
}

// 8) Mild vs stainless metal rate
{
  const mild = structuredClone(DEFAULT_INPUTS);
  mild.metalType = "mild";
  mild.prices.profilePricePerMMild = 10;
  mild.prices.profilePricePerMStainless = 50;
  mild.prices.laborMode = "per_cm";
  const stainless = structuredClone(mild);
  stainless.metalType = "stainless";
  const a = calculateAll(mild);
  const b = calculateAll(stainless);
  assert(b.costs.metalCost > a.costs.metalCost, "stainless metal cost > mild");
  assert(
    Math.abs(a.costs.metalCost - a.materials.profileLengthWithWasteM * 10) < 1e-6,
    "mild uses mild rate",
  );
  assert(
    Math.abs(b.costs.metalCost - b.materials.profileLengthWithWasteM * 50) < 1e-6,
    "stainless uses stainless rate",
  );
}

// 9) Onsite zeros materials; per_cm shop bills seam
{
  const onsite = structuredClone(DEFAULT_INPUTS);
  onsite.prices.jobMode = "onsite";
  onsite.prices.laborMode = "hour";
  onsite.prices.useManualHours = true;
  onsite.prices.manualHours = 2;
  onsite.prices.laborHourPrice = 100;
  onsite.factors.prepWorkPercent = 0;
  const r = calculateAll(onsite);
  assert(r.costs.metalCost === 0, "onsite metal = 0");
  assert(r.costs.fillerCost === 0, "onsite filler = 0");
  assert(r.costs.gasCost === 0, "onsite gas = 0");
  assert(Math.abs(r.costs.laborCost - 200) < 1e-9, "onsite labor = 200");

  const cm = structuredClone(DEFAULT_INPUTS);
  cm.prices.jobMode = "full";
  cm.prices.laborMode = "per_cm";
  cm.prices.weldPricePerCm = 3;
  cm.prices.profilePricePerMMild = 0;
  cm.prices.rodPackPrice = 0;
  cm.prices.gasRefillPrice = 0;
  const c = calculateAll(cm);
  assert(
    Math.abs(c.costs.weldSeamCost - c.materials.weldLengthCm * 3) < 1e-6,
    "per_cm seam cost",
  );
  assert(c.costs.laborCost === 0, "per_cm laborCost = 0");
}

// 10) sanitizePrices: legacy profilePricePerM + rodPackKg clamp + shopLaborMode
{
  const s = sanitizePrices({
    profilePricePerM: 22,
    rodPackKg: 0,
    jobMode: "onsite",
    laborMode: "hour",
  } as never);
  assert(s.profilePricePerMMild === 22, "legacy price -> mild");
  assert(s.profilePricePerMStainless === 48, "stainless default kept");
  assert(s.rodPackKg >= 0.01, "rodPackKg clamped > 0");
  assert(s.shopLaborMode === "per_cm", "onsite keeps shopLaborMode default");
}

// 11) Client inputs keep per_cm when without materials
{
  const profile = {
    ...DEFAULT_PUBLIC_PROFILE,
    laborMode: "per_cm" as const,
    weldPricePerCm: 2.5,
    hourPrice: 90,
  };
  const inputs = buildClientCalcInputs(profile, {}, false);
  assert(inputs.prices.jobMode === "full", "client labor-only stays full");
  assert(inputs.prices.laborMode === "per_cm", "client keeps per_cm");
  assert(inputs.prices.profilePricePerMMild === 0, "client zeros mild");
  assert(inputs.prices.profilePricePerMStainless === 0, "client zeros stainless");
  const r = calculateAll(inputs);
  assert(r.costs.weldSeamCost > 0, "client per_cm still bills seam");
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll smoke checks passed");
