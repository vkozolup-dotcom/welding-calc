"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  Copy,
  Download,
  FolderOpen,
  MessageCircle,
  Pencil,
  Pin,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { TodayStatsBar } from "@/components/TodayStatsBar";
import { calculateAll } from "@/lib/calculations";
import { compressImageToDataUrl } from "@/lib/image";
import {
  downloadTextFile,
  exportJobsJson,
  sortJobs,
} from "@/lib/jobsUtils";
import {
  PIPE_MEDIA_KEY,
  PRESET_TITLE_KEY,
  formatMoney,
  formatNum,
  t,
} from "@/lib/i18n";
import { buildWhatsAppQuote } from "@/lib/quote";
import { createJobId, loadJobs, mergeInputs, saveJobs } from "@/lib/storage";
import { isSafePhotoDataUrl } from "@/lib/security";
import type { Locale, SavedJob } from "@/lib/types";

interface JobsPanelProps {
  locale: Locale;
  onEdit: (job: SavedJob) => void;
  refreshKey?: number;
  onMutate?: () => void;
}

export function JobsPanel({
  locale,
  onEdit,
  refreshKey = 0,
  onMutate,
}: JobsPanelProps) {
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [query, setQuery] = useState("");
  const [importFlash, setImportFlash] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setJobs(loadJobs());
  }, [refreshKey]);

  function persist(next: SavedJob[]) {
    const sorted = sortJobs(next);
    setJobs(sorted);
    saveJobs(sorted);
    onMutate?.();
  }

  function patchJob(id: string, patch: Partial<SavedJob>) {
    persist(
      jobs.map((j) =>
        j.id === id ? { ...j, ...patch, updatedAt: Date.now() } : j,
      ),
    );
  }

  function duplicateJob(job: SavedJob) {
    const copy: SavedJob = {
      ...structuredClone(job),
      id: createJobId(),
      name: `${job.name} (${t(locale, "jobCopySuffix")})`,
      updatedAt: Date.now(),
      pinned: false,
    };
    persist([copy, ...jobs]);
  }

  function handleExport() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`welding-jobs-${stamp}.json`, exportJobsJson(jobs));
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { jobs?: unknown } | unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { jobs?: unknown }).jobs)
          ? (parsed as { jobs: unknown[] }).jobs
          : null;
      if (!list) return;
      const incoming: SavedJob[] = [];
      for (const raw of list) {
        if (!raw || typeof raw !== "object") continue;
        const r = raw as Record<string, unknown>;
        if (typeof r.id !== "string") continue;
        incoming.push({
          id: createJobId(),
          name:
            typeof r.name === "string" && r.name.trim() ? r.name : "Job",
          updatedAt:
            typeof r.updatedAt === "number" ? r.updatedAt : Date.now(),
          inputs: mergeInputs(r.inputs),
          note: typeof r.note === "string" ? r.note.slice(0, 4000) : "",
          photoDataUrl: isSafePhotoDataUrl(r.photoDataUrl)
            ? r.photoDataUrl
            : null,
          pinned: r.pinned === true,
        });
      }
      if (incoming.length === 0) return;
      persist([...incoming, ...jobs].slice(0, 80));
      setImportFlash(true);
      setTimeout(() => setImportFlash(false), 1500);
    } catch {
      /* ignore bad file */
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => {
      const hay = [
        j.name,
        j.note,
        j.inputs.jobNote,
        j.inputs.preset,
        j.inputs.pipe?.media ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [jobs, query]);

  return (
    <div className="space-y-4">
      <TodayStatsBar locale={locale} jobs={jobs} />

      <SectionCard
        title={t(locale, "jobsTitle")}
        subtitle={t(locale, "jobsSubtitle")}
        icon={<FolderOpen className="h-5 w-5" />}
      >
        <div className="mb-3 space-y-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Search className="h-3.5 w-3.5" />
              {t(locale, "jobSearch")}
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(locale, "jobSearchPlaceholder")}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
            >
              <Download className="h-4 w-4" />
              {t(locale, "jobExport")}
            </button>
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
            >
              <Upload className="h-4 w-4" />
              {importFlash ? t(locale, "jobImportOk") : t(locale, "jobImport")}
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                void handleImport(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {jobs.length === 0 ? (
          <p className="text-sm text-slate-500">{t(locale, "jobEmpty")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">{t(locale, "jobNoSearchHits")}</p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                locale={locale}
                onEdit={() => onEdit(job)}
                onDelete={() => persist(jobs.filter((j) => j.id !== job.id))}
                onDuplicate={() => duplicateJob(job)}
                onPatch={(patch) => patchJob(job.id, patch)}
              />
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function JobCard({
  job,
  locale,
  onEdit,
  onDelete,
  onDuplicate,
  onPatch,
}: {
  job: SavedJob;
  locale: Locale;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPatch: (patch: Partial<SavedJob>) => void;
}) {
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputs = job.inputs;
  const { costs, materials } = calculateAll(inputs);
  const currency = inputs.currency;
  const presetLabel = t(locale, PRESET_TITLE_KEY[inputs.preset]);
  const mediaLabel =
    inputs.preset === "pipe"
      ? t(locale, PIPE_MEDIA_KEY[inputs.pipe.media])
      : null;

  const rows: { label: string; value: string }[] = [
    {
      label: t(locale, "quoteProduct"),
      value: mediaLabel ? `${presetLabel} — ${mediaLabel}` : presetLabel,
    },
  ];

  if (inputs.preset === "pipe") {
    for (const [idx, seg] of inputs.pipe.segments.entries()) {
      const p = seg.profileId.replace(/^pipe-/, "Ø");
      rows.push({
        label: t(locale, "pipeSegment", { n: idx + 1 }),
        value: `${p} · ${formatNum(seg.lengthM, locale)} m`,
      });
    }
    rows.push({
      label: t(locale, "pipeJointsTotal"),
      value: formatNum(materials.pipeJointCount, locale, 0),
    });
  }

  rows.push(
    {
      label: t(locale, "quoteWeldLineShort"),
      value: `${formatNum(materials.weldLengthM, locale)} ${t(locale, "meters")}`,
    },
    {
      label: t(locale, "clientTotal"),
      value: formatMoney(costs.clientPrice, locale, currency),
    },
  );

  async function copyWhatsApp() {
    const text = buildWhatsAppQuote(inputs, { materials, costs }, "client");
    const withMeta = [
      `*${job.name}*`,
      job.note ? `${t(locale, "jobNote")}: ${job.note}` : null,
      "",
      text,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(withMeta);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = withMeta;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const photoDataUrl = await compressImageToDataUrl(file);
      if (!isSafePhotoDataUrl(photoDataUrl)) return;
      onPatch({ photoDataUrl });
    } catch {
      /* ignore */
    }
  }

  return (
    <li
      className={`rounded-2xl border p-3 ${
        job.pinned
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-slate-800 bg-slate-950/80"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-50">
            {job.pinned ? "📌 " : ""}
            {job.name}
          </div>
          <div className="text-xs text-slate-500">
            {new Date(job.updatedAt).toLocaleString()}
          </div>
        </div>
        <button
          type="button"
          className={`rounded-lg border p-2 ${
            job.pinned
              ? "border-amber-500/50 text-amber-300"
              : "border-slate-700 text-slate-400"
          }`}
          aria-label={t(locale, job.pinned ? "jobUnpin" : "jobPin")}
          onClick={() => onPatch({ pinned: !job.pinned })}
        >
          <Pin className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 space-y-1.5 rounded-xl border border-slate-800/80 bg-slate-900/50 p-2.5 text-sm">
        {rows.map((row) => (
          <div
            key={`${row.label}-${row.value}`}
            className="flex items-start justify-between gap-3"
          >
            <span className="text-slate-500">{row.label}</span>
            <span className="max-w-[58%] text-right font-medium text-slate-200">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <label className="mb-3 block">
        <span className="mb-1.5 block text-xs font-medium text-slate-400">
          {t(locale, "jobNote")}
        </span>
        <textarea
          value={job.note}
          rows={2}
          placeholder={t(locale, "jobNotePlaceholder")}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          onChange={(e) => onPatch({ note: e.target.value })}
        />
      </label>

      <div className="mb-3">
        <div className="mb-1.5 text-xs font-medium text-slate-400">
          {t(locale, "jobPhoto")}
        </div>
        {job.photoDataUrl ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={job.photoDataUrl}
              alt=""
              className="max-h-40 w-full rounded-xl object-cover"
            />
            <button
              type="button"
              className="text-xs text-slate-400 underline"
              onClick={() => onPatch({ photoDataUrl: null })}
            >
              {t(locale, "jobPhotoRemove")}
            </button>
          </div>
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onPhoto(e.target.files?.[0])}
            />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              {t(locale, "jobPhotoAdd")}
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2.5 text-sm font-semibold text-slate-950"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
          {t(locale, "jobEdit")}
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-600 px-3 py-2.5 text-sm font-semibold text-slate-100"
          onClick={copyWhatsApp}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              {t(locale, "jobCopied")}
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" />
              {t(locale, "jobWhatsApp")}
            </>
          )}
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300"
          onClick={onDuplicate}
        >
          <Copy className="h-4 w-4" />
          {t(locale, "jobDuplicate")}
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-400"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          {t(locale, "jobDelete")}
        </button>
      </div>
    </li>
  );
}
