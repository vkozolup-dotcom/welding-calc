import { createPipeSegment, DEFAULT_FACTORS, DEFAULT_INPUTS } from "./defaults";
import {
  JOBS_STORAGE_KEY,
  PRICE_BOOKS_KEY,
  PROFILES,
  PUBLIC_PROFILE_KEY,
  SETTINGS_STORAGE_KEY,
} from "./constants";
import {
  DEFAULT_PUBLIC_PROFILE,
  sanitizePublicProfile,
  type PublicClientProfile,
} from "./clientProfile";
import { isSafePhotoDataUrl } from "./security";
import type {
  AppTab,
  CalcInputs,
  FactorParams,
  PipeParams,
  PriceBookStore,
  PriceParams,
  SavedJob,
} from "./types";

export interface PersistedSettings {
  inputs: CalcInputs;
  tab: AppTab;
  activeJobId: string | null;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asFiniteNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function sanitizePrices(raw: Record<string, unknown> | PriceParams): PriceParams {
  const p = raw as Record<string, unknown>;
  const base = DEFAULT_INPUTS.prices;
  return {
    jobMode: p.jobMode === "onsite" ? "onsite" : "full",
    profilePricePerM: Math.max(0, asFiniteNumber(p.profilePricePerM, base.profilePricePerM)),
    rodPackPrice: Math.max(0, asFiniteNumber(p.rodPackPrice, base.rodPackPrice)),
    rodPackKg: Math.max(0, asFiniteNumber(p.rodPackKg, base.rodPackKg)),
    gasRefillPrice: Math.max(0, asFiniteNumber(p.gasRefillPrice, base.gasRefillPrice)),
    laborMode: p.laborMode === "hour" ? "hour" : "per_cm",
    laborHourPrice: Math.max(0, asFiniteNumber(p.laborHourPrice, base.laborHourPrice)),
    weldPricePerCm: Math.max(0, asFiniteNumber(p.weldPricePerCm, base.weldPricePerCm)),
    manualHours: Math.max(0, asFiniteNumber(p.manualHours, base.manualHours)),
    useManualHours: p.useManualHours === true,
    vatPercent: Math.max(0, asFiniteNumber(p.vatPercent, base.vatPercent)),
    invoiceEnabled: p.invoiceEnabled !== false,
    deliveryEnabled: p.deliveryEnabled === true,
    deliveryPrice: Math.max(0, asFiniteNumber(p.deliveryPrice, base.deliveryPrice)),
    eurRate: Math.max(0.01, asFiniteNumber(p.eurRate, base.eurRate)),
  };
}

function sanitizeFactors(
  raw: Record<string, unknown> | FactorParams,
): FactorParams {
  const f = raw as Record<string, unknown>;
  const base = DEFAULT_FACTORS;
  return {
    cutWastePercent: Math.max(0, asFiniteNumber(f.cutWastePercent, base.cutWastePercent)),
    rodLossPercent: Math.max(0, asFiniteNumber(f.rodLossPercent, base.rodLossPercent)),
    prepWorkPercent: Math.max(0, asFiniteNumber(f.prepWorkPercent, base.prepWorkPercent)),
    weldSpeedMPerMin: Math.max(
      0.01,
      asFiniteNumber(f.weldSpeedMPerMin, base.weldSpeedMPerMin),
    ),
    fabTimeFactor: Math.max(0.1, asFiniteNumber(f.fabTimeFactor, base.fabTimeFactor)),
  };
}

function knownPipeProfileId(id: unknown): string {
  if (typeof id === "string" && PROFILES.some((p) => p.id === id && p.kind === "pipe")) {
    return id;
  }
  return "pipe-33.7x2.5";
}

function migratePipe(raw: unknown): PipeParams {
  const base = structuredClone(DEFAULT_INPUTS.pipe);
  if (!isObject(raw)) return base;

  // New shape
  if (Array.isArray(raw.segments) && raw.segments.length > 0) {
    return {
      media:
        raw.media === "hydraulic" || raw.media === "air" || raw.media === "water"
          ? raw.media
          : base.media,
      segments: raw.segments.map((s) => {
        const seg = isObject(s) ? s : {};
        return createPipeSegment({
          id: typeof seg.id === "string" ? seg.id : undefined,
          profileId: knownPipeProfileId(seg.profileId),
          lengthM: asFiniteNumber(seg.lengthM, 6),
          buttJoints: asFiniteNumber(seg.buttJoints, 0),
          elbows: asFiniteNumber(seg.elbows, 0),
          tees: asFiniteNumber(seg.tees, 0),
          flanges: asFiniteNumber(seg.flanges, 0),
        });
      }),
    };
  }

  // Legacy single-diameter shape
  if (typeof raw.profileId === "string" || raw.lengthM != null) {
    return {
      media:
        raw.media === "hydraulic" || raw.media === "air" || raw.media === "water"
          ? raw.media
          : base.media,
      segments: [
        createPipeSegment({
          profileId: knownPipeProfileId(raw.profileId),
          lengthM: asFiniteNumber(raw.lengthM, 12),
          buttJoints: asFiniteNumber(raw.buttJoints, 0),
          elbows: asFiniteNumber(raw.elbows, 0),
          tees: asFiniteNumber(raw.tees, 0),
          flanges: asFiniteNumber(raw.flanges, 0),
        }),
      ],
    };
  }

  return {
    ...base,
    media:
      raw.media === "hydraulic" || raw.media === "air" || raw.media === "water"
        ? raw.media
        : base.media,
  };
}

/** Merge saved payload with defaults so new fields always exist */
export function mergeInputs(raw: unknown): CalcInputs {
  const base = structuredClone(DEFAULT_INPUTS);
  if (!isObject(raw)) return base;

  const next: CalcInputs = {
    ...base,
    ...raw,
    door: { ...base.door, ...(isObject(raw.door) ? raw.door : {}) },
    gate: { ...base.gate, ...(isObject(raw.gate) ? raw.gate : {}) },
    canopy: { ...base.canopy, ...(isObject(raw.canopy) ? raw.canopy : {}) },
    free: { ...base.free, ...(isObject(raw.free) ? raw.free : {}) },
    pipe: migratePipe(raw.pipe),
    welding: {
      ...base.welding,
      ...(isObject(raw.welding) ? raw.welding : {}),
    },
    tooling: { ...base.tooling, ...(isObject(raw.tooling) ? raw.tooling : {}) },
    prices: sanitizePrices({
      ...base.prices,
      ...(isObject(raw.prices) ? raw.prices : {}),
    }),
    factors: sanitizeFactors({
      ...DEFAULT_FACTORS,
      ...(isObject(raw.factors) ? raw.factors : {}),
    }),
    jobNote: typeof raw.jobNote === "string" ? raw.jobNote : "",
  } as CalcInputs;

  if (raw.locale === "en" || raw.locale === "pl") next.locale = raw.locale;
  if (raw.currency === "USD" || raw.currency === "PLN") {
    next.currency = raw.currency;
  }
  const presets = ["pipe", "door", "gate", "canopy", "free"] as const;
  if (
    typeof raw.preset === "string" &&
    (presets as readonly string[]).includes(raw.preset)
  ) {
    next.preset = raw.preset as CalcInputs["preset"];
  }
  if (raw.metalType === "mild" || raw.metalType === "stainless") {
    next.metalType = raw.metalType;
  }
  if (next.gate.leaves !== 1 && next.gate.leaves !== 2) {
    next.gate.leaves = 1;
  }
  const rods = [1.6, 2.0, 2.4, 3.2] as const;
  if (!(rods as readonly number[]).includes(next.welding.rodDiameter)) {
    next.welding.rodDiameter = 2.0;
  }
  if (
    next.welding.weldJointType !== "butt" &&
    next.welding.weldJointType !== "fillet" &&
    next.welding.weldJointType !== "purge"
  ) {
    next.welding.weldJointType = "butt";
  }

  return next;
}

export function loadSettings(): PersistedSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("welding-calc-settings");
      if (!legacy) return null;
      const old = JSON.parse(legacy) as Partial<CalcInputs> & { tab?: AppTab };
      // Older builds sometimes stored the whole calculator blob under this key
      return {
        inputs: mergeInputs(old),
        tab: normalizeTab(old.tab),
        activeJobId: null,
      };
    }
    const parsed = JSON.parse(raw) as {
      inputs?: unknown;
      tab?: AppTab;
      activeJobId?: string | null;
    };
    return {
      inputs: mergeInputs(parsed.inputs ?? parsed),
      tab: normalizeTab(parsed.tab),
      activeJobId:
        typeof parsed.activeJobId === "string" ? parsed.activeJobId : null,
    };
  } catch {
    return null;
  }
}

export function saveSettings(
  inputs: CalcInputs,
  tab: AppTab,
  activeJobId: string | null,
): boolean {
  try {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        inputs,
        tab,
        activeJobId,
      } satisfies PersistedSettings),
    );
    return true;
  } catch {
    return false;
  }
}

function normalizeJob(raw: unknown): SavedJob | null {
  if (!isObject(raw) || typeof raw.id !== "string") return null;
  return {
    id: raw.id,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name : "Job",
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
    inputs: mergeInputs(raw.inputs),
    note: typeof raw.note === "string" ? raw.note : "",
    photoDataUrl: isSafePhotoDataUrl(raw.photoDataUrl)
      ? raw.photoDataUrl
      : null,
    pinned: raw.pinned === true,
  };
}

export function loadJobs(): SavedJob[] {
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeJob)
      .filter((j): j is SavedJob => j !== null)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
  } catch {
    return [];
  }
}

export function saveJobs(jobs: SavedJob[]): boolean {
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    return true;
  } catch {
    return false;
  }
}

export function createJobId(): string {
  return `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function loadPriceBooks(): PriceBookStore {
  try {
    const raw = localStorage.getItem(PRICE_BOOKS_KEY);
    if (!raw) return { shop: null, onsite: null };
    const parsed = JSON.parse(raw) as Partial<PriceBookStore>;
    return {
      shop: isObject(parsed.shop) ? sanitizePrices(parsed.shop) : null,
      onsite: isObject(parsed.onsite) ? sanitizePrices(parsed.onsite) : null,
    };
  } catch {
    return { shop: null, onsite: null };
  }
}

export function savePriceBooks(store: PriceBookStore): boolean {
  try {
    localStorage.setItem(PRICE_BOOKS_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function loadPublicProfile(): PublicClientProfile {
  try {
    const raw = localStorage.getItem(PUBLIC_PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PUBLIC_PROFILE };
    return sanitizePublicProfile(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_PUBLIC_PROFILE };
  }
}

export function savePublicProfile(profile: PublicClientProfile): boolean {
  try {
    localStorage.setItem(
      PUBLIC_PROFILE_KEY,
      JSON.stringify(sanitizePublicProfile(profile)),
    );
    return true;
  } catch {
    return false;
  }
}

function normalizeTab(tab: unknown): AppTab {
  if (tab === "client" || tab === "jobs" || tab === "friend") return tab;
  return "friend";
}
