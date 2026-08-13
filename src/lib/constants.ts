import type {
  PresetId,
  ProfileOption,
  RodDiameter,
  WeldJointType,
} from "./types";

/** Square / rectangular tube (box) and round pipe — kg/m for black steel */
export const PROFILES: ProfileOption[] = [
  // Box
  { id: "20x20x1.5", label: "20×20×1.5", kgPerMeter: 0.83, kind: "box" },
  { id: "25x25x1.5", label: "25×25×1.5", kgPerMeter: 1.07, kind: "box" },
  { id: "30x30x2", label: "30×30×2", kgPerMeter: 1.7, kind: "box" },
  { id: "40x20x1.5", label: "40×20×1.5", kgPerMeter: 1.35, kind: "box" },
  { id: "40x40x2", label: "40×40×2", kgPerMeter: 2.31, kind: "box" },
  { id: "50x50x2", label: "50×50×2", kgPerMeter: 2.96, kind: "box" },
  { id: "60x40x2", label: "60×40×2", kgPerMeter: 2.96, kind: "box" },
  { id: "60x60x3", label: "60×60×3", kgPerMeter: 5.19, kind: "box" },
  { id: "80x40x3", label: "80×40×3", kgPerMeter: 5.29, kind: "box" },
  { id: "80x80x3", label: "80×80×3", kgPerMeter: 7.07, kind: "box" },
  { id: "100x100x3", label: "100×100×3", kgPerMeter: 9.03, kind: "box" },
  // Round pipe / tube
  // Pipe kg/m: π(D − t)tρ/10⁶, ρ = 7850 (mild steel)
  { id: "pipe-21.3x2", label: "Ø21.3×2", kgPerMeter: 0.95, kind: "pipe", odMm: 21.3 },
  { id: "pipe-26.9x2", label: "Ø26.9×2", kgPerMeter: 1.23, kind: "pipe", odMm: 26.9 },
  { id: "pipe-33.7x2.5", label: "Ø33.7×2.5", kgPerMeter: 1.92, kind: "pipe", odMm: 33.7 },
  { id: "pipe-42.4x2.5", label: "Ø42.4×2.5", kgPerMeter: 2.46, kind: "pipe", odMm: 42.4 },
  { id: "pipe-48.3x3", label: "Ø48.3×3", kgPerMeter: 3.35, kind: "pipe", odMm: 48.3 },
  { id: "pipe-60.3x3", label: "Ø60.3×3", kgPerMeter: 4.24, kind: "pipe", odMm: 60.3 },
  { id: "pipe-76.1x3", label: "Ø76.1×3", kgPerMeter: 5.41, kind: "pipe", odMm: 76.1 },
  { id: "pipe-88.9x3.2", label: "Ø88.9×3.2", kgPerMeter: 6.76, kind: "pipe", odMm: 88.9 },
  { id: "pipe-114.3x3.6", label: "Ø114.3×3.6", kgPerMeter: 9.83, kind: "pipe", odMm: 114.3 },
];

/** Default cut waste fraction */
export const CUT_WASTE = 0.05;

/** Default rod leftovers / scraps (~8%) */
export const ROD_LOSS = 0.08;

/** Mild steel density, kg/m³ */
export const MILD_STEEL_DENSITY = 7850;

/** Stainless density, kg/m³ */
export const STAINLESS_DENSITY = 8000;

/** Cylinder 50 L × 200 bar → usable atm liters */
export const CYLINDER_VOLUME_L = 50;
export const CYLINDER_PRESSURE_BAR = 200;
export const CYLINDER_USABLE_LITERS =
  CYLINDER_VOLUME_L * CYLINDER_PRESSURE_BAR; // 10 000 L

/** Typical TIG weld speed, m/min */
export const WELD_SPEED_M_PER_MIN = 0.18;

/** Fab/assembly factor vs pure weld time */
export const FAB_TIME_FACTOR = 2.8;

/** Prep work +% on billed hours */
export const PREP_WORK_PERCENT = 35;

/** Fillet leg (mm) by filler rod diameter */
export const FILLET_BY_ROD: Record<RodDiameter, number> = {
  1.6: 2.5,
  2.0: 3.0,
  2.4: 3.5,
  3.2: 4.5,
};

/**
 * Multipliers by weld style:
 * - butt: baseline
 * - fillet: less deposit, a bit faster
 * - purge: more gas (backing), slower careful welding
 */
export const WELD_TYPE_FACTORS: Record<
  WeldJointType,
  { rod: number; gas: number; speed: number }
> = {
  butt: { rod: 1, gas: 1, speed: 1 },
  fillet: { rod: 0.85, gas: 0.9, speed: 1.12 },
  purge: { rod: 1.05, gas: 1.45, speed: 0.82 },
};

export const PRESET_IDS: PresetId[] = [
  "pipe",
  "door",
  "gate",
  "canopy",
  "free",
];

export const SETTINGS_STORAGE_KEY = "welding-calc-v2";
export const JOBS_STORAGE_KEY = "welding-calc-jobs-v1";
export const PRICE_BOOKS_KEY = "welding-calc-pricebooks-v1";
export const PUBLIC_PROFILE_KEY = "welding-calc-public-v1";
