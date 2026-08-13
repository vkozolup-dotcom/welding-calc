import { DEFAULT_FACTORS, DEFAULT_INPUTS, createPipeSegment } from "./defaults";
import type { CalcInputs, Currency, Locale, PriceParams } from "./types";

/** Public profile embedded in /client#p=… share link */
export interface PublicClientProfile {
  v: 2;
  displayName: string;
  phone: string;
  email: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  hourPrice: number;
  profilePricePerMMild: number;
  profilePricePerMStainless: number;
  rodPackPrice: number;
  rodPackKg: number;
  gasRefillPrice: number;
  weldPricePerCm: number;
  laborMode: "hour" | "per_cm";
  vatPercent: number;
  invoiceEnabled: boolean;
  currency: Currency;
  locale: Locale;
}

export const DEFAULT_PUBLIC_PROFILE: PublicClientProfile = {
  v: 2,
  displayName: "",
  phone: "",
  email: "",
  whatsapp: "",
  facebook: "",
  instagram: "",
  hourPrice: 120,
  profilePricePerMMild: 18,
  profilePricePerMStainless: 48,
  rodPackPrice: 95,
  rodPackKg: 5,
  gasRefillPrice: 210,
  weldPricePerCm: 2,
  laborMode: "hour",
  vatPercent: 23,
  invoiceEnabled: true,
  currency: "PLN",
  locale: "pl",
};

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

export function sanitizePublicProfile(raw: unknown): PublicClientProfile {
  const base = DEFAULT_PUBLIC_PROFILE;
  if (!isObject(raw)) return { ...base };
  return {
    v: 2,
    displayName:
      typeof raw.displayName === "string" ? raw.displayName.slice(0, 80) : "",
    phone: typeof raw.phone === "string" ? raw.phone.slice(0, 40) : "",
    email: typeof raw.email === "string" ? raw.email.slice(0, 120) : "",
    whatsapp: typeof raw.whatsapp === "string" ? raw.whatsapp.slice(0, 80) : "",
    facebook: typeof raw.facebook === "string" ? raw.facebook.slice(0, 200) : "",
    instagram:
      typeof raw.instagram === "string" ? raw.instagram.slice(0, 200) : "",
    hourPrice: Math.max(0, asFiniteNumber(raw.hourPrice, base.hourPrice)),
    profilePricePerMMild: Math.max(
      0,
      asFiniteNumber(
        raw.profilePricePerMMild,
        asFiniteNumber(raw.profilePricePerM, base.profilePricePerMMild),
      ),
    ),
    profilePricePerMStainless: Math.max(
      0,
      asFiniteNumber(
        raw.profilePricePerMStainless,
        base.profilePricePerMStainless,
      ),
    ),
    rodPackPrice: Math.max(
      0,
      asFiniteNumber(raw.rodPackPrice, base.rodPackPrice),
    ),
    rodPackKg: Math.max(0.01, asFiniteNumber(raw.rodPackKg, base.rodPackKg)),
    gasRefillPrice: Math.max(
      0,
      asFiniteNumber(raw.gasRefillPrice, base.gasRefillPrice),
    ),
    weldPricePerCm: Math.max(
      0,
      asFiniteNumber(raw.weldPricePerCm, base.weldPricePerCm),
    ),
    laborMode: raw.laborMode === "per_cm" ? "per_cm" : "hour",
    vatPercent: Math.max(0, asFiniteNumber(raw.vatPercent, base.vatPercent)),
    invoiceEnabled: raw.invoiceEnabled !== false,
    currency: raw.currency === "USD" ? "USD" : "PLN",
    locale: raw.locale === "en" ? "en" : "pl",
  };
}

/** Build public profile rates from welder's current price book */
export function profileFromPrices(
  prices: PriceParams,
  contacts: Partial<PublicClientProfile>,
  locale: Locale,
  currency: Currency,
): PublicClientProfile {
  return sanitizePublicProfile({
    ...DEFAULT_PUBLIC_PROFILE,
    ...contacts,
    hourPrice: prices.laborHourPrice,
    profilePricePerMMild: prices.profilePricePerMMild,
    profilePricePerMStainless: prices.profilePricePerMStainless,
    rodPackPrice: prices.rodPackPrice,
    rodPackKg: prices.rodPackKg,
    gasRefillPrice: prices.gasRefillPrice,
    weldPricePerCm: prices.weldPricePerCm,
    laborMode: prices.laborMode,
    vatPercent: prices.vatPercent,
    invoiceEnabled: prices.invoiceEnabled,
    locale,
    currency,
  });
}

export function buildClientCalcInputs(
  profile: PublicClientProfile,
  partial: Partial<CalcInputs>,
  withMaterials: boolean,
): CalcInputs {
  const base = structuredClone(DEFAULT_INPUTS);
  // Keep laborMode (hour / per_cm) in both modes. "Without materials" zeros
  // purchase rates instead of switching to onsite (onsite always bills by hour).
  const prices: PriceParams = {
    ...base.prices,
    jobMode: "full",
    laborMode: profile.laborMode,
    laborHourPrice: profile.hourPrice,
    profilePricePerMMild: withMaterials ? profile.profilePricePerMMild : 0,
    profilePricePerMStainless: withMaterials
      ? profile.profilePricePerMStainless
      : 0,
    rodPackPrice: withMaterials ? profile.rodPackPrice : 0,
    rodPackKg: profile.rodPackKg,
    gasRefillPrice: withMaterials ? profile.gasRefillPrice : 0,
    weldPricePerCm: profile.weldPricePerCm,
    useManualHours: false,
    manualHours: 0,
    vatPercent: profile.vatPercent,
    invoiceEnabled: profile.invoiceEnabled,
    deliveryEnabled: false,
    deliveryPrice: 0,
    eurRate: base.prices.eurRate,
  };

  return {
    ...base,
    ...partial,
    locale: profile.locale,
    currency: profile.currency,
    prices,
    factors: { ...DEFAULT_FACTORS },
    tooling: {
      ...base.tooling,
      grindingDiscsQty: 0,
      cuttingDiscsQty: 0,
      abrasiveWheelsQty: 0,
      millsQty: 0,
    },
    pipe: partial.pipe ?? {
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
  };
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodePublicProfile(profile: PublicClientProfile): string {
  return toBase64Url(JSON.stringify(sanitizePublicProfile(profile)));
}

export function decodePublicProfile(
  encoded: string,
): PublicClientProfile | null {
  try {
    const json = fromBase64Url(encoded);
    const parsed = JSON.parse(json) as unknown;
    return sanitizePublicProfile(parsed);
  } catch {
    return null;
  }
}

export function readProfileFromLocation(
  hash: string,
  search: string,
): PublicClientProfile | null {
  const fromHash = hash.startsWith("#p=")
    ? hash.slice(3)
    : hash.startsWith("#") && hash.includes("p=")
      ? new URLSearchParams(hash.slice(1)).get("p")
      : null;
  if (fromHash) return decodePublicProfile(decodeURIComponent(fromHash));

  const q = new URLSearchParams(search).get("p");
  if (q) return decodePublicProfile(q);
  return null;
}

export function buildClientShareUrl(
  origin: string,
  profile: PublicClientProfile,
): string {
  const payload = encodePublicProfile(profile);
  return `${origin.replace(/\/$/, "")}/client#p=${payload}`;
}

export function telHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

export function mailHref(email: string): string | null {
  const e = email.trim();
  return e.includes("@") ? `mailto:${e}` : null;
}

export function whatsappHref(whatsapp: string): string | null {
  const w = whatsapp.trim();
  if (!w) return null;
  if (/^https?:\/\//i.test(w)) return w;
  const digits = w.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function socialHref(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("@")) return `https://instagram.com/${u.slice(1)}`;
  return `https://${u}`;
}
