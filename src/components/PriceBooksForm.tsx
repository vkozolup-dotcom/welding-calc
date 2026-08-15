"use client";

import { useId, useState } from "react";
import { Bookmark, Cog, X } from "lucide-react";
import { NumberField, Segmented } from "@/components/FormFields";
import { SectionCard } from "@/components/SectionCard";
import { DEFAULT_INPUTS } from "@/lib/defaults";
import { currencySymbol, t } from "@/lib/i18n";
import { loadPriceBooks, sanitizePrices, savePriceBooks } from "@/lib/storage";
import type {
  Currency,
  LaborMode,
  Locale,
  PriceBookId,
  PriceBookStore,
  PriceParams,
} from "@/lib/types";

interface PriceBooksFormProps {
  locale: Locale;
  currency: Currency;
  value: PriceParams;
  onApply: (prices: PriceParams) => void;
}

export function PriceBooksForm({
  locale,
  currency,
  value,
  onApply,
}: PriceBooksFormProps) {
  const [books, setBooks] = useState<PriceBookStore>(() => loadPriceBooks());
  const [editId, setEditId] = useState<PriceBookId | null>(null);
  const [draftHour, setDraftHour] = useState(0);
  const [draftCm, setDraftCm] = useState(0);
  const [draftLaborMode, setDraftLaborMode] = useState<LaborMode>("per_cm");
  const titleId = useId();
  const sym = currencySymbol(currency);

  function shopLaborFallback(): LaborMode {
    if (value.jobMode === "onsite") return value.shopLaborMode;
    return value.laborMode;
  }

  function bookBase(id: PriceBookId): PriceParams {
    const saved = books[id];
    if (saved) return sanitizePrices(structuredClone(saved));
    return sanitizePrices({
      ...structuredClone(DEFAULT_INPUTS.prices),
      ...structuredClone(value),
      jobMode: id === "onsite" ? "onsite" : "full",
      laborMode: id === "onsite" ? "hour" : shopLaborFallback(),
      shopLaborMode: shopLaborFallback(),
      useManualHours: id === "onsite",
    });
  }

  function openEdit(id: PriceBookId) {
    const base = bookBase(id);
    setDraftHour(base.laborHourPrice);
    setDraftCm(base.weldPricePerCm);
    setDraftLaborMode(
      id === "onsite" ? "hour" : base.shopLaborMode || base.laborMode,
    );
    setEditId(id);
  }

  function saveRates() {
    if (!editId) return;
    const prev = bookBase(editId);
    const laborMode =
      editId === "onsite" ? "hour" : draftLaborMode;
    const snapshot = sanitizePrices({
      ...prev,
      // Keep materials in sync with live Ceny when saving shop rates
      profilePricePerMMild: value.profilePricePerMMild,
      profilePricePerMStainless: value.profilePricePerMStainless,
      rodPackPrice: value.rodPackPrice,
      rodPackKg: value.rodPackKg,
      gasRefillPrice: value.gasRefillPrice,
      vatPercent: value.vatPercent,
      invoiceEnabled: value.invoiceEnabled,
      deliveryEnabled: value.deliveryEnabled,
      deliveryPrice: value.deliveryPrice,
      eurRate: value.eurRate,
      laborHourPrice: draftHour,
      weldPricePerCm: draftCm,
      jobMode: editId === "onsite" ? "onsite" : "full",
      laborMode,
      shopLaborMode: editId === "onsite" ? value.shopLaborMode : laborMode,
      useManualHours: editId === "onsite",
    });
    const next = { ...books, [editId]: snapshot };
    setBooks(next);
    savePriceBooks(next);

    const activeMatches =
      (editId === "onsite" && value.jobMode === "onsite") ||
      (editId === "shop" && value.jobMode !== "onsite");
    if (activeMatches) {
      onApply({
        ...value,
        laborHourPrice: draftHour,
        weldPricePerCm: draftCm,
        laborMode,
        shopLaborMode:
          editId === "onsite" ? value.shopLaborMode : laborMode,
      });
    }
    setEditId(null);
  }

  /** Apply only mode + labor rates — never wipe live material prices */
  function applyBook(id: PriceBookId) {
    const base = bookBase(id);
    const laborMode =
      id === "onsite" ? "hour" : base.shopLaborMode || base.laborMode;
    const prices = sanitizePrices({
      ...value,
      laborHourPrice: base.laborHourPrice,
      weldPricePerCm: base.weldPricePerCm,
      jobMode: id === "onsite" ? "onsite" : "full",
      laborMode,
      shopLaborMode:
        id === "onsite"
          ? value.shopLaborMode || base.shopLaborMode
          : laborMode,
      useManualHours: id === "onsite",
      manualHours: id === "onsite" ? value.manualHours : value.manualHours,
    });
    if (!books[id]) {
      const seeded = sanitizePrices({
        ...base,
        laborHourPrice: prices.laborHourPrice,
        weldPricePerCm: prices.weldPricePerCm,
        laborMode,
        shopLaborMode: prices.shopLaborMode,
      });
      const next = { ...books, [id]: seeded };
      setBooks(next);
      savePriceBooks(next);
    }
    onApply(prices);
  }

  const activeId: PriceBookId =
    value.jobMode === "onsite" ? "onsite" : "shop";

  return (
    <>
      <SectionCard
        title={t(locale, "priceBooksTitle")}
        subtitle={t(locale, "priceBooksSubtitle")}
        icon={<Bookmark className="h-5 w-5" />}
        collapsible
        defaultOpen
      >
        <div className="grid grid-cols-2 gap-3">
          {(["shop", "onsite"] as const).map((id) => {
            const saved = books[id];
            const active = activeId === id;
            const hour = saved?.laborHourPrice ?? value.laborHourPrice;
            const cm = saved?.weldPricePerCm ?? value.weldPricePerCm;
            const ratesLabel = saved
              ? id === "onsite"
                ? `${hour} ${sym}/h`
                : `${hour} ${sym}/h · ${cm} ${sym}${t(locale, "perCm")}`
              : t(locale, "priceBookEmpty");
            return (
              <div
                key={id}
                className={`rounded-xl border p-2.5 ${
                  active
                    ? "border-amber-500/60 bg-amber-500/10"
                    : "border-slate-800 bg-slate-950/70"
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => applyBook(id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-sm font-semibold text-slate-100">
                      {t(
                        locale,
                        id === "shop" ? "priceBookShop" : "priceBookOnsite",
                      )}
                    </div>
                    <p className="mt-0.5 break-words text-xs leading-snug text-slate-400">
                      {ratesLabel}
                    </p>
                    <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-amber-400/90">
                      {active
                        ? t(locale, "priceBookActive")
                        : t(locale, "priceBookApply")}
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={t(locale, "priceBookEditRates")}
                    onClick={() => openEdit(id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-900 text-slate-200"
                  >
                    <Cog className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {editId ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center"
          onClick={() => setEditId(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2
                id={titleId}
                className="text-sm font-semibold text-slate-100"
              >
                {t(
                  locale,
                  editId === "shop" ? "priceBookShop" : "priceBookOnsite",
                )}{" "}
                — {t(locale, "priceBookEditRates")}
              </h2>
              <button
                type="button"
                className="rounded-full border border-slate-700 p-1.5 text-slate-400"
                aria-label={t(locale, "presetPickerClose")}
                onClick={() => setEditId(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {editId === "shop" ? (
                <Segmented<LaborMode>
                  label={t(locale, "laborPayMode")}
                  value={draftLaborMode}
                  onChange={setDraftLaborMode}
                  options={[
                    { value: "hour", label: t(locale, "laborModeHour") },
                    { value: "per_cm", label: t(locale, "laborModeCm") },
                  ]}
                />
              ) : null}
              <NumberField
                label={t(locale, "laborHour")}
                suffix={`${sym}${t(locale, "perHour")}`}
                value={draftHour}
                step={5}
                onChange={setDraftHour}
              />
              {editId === "shop" ? (
                <NumberField
                  label={t(locale, "weldPerCm")}
                  suffix={`${sym}${t(locale, "perCm")}`}
                  value={draftCm}
                  step={0.1}
                  onChange={setDraftCm}
                />
              ) : null}
              <button
                type="button"
                onClick={saveRates}
                className="w-full rounded-xl bg-amber-500 px-3 py-2.5 text-sm font-semibold text-slate-950"
              >
                {t(locale, "priceBookRatesSave")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
