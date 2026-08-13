"use client";

import { Flame } from "lucide-react";
import { NumberField, Segmented } from "@/components/FormFields";
import { SectionCard } from "@/components/SectionCard";
import { WELD_TYPE_KEY, t } from "@/lib/i18n";
import type {
  GasType,
  Locale,
  RodDiameter,
  WeldJointType,
  WeldingParams,
} from "@/lib/types";

interface WeldingFormProps {
  locale: Locale;
  value: WeldingParams;
  onChange: (value: WeldingParams) => void;
}

export function WeldingForm({ locale, value, onChange }: WeldingFormProps) {
  return (
    <SectionCard
      title={t(locale, "weldTitle")}
      subtitle={t(locale, "weldSubtitle")}
      icon={<Flame className="h-5 w-5" />}
      collapsible
    >
      <div className="space-y-3">
        <Segmented<WeldJointType>
          label={t(locale, "weldJointType")}
          value={value.weldJointType}
          onChange={(weldJointType) => onChange({ ...value, weldJointType })}
          options={[
            { value: "butt", label: t(locale, WELD_TYPE_KEY.butt) },
            { value: "fillet", label: t(locale, WELD_TYPE_KEY.fillet) },
            { value: "purge", label: t(locale, WELD_TYPE_KEY.purge) },
          ]}
        />
        <p className="text-xs text-slate-500">{t(locale, "weldTypeHint")}</p>

        <Segmented<RodDiameter>
          label={t(locale, "rodDiameter")}
          value={value.rodDiameter}
          onChange={(rodDiameter) => onChange({ ...value, rodDiameter })}
          options={[
            { value: 1.6, label: "Ø 1.6" },
            { value: 2.0, label: "Ø 2.0" },
            { value: 2.4, label: "Ø 2.4" },
            { value: 3.2, label: "Ø 3.2" },
          ]}
        />
        <Segmented<GasType>
          label={t(locale, "shieldingGas")}
          value={value.gasType}
          onChange={(gasType) => onChange({ ...value, gasType })}
          options={[
            { value: "argon", label: t(locale, "gasArgon") },
            { value: "ar_he", label: t(locale, "gasArHe") },
          ]}
        />
        <NumberField
          label={t(locale, "gasFlow")}
          suffix={t(locale, "lpm")}
          value={value.gasFlowLpm}
          step={1}
          min={6}
          max={20}
          onChange={(gasFlowLpm) => onChange({ ...value, gasFlowLpm })}
        />
      </div>
    </SectionCard>
  );
}
