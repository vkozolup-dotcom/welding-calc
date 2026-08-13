export type Locale = "pl" | "en";
export type Currency = "PLN" | "USD";
export type AppTab = "friend" | "client" | "jobs";

export type PresetId = "pipe" | "door" | "gate" | "canopy" | "free";

export type GateType = "swing" | "sliding";
export type DoorFill = "sheet" | "bars" | "none";

/** Pipe system media */
export type PipeMedia = "water" | "hydraulic" | "air";

/** Weld geometry / process style */
export type WeldJointType = "butt" | "fillet" | "purge";

/** TIG filler rod diameter, mm */
export type RodDiameter = 1.6 | 2.0 | 2.4 | 3.2;

/** TIG shielding gas */
export type GasType = "argon" | "ar_he";

/** How labor is billed (workshop / full job) */
export type LaborMode = "hour" | "per_cm";

/**
 * full — own materials + equipment
 * onsite — at client site, client materials/equipment, bill hours only
 */
export type JobMode = "full" | "onsite";

/** Black / mild steel vs stainless */
export type MetalType = "mild" | "stainless";

export type ProfileKind = "box" | "pipe";

export type PriceBookId = "shop" | "onsite";

export interface ProfileOption {
  id: string;
  label: string;
  /** Weight for mild/black steel, kg/m */
  kgPerMeter: number;
  kind: ProfileKind;
  /** Outer diameter for round pipe, mm */
  odMm?: number;
}

export interface DoorParams {
  heightM: number;
  widthM: number;
  profileId: string;
  fill: DoorFill;
}

export interface GateParams {
  heightM: number;
  widthM: number;
  profileId: string;
  gateType: GateType;
  leaves: 1 | 2;
}

export interface CanopyParams {
  lengthM: number;
  widthM: number;
  heightM: number;
  crossStepM: number;
  profileId: string;
}

export interface FreeParams {
  weldLengthM: number;
  profileLengthM: number;
  profileId: string;
}

/** One pipe diameter / run in a job */
export interface PipeSegment {
  id: string;
  profileId: string;
  lengthM: number;
  buttJoints: number;
  elbows: number;
  tees: number;
  flanges: number;
}

/** Piping: water / hydraulic / air */
export interface PipeParams {
  media: PipeMedia;
  segments: PipeSegment[];
}

export interface WeldingParams {
  rodDiameter: RodDiameter;
  gasType: GasType;
  gasFlowLpm: number;
  weldJointType: WeldJointType;
}

/** Optional tooling consumables */
export interface ToolingParams {
  grindingDiscsQty: number;
  grindingDiscsUnitPrice: number;
  cuttingDiscsQty: number;
  cuttingDiscsUnitPrice: number;
  abrasiveWheelsQty: number;
  abrasiveWheelsUnitPrice: number;
  millsQty: number;
  millsUnitPrice: number;
}

export interface PriceParams {
  jobMode: JobMode;
  /** PLN/USD per metre — black / mild steel */
  profilePricePerMMild: number;
  /** PLN/USD per metre — stainless */
  profilePricePerMStainless: number;
  rodPackPrice: number;
  rodPackKg: number;
  gasRefillPrice: number;
  laborMode: LaborMode;
  /**
   * Shop (full) labor billing mode remembered while onsite forces hour.
   * Restored when returning to full / used for client share links.
   */
  shopLaborMode: LaborMode;
  laborHourPrice: number;
  weldPricePerCm: number;
  /** Manual hours (used in onsite mode, or when > 0 overrides estimate) */
  manualHours: number;
  useManualHours: boolean;
  /** VAT rate, e.g. 23 for Poland */
  vatPercent: number;
  /** Invoice (faktura) — when on, VAT is applied */
  invoiceEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryPrice: number;
  /** How many units of selected currency equal 1 EUR */
  eurRate: number;
}

/** Editable shop factors */
export interface FactorParams {
  cutWastePercent: number;
  rodLossPercent: number;
  prepWorkPercent: number;
  weldSpeedMPerMin: number;
  fabTimeFactor: number;
}

export interface CalcInputs {
  preset: PresetId;
  metalType: MetalType;
  door: DoorParams;
  gate: GateParams;
  canopy: CanopyParams;
  free: FreeParams;
  pipe: PipeParams;
  welding: WeldingParams;
  tooling: ToolingParams;
  prices: PriceParams;
  factors: FactorParams;
  locale: Locale;
  currency: Currency;
  /** Draft note while editing / before save */
  jobNote: string;
}

export interface MaterialResult {
  profileLengthRawM: number;
  profileLengthWithWasteM: number;
  weightKg: number;
  weldLengthM: number;
  weldLengthCm: number;
  depositedMetalKg: number;
  fillerKg: number;
  gasLiters: number;
  gasCylinderFraction: number;
  weldingTimeMin: number;
  laborHoursAuto: number;
  laborHoursBase: number;
  laborHoursPrep: number;
  laborHoursBilled: number;
  pipeJointCount: number;
}

export interface CostResult {
  metalCost: number;
  fillerCost: number;
  gasCost: number;
  laborCost: number;
  weldSeamCost: number;
  grindingDiscsCost: number;
  cuttingDiscsCost: number;
  abrasiveWheelsCost: number;
  millsCost: number;
  toolingCost: number;
  costTotal: number;
  deliveryCost: number;
  vatAmount: number;
  clientPrice: number;
  clientPriceEur: number;
}

export interface FullResult {
  materials: MaterialResult;
  costs: CostResult;
}

export interface SavedJob {
  id: string;
  name: string;
  updatedAt: number;
  inputs: CalcInputs;
  note: string;
  photoDataUrl: string | null;
  pinned: boolean;
}

export interface PriceBookStore {
  shop: PriceParams | null;
  onsite: PriceParams | null;
}
