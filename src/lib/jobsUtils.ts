import { calculateAll } from "./calculations";
import type { Locale, SavedJob } from "./types";
import { formatNum, t } from "./i18n";

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface TodayStats {
  jobs: number;
  hours: number;
  weldCm: number;
}

export function calcTodayStats(jobs: SavedJob[]): TodayStats {
  const start = startOfToday();
  let count = 0;
  let hours = 0;
  let weldCm = 0;
  for (const job of jobs) {
    if (job.updatedAt < start) continue;
    count += 1;
    const r = calculateAll(job.inputs);
    hours += r.materials.laborHoursBilled;
    weldCm += r.materials.weldLengthCm;
  }
  return { jobs: count, hours, weldCm };
}

export function formatTodayStats(stats: TodayStats, locale: Locale): string {
  return t(locale, "todayStatsLine", {
    jobs: stats.jobs,
    hrs: formatNum(stats.hours, locale, 1),
    cm: formatNum(stats.weldCm, locale, 0),
  });
}

export function sortJobs(jobs: SavedJob[]): SavedJob[] {
  return [...jobs].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export function exportJobsJson(jobs: SavedJob[]): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      jobs,
    },
    null,
    2,
  );
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
