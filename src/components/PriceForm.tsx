"use client";

import { Wallet } from "lucide-react";
import { NumberField, Segmented } from "@/components/FormFields";
import { SectionCard } from "@/components/SectionCard";
import { currencySymbol, t } from "@/lib/i18n";
import type {
  Currency,
  JobMode,
  LaborMode,
  Locale,
  PriceParams,
} from "@/lib/types";

interface PriceFormProps {
  locale: Locale;
  currency: Currency;
  value: PriceParams;
  onChange: (value: PriceParams) => void;
}

export function PriceForm({
  locale,
  currency,
  value,
  onChange,
}: PriceFormProps) {
  const sym = currencySymbol(currency);
  const onsite = value.jobMode === "onsite";

  return (
    <SectionCard
      title={t(locale, "pricesTitle")}
      subtitle={t(locale, "pricesSubtitle")}
      icon={<Wallet className="h-5 w-5" />}
      collapsible
    >
      <div className="space-y-3">
        <Segmented<JobMode>
          label={t(locale, "jobModeTitle")}
          value={value.jobMode}
          onChange={(jobMode) =>
            onChange({
              ...value,
              jobMode,
              laborMode: jobMode === "onsite" ? "hour" : value.laborMode,
              // Onsite always manual hours; leaving onsite returns to auto estimate
              useManualHours: jobMode === "onsite",
            })
          }
          options={[
            { value: "full", label: t(locale, "jobModeFull") },
            { value: "onsite", label: t(locale, "jobModeOnsite") },
          ]}
        />
        <p className="text-xs text-slate-500">
          {t(locale, onsite ? "jobModeOnsiteDesc" : "jobModeFullDesc")}
        </p>

        {!onsite && (
          <>
            <NumberField
              label={t(locale, "priceProfileMild")}
              suffix={`${sym}${t(locale, "perMeter")}`}
              value={value.profilePricePerMMild}
              step={1}
              onChange={(profilePricePerMMild) =>
                onChange({ ...value, profilePricePerMMild })
              }
            />
            <NumberField
              label={t(locale, "priceProfileStainless")}
              suffix={`${sym}${t(locale, "perMeter")}`}
              value={value.profilePricePerMStainless}
              step={1}
              onChange={(profilePricePerMStainless) =>
                onChange({ ...value, profilePricePerMStainless })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label={t(locale, "rodPack")}
                suffix={sym}
                value={value.rodPackPrice}
                step={5}
                onChange={(rodPackPrice) =>
                  onChange({ ...value, rodPackPrice })
                }
              />
              <NumberField
                label={t(locale, "rodPackWeight")}
                suffix={t(locale, "kg")}
                value={value.rodPackKg}
                step={1}
                onChange={(rodPackKg) => onChange({ ...value, rodPackKg })}
              />
            </div>
            <NumberField
              label={t(locale, "gasRefill")}
              suffix={sym}
              value={value.gasRefillPrice}
              step={5}
              onChange={(gasRefillPrice) =>
                onChange({ ...value, gasRefillPrice })
              }
            />

            <Segmented<LaborMode>
              label={t(locale, "laborPayMode")}
              value={value.laborMode}
              onChange={(laborMode) =>
                onChange({
                  ...value,
                  laborMode,
                  // Switching to per_cm always uses seam length; hour starts on auto estimate
                  useManualHours:
                    laborMode === "hour" ? value.useManualHours : false,
                })
              }
              options={[
                { value: "hour", label: t(locale, "laborModeHour") },
                { value: "per_cm", label: t(locale, "laborModeCm") },
              ]}
            />
          </>
        )}

        {(onsite || value.laborMode === "hour") && (
          <>
            {!onsite ? (
              <Segmented<"auto" | "manual">
                label={t(locale, "hoursSource")}
                value={value.useManualHours ? "manual" : "auto"}
                onChange={(next) =>
                  onChange({ ...value, useManualHours: next === "manual" })
                }
                options={[
                  { value: "auto", label: t(locale, "hoursAuto") },
                  { value: "manual", label: t(locale, "hoursManual") },
                ]}
              />
            ) : null}
            {(onsite || value.useManualHours) && (
              <NumberField
                label={t(locale, "manualHours")}
                suffix="h"
                value={value.manualHours}
                step={0.5}
                onChange={(manualHours) =>
                  onChange({
                    ...value,
                    manualHours,
                    useManualHours: true,
                  })
                }
              />
            )}
          </>
        )}

        {/* Hour / per-cm rates live in Presety cen (gear) */}

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
          {value.invoiceEnabled
            ? t(locale, "invoiceOn")
            : t(locale, "invoiceOff")}
          {value.invoiceEnabled
            ? ` · ${t(locale, "vat", { pct: Math.max(0, value.vatPercent) })}`
            : ""}
        </div>

        <Segmented<"on" | "off">
          label={t(locale, "invoiceToggle")}
          value={value.invoiceEnabled ? "on" : "off"}
          onChange={(next) =>
            onChange({ ...value, invoiceEnabled: next === "on" })
          }
          options={[
            { value: "on", label: t(locale, "invoiceOnShort") },
            { value: "off", label: t(locale, "invoiceOffShort") },
          ]}
        />
        {value.invoiceEnabled && (
          <NumberField
            label={t(locale, "vatLabel")}
            suffix="%"
            value={value.vatPercent}
            step={1}
            onChange={(vatPercent) => onChange({ ...value, vatPercent })}
          />
        )}

        <Segmented<"on" | "off">
          label={t(locale, "deliveryToggle")}
          value={value.deliveryEnabled ? "on" : "off"}
          onChange={(next) =>
            onChange({ ...value, deliveryEnabled: next === "on" })
          }
          options={[
            { value: "on", label: t(locale, "deliveryOn") },
            { value: "off", label: t(locale, "deliveryOff") },
          ]}
        />
        {value.deliveryEnabled && (
          <NumberField
            label={t(locale, "deliveryPrice")}
            suffix={sym}
            value={value.deliveryPrice}
            step={10}
            min={0}
            onChange={(deliveryPrice) => onChange({ ...value, deliveryPrice })}
          />
        )}

        <NumberField
          label={`${t(locale, "eurRate")} ${sym}`}
          suffix={t(locale, "eurRateHint")}
          value={value.eurRate}
          step={0.01}
          min={0.01}
          onChange={(eurRate) => onChange({ ...value, eurRate })}
        />
      </div>
    </SectionCard>
  );
}
