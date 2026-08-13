import { createPipeSegment, DEFAULT_FACTORS, DEFAULT_INPUTS } from "./defaults";
import { JOBS_STORAGE_KEY, PRICE_BOOKS_KEY, SETTINGS_STORAGE_KEY } from "./constants";
import { isSafePhotoDataUrl } from "./security";
import type {
  AppTab,
  CalcInputs,
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
          profileId:
            typeof seg.profileId === "string"
              ? seg.profileId
              : "pipe-33.7x2.5",
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
          profileId:
            typeof raw.profileId === "string"
              ? raw.profileId
              : "pipe-33.7x2.5",
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
    prices: { ...base.prices, ...(isObject(raw.prices) ? raw.prices : {}) },
    factors: {
      ...DEFAULT_FACTORS,
      ...(isObject(raw.factors) ? raw.factors : {}),
    },
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
): void {
  try {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        inputs,
        tab,
        activeJobId,
      } satisfies PersistedSettings),
    );
  } catch {
    /* ignore quota */
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

export function saveJobs(jobs: SavedJob[]): void {
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    /* ignore */
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
      shop: isObject(parsed.shop)
        ? ({ ...DEFAULT_INPUTS.prices, ...parsed.shop } as PriceParams)
        : null,
      onsite: isObject(parsed.onsite)
        ? ({ ...DEFAULT_INPUTS.prices, ...parsed.onsite } as PriceParams)
        : null,
    };
  } catch {
    return { shop: null, onsite: null };
  }
}

export function savePriceBooks(store: PriceBookStore): void {
  try {
    localStorage.setItem(PRICE_BOOKS_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function normalizeTab(tab: unknown): AppTab {
  if (tab === "client" || tab === "jobs" || tab === "friend") return tab;
  return "friend";
}
