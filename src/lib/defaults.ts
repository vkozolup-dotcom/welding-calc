import type { CalcInputs, FactorParams, PipeSegment } from "./types";
import {
  CUT_WASTE,
  FAB_TIME_FACTOR,
  PREP_WORK_PERCENT,
  ROD_LOSS,
  WELD_SPEED_M_PER_MIN,
} from "./constants";

export const DEFAULT_FACTORS: FactorParams = {
  cutWastePercent: CUT_WASTE * 100,
  rodLossPercent: ROD_LOSS * 100,
  prepWorkPercent: PREP_WORK_PERCENT,
  weldSpeedMPerMin: WELD_SPEED_M_PER_MIN,
  fabTimeFactor: FAB_TIME_FACTOR,
};

export function createPipeSegment(
  partial?: Partial<PipeSegment>,
): PipeSegment {
  return {
    id: `seg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    profileId: "pipe-33.7x2.5",
    lengthM: 6,
    buttJoints: 4,
    elbows: 2,
    tees: 0,
    flanges: 0,
    ...partial,
  };
}

/** Defaults in PLN (typical Polish prices) */
export const DEFAULT_INPUTS: CalcInputs = {
  preset: "pipe",
  locale: "pl",
  currency: "PLN",
  metalType: "mild",
  jobNote: "",
  door: {
    heightM: 2.0,
    widthM: 0.9,
    profileId: "40x40x2",
    fill: "sheet",
  },
  gate: {
    heightM: 2.0,
    widthM: 3.5,
    profileId: "60x40x2",
    gateType: "swing",
    leaves: 2,
  },
  canopy: {
    lengthM: 6,
    widthM: 3,
    heightM: 2.5,
    crossStepM: 1,
    profileId: "60x40x2",
  },
  free: {
    weldLengthM: 5,
    profileLengthM: 20,
    profileId: "40x40x2",
  },
  pipe: {
    media: "water",
    segments: [
      createPipeSegment({
        profileId: "pipe-33.7x2.5",
        lengthM: 12,
        buttJoints: 8,
        elbows: 4,
        tees: 1,
        flanges: 2,
      }),
    ],
  },
  welding: {
    rodDiameter: 2.0,
    gasType: "argon",
    gasFlowLpm: 10,
    weldJointType: "butt",
  },
  tooling: {
    grindingDiscsQty: 0,
    grindingDiscsUnitPrice: 12,
    cuttingDiscsQty: 0,
    cuttingDiscsUnitPrice: 10,
    abrasiveWheelsQty: 0,
    abrasiveWheelsUnitPrice: 25,
    millsQty: 0,
    millsUnitPrice: 45,
  },
  prices: {
    jobMode: "full",
    profilePricePerM: 12,
    rodPackPrice: 95,
    rodPackKg: 5,
    gasRefillPrice: 160,
    laborMode: "per_cm",
    laborHourPrice: 100,
    weldPricePerCm: 2,
    manualHours: 4,
    useManualHours: false,
    vatPercent: 23,
    invoiceEnabled: true,
    deliveryEnabled: false,
    deliveryPrice: 0,
    eurRate: 4.3,
  },
  factors: { ...DEFAULT_FACTORS },
};
