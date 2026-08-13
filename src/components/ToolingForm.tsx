"use client";

import { Disc3 } from "lucide-react";
import { NumberField } from "@/components/FormFields";
import { SectionCard } from "@/components/SectionCard";
import { currencySymbol, t } from "@/lib/i18n";
import type { Currency, Locale, ToolingParams } from "@/lib/types";

interface ToolingFormProps {
  locale: Locale;
  currency: Currency;
  value: ToolingParams;
  onChange: (value: ToolingParams) => void;
}

export function ToolingForm({
  locale,
  currency,
  value,
  onChange,
}: ToolingFormProps) {
  const sym = currencySymbol(currency);

  return (
    <SectionCard
      title={t(locale, "toolingTitle")}
      subtitle={t(locale, "toolingSubtitle")}
      icon={<Disc3 className="h-5 w-5" />}
      collapsible
    >
      <div className="space-y-4">
        <ToolRow
          title={t(locale, "grindingDiscs")}
          locale={locale}
          sym={sym}
          qty={value.grindingDiscsQty}
          price={value.grindingDiscsUnitPrice}
          onQty={(grindingDiscsQty) => onChange({ ...value, grindingDiscsQty })}
          onPrice={(grindingDiscsUnitPrice) =>
            onChange({ ...value, grindingDiscsUnitPrice })
          }
        />
        <ToolRow
          title={t(locale, "cuttingDiscs")}
          locale={locale}
          sym={sym}
          qty={value.cuttingDiscsQty}
          price={value.cuttingDiscsUnitPrice}
          onQty={(cuttingDiscsQty) => onChange({ ...value, cuttingDiscsQty })}
          onPrice={(cuttingDiscsUnitPrice) =>
            onChange({ ...value, cuttingDiscsUnitPrice })
          }
        />
        <ToolRow
          title={t(locale, "abrasiveWheels")}
          locale={locale}
          sym={sym}
          qty={value.abrasiveWheelsQty}
          price={value.abrasiveWheelsUnitPrice}
          onQty={(abrasiveWheelsQty) =>
            onChange({ ...value, abrasiveWheelsQty })
          }
          onPrice={(abrasiveWheelsUnitPrice) =>
            onChange({ ...value, abrasiveWheelsUnitPrice })
          }
        />
        <ToolRow
          title={t(locale, "mills")}
          locale={locale}
          sym={sym}
          qty={value.millsQty}
          price={value.millsUnitPrice}
          onQty={(millsQty) => onChange({ ...value, millsQty })}
          onPrice={(millsUnitPrice) => onChange({ ...value, millsUnitPrice })}
        />
      </div>
    </SectionCard>
  );
}

function ToolRow({
  title,
  locale,
  sym,
  qty,
  price,
  onQty,
  onPrice,
}: {
  title: string;
  locale: Locale;
  sym: string;
  qty: number;
  price: number;
  onQty: (v: number) => void;
  onPrice: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-slate-200">{title}</div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t(locale, "qty")}
          suffix={t(locale, "pcs")}
          value={qty}
          step={1}
          min={0}
          onChange={onQty}
        />
        <NumberField
          label={t(locale, "unitPrice")}
          suffix={sym}
          value={price}
          step={1}
          min={0}
          onChange={onPrice}
        />
      </div>
    </div>
  );
}
