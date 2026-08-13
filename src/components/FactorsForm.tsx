"use client";

import { SlidersHorizontal } from "lucide-react";
import { NumberField } from "@/components/FormFields";
import { SectionCard } from "@/components/SectionCard";
import { t } from "@/lib/i18n";
import type { FactorParams, Locale } from "@/lib/types";

interface FactorsFormProps {
  locale: Locale;
  value: FactorParams;
  onChange: (value: FactorParams) => void;
}

export function FactorsForm({ locale, value, onChange }: FactorsFormProps) {
  return (
    <SectionCard
      title={t(locale, "factorsTitle")}
      subtitle={t(locale, "factorsSubtitle")}
      icon={<SlidersHorizontal className="h-5 w-5" />}
      collapsible
    >
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t(locale, "factorCutWaste")}
          suffix={t(locale, "percent")}
          value={value.cutWastePercent}
          step={1}
          min={0}
          onChange={(cutWastePercent) =>
            onChange({ ...value, cutWastePercent })
          }
        />
        <NumberField
          label={t(locale, "factorRodLoss")}
          suffix={t(locale, "percent")}
          value={value.rodLossPercent}
          step={1}
          min={0}
          onChange={(rodLossPercent) => onChange({ ...value, rodLossPercent })}
        />
        <NumberField
          label={t(locale, "factorPrep")}
          suffix={t(locale, "percent")}
          value={value.prepWorkPercent}
          step={1}
          min={0}
          onChange={(prepWorkPercent) =>
            onChange({ ...value, prepWorkPercent })
          }
        />
        <NumberField
          label={t(locale, "factorWeldSpeed")}
          suffix={t(locale, "mPerMin")}
          value={value.weldSpeedMPerMin}
          step={0.01}
          min={0.01}
          onChange={(weldSpeedMPerMin) =>
            onChange({ ...value, weldSpeedMPerMin })
          }
        />
        <NumberField
          label={t(locale, "factorFab")}
          suffix="×"
          value={value.fabTimeFactor}
          step={0.1}
          min={0.1}
          onChange={(fabTimeFactor) => onChange({ ...value, fabTimeFactor })}
        />
      </div>
    </SectionCard>
  );
}
