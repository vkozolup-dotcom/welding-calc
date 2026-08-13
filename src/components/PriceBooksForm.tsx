"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { t } from "@/lib/i18n";
import { loadPriceBooks, sanitizePrices, savePriceBooks } from "@/lib/storage";
import type {
  Locale,
  PriceBookId,
  PriceBookStore,
  PriceParams,
} from "@/lib/types";

interface PriceBooksFormProps {
  locale: Locale;
  value: PriceParams;
  onApply: (prices: PriceParams) => void;
}

export function PriceBooksForm({
  locale,
  value,
  onApply,
}: PriceBooksFormProps) {
  const [books, setBooks] = useState<PriceBookStore>({
    shop: null,
    onsite: null,
  });
  const [flash, setFlash] = useState<PriceBookId | null>(null);

  useEffect(() => {
    setBooks(loadPriceBooks());
  }, []);

  function saveBook(id: PriceBookId) {
    const snapshot: PriceParams = sanitizePrices({
      ...structuredClone(value),
      jobMode: id === "onsite" ? "onsite" : "full",
      laborMode: id === "onsite" ? "hour" : value.laborMode,
      useManualHours: id === "onsite" ? true : value.useManualHours,
    });
    const next = { ...books, [id]: snapshot };
    setBooks(next);
    savePriceBooks(next);
    setFlash(id);
    setTimeout(() => setFlash(null), 1200);
  }

  function applyBook(id: PriceBookId) {
    const saved = books[id];
    if (!saved) return;
    const prices: PriceParams = {
      ...sanitizePrices(structuredClone(saved)),
      jobMode: id === "onsite" ? "onsite" : "full",
      laborMode: id === "onsite" ? "hour" : saved.laborMode,
      useManualHours: id === "onsite" ? true : saved.useManualHours === true,
    };
    onApply(prices);
  }

  return (
    <SectionCard
      title={t(locale, "priceBooksTitle")}
      subtitle={t(locale, "priceBooksSubtitle")}
      icon={<Bookmark className="h-5 w-5" />}
      collapsible
    >
      <div className="grid grid-cols-2 gap-3">
        {(["shop", "onsite"] as const).map((id) => {
          const saved = books[id];
          return (
            <div
              key={id}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"
            >
              <div className="mb-2 text-sm font-semibold text-slate-100">
                {t(locale, id === "shop" ? "priceBookShop" : "priceBookOnsite")}
              </div>
              <p className="mb-3 text-xs text-slate-500">
                {saved
                  ? `${saved.laborHourPrice} / ${saved.weldPricePerCm}`
                  : t(locale, "priceBookEmpty")}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={!saved}
                  onClick={() => applyBook(id)}
                  className="rounded-lg bg-amber-500 px-2 py-2 text-xs font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t(locale, "priceBookApply")}
                </button>
                <button
                  type="button"
                  onClick={() => saveBook(id)}
                  className="rounded-lg border border-slate-700 px-2 py-2 text-xs font-semibold text-slate-200"
                >
                  {flash === id
                    ? t(locale, "priceBookSaved")
                    : t(locale, "priceBookSave")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
