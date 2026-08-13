"use client";

import { CalendarDays } from "lucide-react";
import { calcTodayStats, formatTodayStats } from "@/lib/jobsUtils";
import { t } from "@/lib/i18n";
import type { Locale, SavedJob } from "@/lib/types";

export function TodayStatsBar({
  locale,
  jobs,
}: {
  locale: Locale;
  jobs: SavedJob[];
}) {
  const stats = calcTodayStats(jobs);
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <CalendarDays className="h-3.5 w-3.5" />
        {t(locale, "todayTitle")}
      </div>
      <div className="text-sm font-medium text-slate-100">
        {stats.jobs === 0
          ? t(locale, "todayEmpty")
          : formatTodayStats(stats, locale)}
      </div>
    </div>
  );
}
