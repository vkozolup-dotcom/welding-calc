"use client";

import type { ReactNode } from "react";
import {
  Cylinder,
  HardHat,
  Scale,
  Sparkles,
  Weight,
} from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { formatNum, t } from "@/lib/i18n";
import type {
  FactorParams,
  FullResult,
  JobMode,
  Locale,
  WeldingParams,
} from "@/lib/types";

interface ResultsPanelProps {
  locale: Locale;
  result: FullResult;
  welding: WeldingParams;
  jobMode: JobMode;
  laborMode?: "hour" | "per_cm";
  factors: FactorParams;
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-xl font-semibold text-slate-50">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function ResultsPanel({
  locale,
  result,
  welding,
  jobMode,
  laborMode = "hour",
  factors,
}: ResultsPanelProps) {
  const { materials: m } = result;
  const onsite = jobMode === "onsite";
  const showHourPrep = onsite || laborMode === "hour";
  const prepPct = factors.prepWorkPercent;
  const gasLabel =
    welding.gasType === "argon"
      ? t(locale, "gasArgon")
      : t(locale, "gasArHe");
  const unitM = t(locale, "meters");
  const unitKg = t(locale, "kg");

  return (
    <SectionCard
      title={t(locale, "resultsTitle")}
      subtitle={
        onsite
          ? t(locale, "jobModeOnsiteDesc")
          : t(locale, "resultsSubtitle")
      }
      icon={<Sparkles className="h-5 w-5" />}
      collapsible
    >
      {onsite ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {t(locale, "manualHours")}
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-100">
              {formatNum(m.laborHoursBase, locale)} h
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {t(locale, "prepWork", { pct: prepPct })}
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-200">
              +{formatNum(m.laborHoursPrep, locale)} h
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-amber-400/90">
              {t(locale, "hoursWithPrep")}
            </div>
            <div className="mt-1 text-3xl font-bold text-amber-300">
              {formatNum(m.laborHoursBilled, locale)} h
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {t(locale, "clientJobOnsite")}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat
              icon={<HardHat className="h-4 w-4" />}
              label={t(locale, "profileStat")}
              value={`${formatNum(m.profileLengthWithWasteM, locale)} ${unitM}`}
              hint={t(locale, "rawPlusCut", {
                raw: formatNum(m.profileLengthRawM, locale),
                pct: formatNum(factors.cutWastePercent, locale, 0),
              })}
            />
            <Stat
              icon={<Weight className="h-4 w-4" />}
              label={t(locale, "weightStat")}
              value={`${formatNum(m.weightKg, locale)} ${unitKg}`}
              hint={t(locale, "structure")}
            />
            <Stat
              icon={<Scale className="h-4 w-4" />}
              label={t(locale, "fillerStat")}
              value={`${formatNum(m.fillerKg, locale)} ${unitKg}`}
              hint={t(locale, "depositedPlusLoss", {
                dep: formatNum(m.depositedMetalKg, locale),
                pct: formatNum(factors.rodLossPercent, locale, 0),
              })}
            />
            <Stat
              icon={<Cylinder className="h-4 w-4" />}
              label={t(locale, "gasStat")}
              value={`${formatNum(m.gasLiters, locale, 0)} l`}
              hint={t(locale, "gasHint", {
                gas: gasLabel,
                pct: formatNum(m.gasCylinderFraction * 100, locale, 1),
              })}
            />
          </div>
          <p className="mt-3 text-sm text-slate-400">
            {t(locale, "seamsSummary", {
              weld: formatNum(m.weldLengthM, locale),
              cm: formatNum(m.weldLengthCm, locale, 0),
              min: formatNum(m.weldingTimeMin, locale, 0),
              hrs: formatNum(
                showHourPrep ? m.laborHoursBilled : m.laborHoursBase,
                locale,
              ),
            })}
          </p>
          {showHourPrep ? (
            <p className="mt-1 text-sm text-amber-400/90">
              {t(locale, "prepWork", { pct: prepPct })}: +
              {formatNum(m.laborHoursPrep, locale)} h →{" "}
              {formatNum(m.laborHoursBilled, locale)} h
            </p>
          ) : null}
        </>
      )}
    </SectionCard>
  );
}
