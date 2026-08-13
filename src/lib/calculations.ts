import {
  CYLINDER_USABLE_LITERS,
  FILLET_BY_ROD,
  MILD_STEEL_DENSITY,
  PROFILES,
  STAINLESS_DENSITY,
  WELD_TYPE_FACTORS,
} from "./constants";
import type {
  CalcInputs,
  CanopyParams,
  CostResult,
  DoorParams,
  FreeParams,
  FullResult,
  GateParams,
  MaterialResult,
  MetalType,
  PipeParams,
  PipeSegment,
  RodDiameter,
} from "./types";

function profileKgPerM(profileId: string, metalType: MetalType): number {
  const base = PROFILES.find((p) => p.id === profileId)?.kgPerMeter ?? 2.31;
  if (metalType === "stainless") {
    return base * (STAINLESS_DENSITY / MILD_STEEL_DENSITY);
  }
  return base;
}

function steelDensity(metalType: MetalType): number {
  return metalType === "stainless" ? STAINLESS_DENSITY : MILD_STEEL_DENSITY;
}

export function profileOdMm(profileId: string): number {
  return PROFILES.find((p) => p.id === profileId)?.odMm ?? 0;
}

export function segmentJointCount(seg: PipeSegment): number {
  return (
    Math.max(0, seg.buttJoints) +
    Math.max(0, seg.elbows) * 2 +
    Math.max(0, seg.tees) * 3 +
    Math.max(0, seg.flanges)
  );
}

/** Circumferential joints across all pipe segments */
export function pipeJointCount(params: PipeParams): number {
  return (params.segments ?? []).reduce(
    (sum, seg) => sum + segmentJointCount(seg),
    0,
  );
}

export function calcPipe(
  params: PipeParams,
  metalType: MetalType,
  cutWaste: number,
): {
  profileM: number;
  weldM: number;
  jointCount: number;
  weightKg: number;
} {
  let profileM = 0;
  let weldM = 0;
  let jointCount = 0;
  let weightKg = 0;

  for (const seg of params.segments ?? []) {
    const len = Math.max(0, seg.lengthM);
    const odM = profileOdMm(seg.profileId) / 1000;
    const joints = segmentJointCount(seg);
    profileM += len;
    jointCount += joints;
    if (odM > 0) weldM += joints * Math.PI * odM;
    weightKg += len * (1 + cutWaste) * profileKgPerM(seg.profileId, metalType);
  }

  return { profileM, weldM, jointCount, weightKg };
}

export function calcDoor(params: DoorParams): {
  profileM: number;
  weldM: number;
} {
  const { heightM: h, widthM: w, fill } = params;
  const outer = 2 * (h + w);
  const midRails = w;
  const uprights = h > 1.6 ? h : 0;
  let profileM = outer + midRails + uprights;

  let weldM = 8 * 0.08 + 4 * 0.06;
  weldM += midRails > 0 ? 0.24 : 0;
  weldM += uprights > 0 ? 0.24 : 0;

  if (fill === "sheet") {
    weldM += 2 * (h + w) * 0.15;
  } else if (fill === "bars") {
    const barCount = Math.max(3, Math.floor(w / 0.12));
    profileM += barCount * h;
    weldM += barCount * 0.12;
  }

  return { profileM, weldM };
}

export function calcGate(params: GateParams): {
  profileM: number;
  weldM: number;
} {
  const { heightM: h, widthM: w, gateType, leaves } = params;

  if (gateType === "swing") {
    const leafCount = leaves === 2 ? 2 : 1;
    const leafW = w / leafCount;
    const perLeafOuter = 2 * (h + leafW);
    const brace = Math.hypot(h, leafW);
    const mid = leafW;
    const profileM = leafCount * (perLeafOuter + brace + mid);
    const weldM = leafCount * (0.9 + 0.3) + leafCount * 0.2;
    return { profileM, weldM };
  }

  const outer = 2 * (h + w);
  const diagonals = 2 * Math.hypot(h, w / 2);
  const mids = 2 * w;
  const guide = w * 1.5;
  const profileM = outer + diagonals + mids + guide;
  const weldM = 1.8 + 0.6 + 0.4;
  return { profileM, weldM };
}

export function calcCanopy(params: CanopyParams): {
  profileM: number;
  weldM: number;
} {
  const { lengthM: L, widthM: W, heightM: H, crossStepM } = params;
  const step = Math.max(0.4, crossStepM);
  const posts = 4 * H;
  const perimeter = 2 * (L + W);
  const crossCount = Math.max(1, Math.floor(L / step) + 1);
  const crosses = crossCount * W;
  const longs = 2 * L;
  const profileM = posts + perimeter + crosses + longs;

  const joints = 4 + crossCount * 2 + 8;
  const weldM = joints * 0.12;
  return { profileM, weldM };
}

export function calcFree(params: FreeParams): {
  profileM: number;
  weldM: number;
} {
  return {
    profileM: Math.max(0, params.profileLengthM),
    weldM: Math.max(0, params.weldLengthM),
  };
}

export function depositedMetalKg(
  weldLengthM: number,
  rodDiameter: RodDiameter,
  metalType: MetalType,
): number {
  const aMm = FILLET_BY_ROD[rodDiameter] ?? FILLET_BY_ROD[2.0];
  const aM = aMm / 1000;
  // Equal-leg fillet cross-section ≈ a² / 2
  const areaM2 = (aM * aM) / 2;
  return weldLengthM * areaM2 * steelDensity(metalType);
}

export function calcMaterials(inputs: CalcInputs): MaterialResult {
  let profileM = 0;
  let weldM = 0;
  let profileId = inputs.door.profileId;
  let pipeJoints = 0;
  let weightOverride: number | null = null;

  const {
    cutWastePercent,
    rodLossPercent,
    prepWorkPercent,
    weldSpeedMPerMin,
    fabTimeFactor,
  } = inputs.factors;

  const cutWaste = Math.max(0, cutWastePercent) / 100;
  const rodLoss = Math.max(0, rodLossPercent) / 100;
  const prepPct = Math.max(0, prepWorkPercent) / 100;
  const speedBase = weldSpeedMPerMin > 0 ? weldSpeedMPerMin : 0.18;
  const fab = fabTimeFactor > 0 ? fabTimeFactor : 1;
  const typeFactor =
    WELD_TYPE_FACTORS[inputs.welding.weldJointType] ?? WELD_TYPE_FACTORS.butt;
  const speed = speedBase * typeFactor.speed;

  switch (inputs.preset) {
    case "pipe": {
      const r = calcPipe(inputs.pipe, inputs.metalType, cutWaste);
      profileM = r.profileM;
      weldM = r.weldM;
      pipeJoints = r.jointCount;
      weightOverride = r.weightKg;
      profileId = inputs.pipe.segments[0]?.profileId ?? profileId;
      break;
    }
    case "door": {
      const r = calcDoor(inputs.door);
      profileM = r.profileM;
      weldM = r.weldM;
      profileId = inputs.door.profileId;
      break;
    }
    case "gate": {
      const r = calcGate(inputs.gate);
      profileM = r.profileM;
      weldM = r.weldM;
      profileId = inputs.gate.profileId;
      break;
    }
    case "canopy": {
      const r = calcCanopy(inputs.canopy);
      profileM = r.profileM;
      weldM = r.weldM;
      profileId = inputs.canopy.profileId;
      break;
    }
    case "free": {
      const r = calcFree(inputs.free);
      profileM = r.profileM;
      weldM = r.weldM;
      profileId = inputs.free.profileId;
      break;
    }
  }

  const profileWithWaste = profileM * (1 + cutWaste);
  const kgPerM = profileKgPerM(profileId, inputs.metalType);
  const weightKg =
    weightOverride ?? profileWithWaste * kgPerM;

  const deposited =
    depositedMetalKg(weldM, inputs.welding.rodDiameter, inputs.metalType) *
    typeFactor.rod;
  const fillerKg = deposited * (1 + rodLoss);

  const weldingTimeMin = weldM > 0 ? weldM / speed : 0;
  const gasLiters =
    weldingTimeMin * inputs.welding.gasFlowLpm * typeFactor.gas;
  const gasCylinderFraction = gasLiters / CYLINDER_USABLE_LITERS;
  const laborHoursAuto = (weldingTimeMin / 60) * fab;

  const onsite = inputs.prices.jobMode === "onsite";
  const laborHoursBase =
    onsite || inputs.prices.useManualHours
      ? Math.max(0, inputs.prices.manualHours)
      : laborHoursAuto;
  const laborHoursPrep = laborHoursBase * prepPct;
  const laborHoursBilled = laborHoursBase + laborHoursPrep;

  return {
    profileLengthRawM: profileM,
    profileLengthWithWasteM: profileWithWaste,
    weightKg,
    weldLengthM: weldM,
    weldLengthCm: weldM * 100,
    depositedMetalKg: deposited,
    fillerKg,
    gasLiters,
    gasCylinderFraction,
    weldingTimeMin,
    laborHoursAuto,
    laborHoursBase,
    laborHoursPrep,
    laborHoursBilled,
    pipeJointCount: pipeJoints,
  };
}

export function calcCosts(
  inputs: CalcInputs,
  materials: MaterialResult,
): CostResult {
  const { prices, tooling } = inputs;
  const onsite = prices.jobMode === "onsite";

  const metalCost = onsite
    ? 0
    : materials.profileLengthWithWasteM * prices.profilePricePerM;
  const fillerUnit =
    prices.rodPackKg > 0 ? prices.rodPackPrice / prices.rodPackKg : 0;
  const fillerCost = onsite ? 0 : materials.fillerKg * fillerUnit;
  const gasCost = onsite
    ? 0
    : materials.gasCylinderFraction * prices.gasRefillPrice;

  let laborCost = 0;
  let weldSeamCost = 0;
  if (onsite || prices.laborMode === "hour") {
    laborCost = materials.laborHoursBilled * prices.laborHourPrice;
  } else {
    weldSeamCost = materials.weldLengthCm * prices.weldPricePerCm;
  }

  const grindingDiscsCost = onsite
    ? 0
    : Math.max(0, tooling.grindingDiscsQty) *
      Math.max(0, tooling.grindingDiscsUnitPrice);
  const cuttingDiscsCost = onsite
    ? 0
    : Math.max(0, tooling.cuttingDiscsQty) *
      Math.max(0, tooling.cuttingDiscsUnitPrice);
  const abrasiveWheelsCost = onsite
    ? 0
    : Math.max(0, tooling.abrasiveWheelsQty) *
      Math.max(0, tooling.abrasiveWheelsUnitPrice);
  const millsCost = onsite
    ? 0
    : Math.max(0, tooling.millsQty) * Math.max(0, tooling.millsUnitPrice);
  const toolingCost =
    grindingDiscsCost + cuttingDiscsCost + abrasiveWheelsCost + millsCost;

  const costTotal =
    metalCost + fillerCost + gasCost + laborCost + weldSeamCost + toolingCost;
  const deliveryCost = prices.deliveryEnabled
    ? Math.max(0, Number(prices.deliveryPrice) || 0)
    : 0;
  const netBeforeVat = costTotal + deliveryCost;
  const vatAmount = prices.invoiceEnabled
    ? netBeforeVat * (Math.max(0, Number(prices.vatPercent) || 0) / 100)
    : 0;
  const clientPrice = netBeforeVat + vatAmount;
  const rate = prices.eurRate > 0 ? prices.eurRate : 1;
  const clientPriceEur = clientPrice / rate;

  return {
    metalCost,
    fillerCost,
    gasCost,
    laborCost,
    weldSeamCost,
    grindingDiscsCost,
    cuttingDiscsCost,
    abrasiveWheelsCost,
    millsCost,
    toolingCost,
    costTotal,
    deliveryCost,
    vatAmount,
    clientPrice,
    clientPriceEur,
  };
}

export function calculateAll(inputs: CalcInputs): FullResult {
  const materials = calcMaterials(inputs);
  const costs = calcCosts(inputs, materials);
  return { materials, costs };
}
