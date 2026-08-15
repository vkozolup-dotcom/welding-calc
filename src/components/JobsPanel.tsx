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
  JOB_SOFT_CAP,
  downloadTextFile,
  exportFullBackupJson,
  sortJobs,
  stampNow,
} from "@/lib/jobsUtils";
import {
  PIPE_MEDIA_KEY,
  PRESET_TITLE_KEY,
  formatMoney,
  formatNum,
  t,
} from "@/lib/i18n";
import { buildWhatsAppQuote } from "@/lib/quote";
import { shareOrSendText } from "@/lib/share";
import {
  createJobId,
  loadJobs,
  loadPriceBooks,
  loadSettings,
  mergeInputs,
  sanitizePrices,
  saveJobs,
  savePriceBooks,
} from "@/lib/storage";
import { isSafePhotoDataUrl } from "@/lib/security";
import type { Locale, PriceBookStore, SavedJob } from "@/lib/types";

interface JobsPanelProps {
  locale: Locale;
  onEdit: (job: SavedJob) => void;
  refreshKey?: number;
  onMutate?: () => void;
  onJobNoteChange?: (id: string, note: string) => void;
}

export function JobsPanel({
  locale,
  onEdit,
  refreshKey = 0,
  onMutate,
  onJobNoteChange,
}: JobsPanelProps) {
  const [jobs, setJobs] = useState<SavedJob[]>(() => loadJobs());
  const [query, setQuery] = useState("");
  const [importFlash, setImportFlash] = useState(false);
  const [errorFlash, setErrorFlash] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(() => setJobs(loadJobs()));
  }, [refreshKey]);

  function flashError(key: "storageFull" | "importFailed" | "photoFailed") {
    setErrorFlash(t(locale, key));
    setTimeout(() => setErrorFlash(""), 2500);
  }

  function persist(next: SavedJob[], opts?: { silent?: boolean }): boolean {
    const sorted = sortJobs(next);
    const ok = saveJobs(sorted);
    if (ok) {
      setJobs(sorted);
      if (!opts?.silent) onMutate?.();
    } else {
      setJobs(loadJobs());
      flashError("storageFull");
    }
    return ok;
  }

  function patchJob(id: string, patch: Partial<SavedJob>) {
    const metaOnly =
      "note" in patch || "photoDataUrl" in patch || "pinned" in patch;
    const touchTime = !metaOnly;
    const current = loadJobs();
    const ok = persist(
      current.map((j) =>
        j.id === id
          ? {
              ...j,
              ...patch,
              updatedAt: touchTime ? stampNow() : j.updatedAt,
            }
          : j,
      ),
      { silent: metaOnly },
    );
    if (ok && typeof patch.note === "string") {
      onJobNoteChange?.(id, patch.note);
    }
    return ok;
  }

  function deleteJob(job: SavedJob) {
    if (!window.confirm(t(locale, "jobDeleteConfirm"))) return;
    persist(loadJobs().filter((j) => j.id !== job.id));
  }

  function duplicateJob(job: SavedJob) {
    const current = loadJobs();
    if (current.length >= JOB_SOFT_CAP) {
      if (!window.confirm(t(locale, "jobCapWarn"))) return;
    }
    const copy: SavedJob = {
      ...structuredClone(job),
      id: createJobId(),
      name: `${job.name} (${t(locale, "jobCopySuffix")})`,
      updatedAt: stampNow(),
      pinned: false,
    };
    persist([copy, ...current].slice(0, JOB_SOFT_CAP));
  }

  function handleExport() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      `welding-backup-${stamp}.json`,
      exportFullBackupJson(loadJobs(), loadPriceBooks(), loadSettings()),
    );
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.jobs)
          ? parsed.jobs
          : null;
      if (!list) {
        flashError("importFailed");
        return;
      }

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
            typeof r.updatedAt === "number" ? r.updatedAt : stampNow(),
          inputs: mergeInputs(r.inputs),
          note: typeof r.note === "string" ? r.note.slice(0, 4000) : "",
          photoDataUrl: isSafePhotoDataUrl(r.photoDataUrl)
            ? r.photoDataUrl
            : null,
          pinned: r.pinned === true,
        });
      }
      if (incoming.length === 0) {
        flashError("importFailed");
        return;
      }

      // Full backup v2 may restore price books
      if (parsed.version === 2 && parsed.priceBooks && typeof parsed.priceBooks === "object") {
        const books = parsed.priceBooks as Partial<PriceBookStore>;
        const nextBooks: PriceBookStore = {
          shop: books.shop ? sanitizePrices(books.shop) : null,
          onsite: books.onsite ? sanitizePrices(books.onsite) : null,
        };
        if (!savePriceBooks(nextBooks)) {
          flashError("storageFull");
          return;
        }
      }

      const ok = persist(
        [...incoming, ...loadJobs()].slice(0, JOB_SOFT_CAP * 2),
      );
      if (ok) {
        setImportFlash(true);
        setTimeout(() => setImportFlash(false), 1500);
      }
    } catch {
      flashError("importFailed");
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
          {errorFlash ? (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {errorFlash}
            </p>
          ) : null}
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
                onDelete={() => deleteJob(job)}
                onDuplicate={() => duplicateJob(job)}
                onPatch={(patch) => patchJob(job.id, patch)}
                onPhotoError={() => flashError("photoFailed")}
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
  onPhotoError,
}: {
  job: SavedJob;
  locale: Locale;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPatch: (patch: Partial<SavedJob>) => boolean;
  onPhotoError: () => void;
}) {
  const [shareFlash, setShareFlash] = useState("");
  const [noteDraft, setNoteDraft] = useState(job.note);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputs = job.inputs;
  const { costs, materials } = calculateAll(inputs);
  const currency = inputs.currency;
  const presetLabel = t(locale, PRESET_TITLE_KEY[inputs.preset]);
  const mediaLabel =
    inputs.preset === "pipe"
      ? t(locale, PIPE_MEDIA_KEY[inputs.pipe.media])
      : null;

  useEffect(() => {
    return () => {
      if (noteTimer.current) clearTimeout(noteTimer.current);
    };
  }, []);

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

  async function shareWhatsApp() {
    const text = buildWhatsAppQuote(inputs, { materials, costs }, "client");
    const withMeta = [
      `*${job.name}*`,
      job.note ? `${t(locale, "jobNote")}: ${job.note}` : null,
      "",
      text,
    ]
      .filter(Boolean)
      .join("\n");
    const outcome = await shareOrSendText(withMeta, job.name);
    if (outcome === "cancelled") return;
    if (outcome === "failed") {
      setShareFlash(t(locale, "copyFailed"));
    } else if (outcome === "shared") {
      setShareFlash(t(locale, "sharedOk"));
    } else if (outcome === "opened") {
      setShareFlash(t(locale, "shareOpened"));
    } else {
      setShareFlash(t(locale, "jobCopied"));
    }
    setTimeout(() => setShareFlash(""), 1800);
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const photoDataUrl = await compressImageToDataUrl(file);
      if (!isSafePhotoDataUrl(photoDataUrl)) {
        onPhotoError();
        return;
      }
      const ok = onPatch({ photoDataUrl });
      if (!ok) onPhotoError();
    } catch {
      onPhotoError();
    }
  }

  function onNoteChange(value: string) {
    setNoteDraft(value);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      onPatch({ note: value });
    }, 400);
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
          value={noteDraft}
          rows={2}
          placeholder={t(locale, "jobNotePlaceholder")}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          onChange={(e) => onNoteChange(e.target.value)}
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
          onClick={() => void shareWhatsApp()}
        >
          {shareFlash ? (
            <>
              <Check className="h-4 w-4" />
              {shareFlash}
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
