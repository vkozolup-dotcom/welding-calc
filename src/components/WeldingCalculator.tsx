"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, Save } from "lucide-react";
import { ClientLinkForm } from "@/components/ClientLinkForm";
import { ClientOfferPanel, QuotePanel } from "@/components/QuotePanel";
import { DimensionForm } from "@/components/DimensionForm";
import { FactorsForm } from "@/components/FactorsForm";
import { JobsPanel } from "@/components/JobsPanel";
import { PipeTemplatesForm } from "@/components/PipeTemplatesForm";
import { PresetSelector } from "@/components/PresetSelector";
import { PriceBooksForm } from "@/components/PriceBooksForm";
import { PriceForm } from "@/components/PriceForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SectionCard } from "@/components/SectionCard";
import { TodayStatsBar } from "@/components/TodayStatsBar";
import { ToolingForm } from "@/components/ToolingForm";
import { WeldingForm } from "@/components/WeldingForm";
import { calculateAll } from "@/lib/calculations";
import { DEFAULT_INPUTS } from "@/lib/defaults";
import { JOB_SOFT_CAP } from "@/lib/jobsUtils";
import {
  PRESET_TITLE_KEY,
  formatMoney,
  formatNum,
  t,
} from "@/lib/i18n";
import {
  createJobId,
  loadJobs,
  loadSettings,
  saveJobs,
  saveSettings,
} from "@/lib/storage";
import type {
  AppTab,
  CalcInputs,
  Locale,
  PresetId,
  SavedJob,
} from "@/lib/types";

function jobFingerprint(inputs: CalcInputs, name: string): string {
  return JSON.stringify({ name, inputs });
}

export function WeldingCalculator() {
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULT_INPUTS);
  const [tab, setTab] = useState<AppTab>("friend");
  const [hydrated, setHydrated] = useState(false);
  const [jobName, setJobName] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJobName, setActiveJobName] = useState<string | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);
  const [saveFlash, setSaveFlash] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [jobsRefresh, setJobsRefresh] = useState(0);
  const [todayJobs, setTodayJobs] = useState<SavedJob[]>([]);

  useEffect(() => {
    const saved = loadSettings();
    if (saved) {
      setInputs(saved.inputs);
      setTab(saved.tab);
      const jobs = loadJobs();
      setTodayJobs(jobs);
      if (saved.activeJobId && jobs.some((j) => j.id === saved.activeJobId)) {
        const job = jobs.find((j) => j.id === saved.activeJobId)!;
        setActiveJobId(job.id);
        setActiveJobName(job.name);
        setJobName(job.name);
        setSavedFingerprint(
          jobFingerprint(
            {
              ...structuredClone(job.inputs),
              jobNote: job.note || job.inputs.jobNote || "",
            },
            job.name,
          ),
        );
      } else {
        setActiveJobId(null);
        setActiveJobName(null);
      }
    } else {
      setTodayJobs(loadJobs());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    setTodayJobs(loadJobs());
  }, [jobsRefresh]);

  useEffect(() => {
    if (!hydrated) return;
    const ok = saveSettings(inputs, tab, activeJobId);
    if (!ok) {
      setSaveError(t(inputs.locale, "settingsSaveFailed"));
      setTimeout(() => setSaveError(""), 2500);
    }
    document.documentElement.lang = inputs.locale;
  }, [inputs, tab, activeJobId, hydrated]);

  const result = useMemo(() => calculateAll(inputs), [inputs]);
  const { locale, currency } = inputs;
  const onsite = inputs.prices.jobMode === "onsite";
  const isDirty =
    !!activeJobId &&
    savedFingerprint !== null &&
    jobFingerprint(inputs, jobName.trim() || activeJobName || "") !==
      savedFingerprint;

  function patch(partial: Partial<CalcInputs>) {
    setInputs((prev) => ({ ...prev, ...partial }));
  }

  function upsertJob(asNew: boolean) {
    const label =
      jobName.trim() ||
      `${t(locale, PRESET_TITLE_KEY[inputs.preset])} ${new Date().toLocaleDateString()}`;
    const jobs = loadJobs();
    const payloadInputs = structuredClone({
      ...inputs,
      jobNote: inputs.jobNote,
    });

    const creatingNew = asNew || !activeJobId || !jobs.some((j) => j.id === activeJobId);
    if (creatingNew && jobs.length >= JOB_SOFT_CAP) {
      if (!window.confirm(t(locale, "jobCapWarn"))) return;
    }

    let ok = false;
    let nextFingerprint = jobFingerprint(payloadInputs, label);

    if (!asNew && activeJobId) {
      const existing = jobs.find((j) => j.id === activeJobId);
      if (!existing) {
        const job: SavedJob = {
          id: createJobId(),
          name: label,
          updatedAt: Date.now(),
          inputs: payloadInputs,
          note: inputs.jobNote,
          photoDataUrl: null,
          pinned: false,
        };
        ok = saveJobs([job, ...jobs].slice(0, JOB_SOFT_CAP));
        if (ok) {
          setActiveJobId(job.id);
          setActiveJobName(job.name);
          setJobName(job.name);
          setSavedFingerprint(nextFingerprint);
        }
      } else {
        const note =
          inputs.jobNote === (existing.inputs.jobNote || "") &&
          existing.note !== (existing.inputs.jobNote || "")
            ? existing.note
            : inputs.jobNote;
        const nextInputs = { ...payloadInputs, jobNote: note };
        nextFingerprint = jobFingerprint(nextInputs, label);
        const next = jobs.map((j) =>
          j.id === activeJobId
            ? {
                ...j,
                name: label,
                updatedAt: Date.now(),
                inputs: nextInputs,
                note,
              }
            : j,
        );
        ok = saveJobs(next);
        if (ok) {
          setActiveJobName(label);
          setSavedFingerprint(nextFingerprint);
          if (note !== inputs.jobNote) patch({ jobNote: note });
        }
      }
    } else {
      const job: SavedJob = {
        id: createJobId(),
        name: label,
        updatedAt: Date.now(),
        inputs: payloadInputs,
        note: inputs.jobNote,
        photoDataUrl: null,
        pinned: false,
      };
      ok = saveJobs([job, ...jobs].slice(0, JOB_SOFT_CAP));
      if (ok) {
        setActiveJobId(job.id);
        setActiveJobName(job.name);
        setJobName(job.name);
        setSavedFingerprint(nextFingerprint);
      }
    }

    if (!ok) {
      setSaveError(t(locale, "storageFull"));
      setTimeout(() => setSaveError(""), 2500);
      return;
    }

    setJobsRefresh((n) => n + 1);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  }

  function editJob(job: SavedJob) {
    const nextInputs = {
      ...structuredClone(job.inputs),
      jobNote: job.note || job.inputs.jobNote || "",
    };
    setInputs(nextInputs);
    setActiveJobId(job.id);
    setActiveJobName(job.name);
    setJobName(job.name);
    setSavedFingerprint(jobFingerprint(nextInputs, job.name));
    setTab("friend");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearEditing() {
    setActiveJobId(null);
    setActiveJobName(null);
    setJobName("");
    setSavedFingerprint(null);
    setInputs({
      ...structuredClone(DEFAULT_INPUTS),
      locale: inputs.locale,
      currency: inputs.currency,
      prices: structuredClone(inputs.prices),
      factors: structuredClone(inputs.factors),
      tooling: structuredClone(inputs.tooling),
      welding: structuredClone(inputs.welding),
      jobNote: "",
    });
  }

  function onJobsMutated() {
    setJobsRefresh((n) => n + 1);
    const jobs = loadJobs();
    if (activeJobId && !jobs.some((j) => j.id === activeJobId)) {
      setActiveJobId(null);
      setActiveJobName(null);
      setSavedFingerprint(null);
    }
  }

  function onJobNoteChange(id: string, note: string) {
    if (id === activeJobId) patch({ jobNote: note });
  }

  const tabs = [
    { id: "friend" as const, title: "tabFriend", hint: "tabFriendHint" },
    { id: "client" as const, title: "tabClient", hint: "tabClientHint" },
    { id: "jobs" as const, title: "tabJobs", hint: "tabJobsHint" },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pb-24 pt-6">
      <header className="mb-1 no-print">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <Flame className="h-3.5 w-3.5" />
              {t(locale, "offlinePwa")}
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-slate-50">
              {t(locale, "appTitle")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {t(locale, "appSubtitle")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 pt-0.5">
            <CycleChip
              label={t(locale, "lang")}
              value={locale === "pl" ? "PL" : "EN"}
              onClick={() =>
                patch({ locale: locale === "pl" ? "en" : "pl" })
              }
            />
            <CycleChip
              label={t(locale, "currency")}
              value={currency === "PLN" ? "zł" : "$"}
              onClick={() =>
                patch({ currency: currency === "PLN" ? "USD" : "PLN" })
              }
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-2xl border p-2.5 text-left transition ${
                  active
                    ? "border-amber-500 bg-amber-500/15 text-amber-200"
                    : "border-slate-700 bg-slate-900 text-slate-300"
                }`}
              >
                <div className="text-xs font-semibold leading-tight sm:text-sm">
                  {t(locale, item.title)}
                </div>
                <div className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
                  {t(locale, item.hint)}
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {tab === "client" ? (
        <div className="space-y-4">
          <div className="no-print">
            <ClientLinkForm
              locale={locale}
              currency={currency}
              prices={inputs.prices}
            />
          </div>
          <div className="print-area">
            <ClientOfferPanel inputs={inputs} result={result} />
          </div>
        </div>
      ) : tab === "jobs" ? (
        <div className="no-print">
          <JobsPanel
            locale={locale}
            onEdit={editJob}
            refreshKey={jobsRefresh}
            onMutate={onJobsMutated}
            onJobNoteChange={onJobNoteChange}
          />
        </div>
      ) : (
        <>
          <div className="no-print">
            <TodayStatsBar locale={locale} jobs={todayJobs} />
          </div>

          {/* Order / structure first (shop). Onsite: rates first. */}
          {onsite ? (
            <>
              <div className="no-print">
                <PriceBooksForm
                  locale={locale}
                  value={inputs.prices}
                  onApply={(prices) => patch({ prices })}
                />
              </div>
              <div className="no-print">
                <PriceForm
                  locale={locale}
                  currency={currency}
                  value={inputs.prices}
                  onChange={(prices) => patch({ prices })}
                />
              </div>
              <div className="no-print">
                <FactorsForm
                  locale={locale}
                  value={inputs.factors}
                  onChange={(factors) => patch({ factors })}
                />
              </div>
            </>
          ) : (
            <>
              <div className="no-print">
                <PresetSelector
                  value={inputs.preset}
                  locale={locale}
                  onChange={(preset: PresetId) => patch({ preset })}
                />
              </div>

              {inputs.preset === "pipe" && (
                <div className="no-print">
                  <PipeTemplatesForm
                    locale={locale}
                    onApply={(pipe) => patch({ pipe, preset: "pipe" })}
                  />
                </div>
              )}

              <div className="no-print">
                <DimensionForm
                  preset={inputs.preset}
                  locale={locale}
                  metalType={inputs.metalType}
                  door={inputs.door}
                  gate={inputs.gate}
                  canopy={inputs.canopy}
                  free={inputs.free}
                  pipe={inputs.pipe}
                  onChange={patch}
                />
              </div>

              <div className="no-print">
                <WeldingForm
                  locale={locale}
                  value={inputs.welding}
                  onChange={(welding) => patch({ welding })}
                />
              </div>

              <div className="no-print">
                <PriceBooksForm
                  locale={locale}
                  value={inputs.prices}
                  onApply={(prices) => patch({ prices })}
                />
              </div>

              <div className="no-print">
                <ToolingForm
                  locale={locale}
                  currency={currency}
                  value={inputs.tooling}
                  onChange={(tooling) => patch({ tooling })}
                />
              </div>
            </>
          )}

          <div className="no-print">
            <SectionCard
              title={t(locale, "jobSave")}
              subtitle={
                activeJobId && activeJobName
                  ? `${t(locale, "jobEditing", { name: activeJobName })}${
                      isDirty ? ` · ${t(locale, "jobUnsaved")}` : ""
                    }`
                  : t(locale, "jobSaveHint")
              }
              icon={<Save className="h-5 w-5" />}
              collapsible
            >
              {activeJobId ? (
                <div className="mb-2 flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-slate-400 underline"
                    onClick={clearEditing}
                  >
                    {t(locale, "jobClearEdit")}
                  </button>
                </div>
              ) : null}
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder={t(locale, "jobNamePlaceholder")}
                className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <textarea
                value={inputs.jobNote}
                rows={2}
                placeholder={t(locale, "jobNotePlaceholder")}
                className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                onChange={(e) => patch({ jobNote: e.target.value })}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {activeJobId ? (
                  <button
                    type="button"
                    onClick={() => upsertJob(false)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-950 ${
                      isDirty ? "bg-rose-400" : "bg-amber-500"
                    }`}
                  >
                    <Save className="h-4 w-4" />
                    {saveFlash ? t(locale, "jobSaved") : t(locale, "jobUpdate")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => upsertJob(true)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                    activeJobId
                      ? "border border-slate-600 text-slate-100"
                      : "bg-amber-500 text-slate-950"
                  }`}
                >
                  <Save className="h-4 w-4" />
                  {saveFlash && !activeJobId
                    ? t(locale, "jobSaved")
                    : t(locale, "jobSaveAsNew")}
                </button>
              </div>
              {saveError ? (
                <p className="mt-2 text-xs font-medium text-rose-400">
                  {saveError}
                </p>
              ) : null}
            </SectionCard>
          </div>

          <div className="no-print">
            <ResultsPanel
              locale={locale}
              result={result}
              welding={inputs.welding}
              jobMode={inputs.prices.jobMode}
              laborMode={inputs.prices.laborMode}
              factors={inputs.factors}
            />
          </div>

          {!onsite && (
            <>
              <div className="no-print">
                <PriceForm
                  locale={locale}
                  currency={currency}
                  value={inputs.prices}
                  onChange={(prices) => patch({ prices })}
                />
              </div>
              <div className="no-print">
                <FactorsForm
                  locale={locale}
                  value={inputs.factors}
                  onChange={(factors) => patch({ factors })}
                />
              </div>
            </>
          )}

          <div className="print-area">
            <QuotePanel inputs={inputs} result={result} />
          </div>
        </>
      )}

      <div className="no-print">
        <InstallHint locale={locale} />
      </div>

      {tab === "friend" ? (
        <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-slate-950/95 px-4 py-3 shadow-lg backdrop-blur">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/90">
                {t(locale, "stickyTotal")}
              </div>
              <div className="truncate text-lg font-bold text-amber-200">
                {formatMoney(result.costs.clientPrice, locale, currency)}
              </div>
            </div>
            <div className="shrink-0 text-right text-sm font-semibold text-slate-200">
              {t(locale, "stickyHours", {
                hrs: formatNum(result.materials.laborHoursBilled, locale, 1),
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CycleChip({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={`${label}: ${value}`}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/15 text-sm font-bold text-amber-200 shadow-sm transition active:scale-95"
    >
      {value}
    </button>
  );
}

function InstallHint({ locale }: { locale: Locale }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos =
      /iphone|ipad|ipod/.test(ua) ||
      (ua.includes("mac") && "ontouchend" in document);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone,
      );
    if (isIos && !standalone) setIosHint(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (hidden) return null;

  if (deferred) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
        <p className="text-sm text-slate-300">{t(locale, "installHint")}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-900"
            onClick={async () => {
              await deferred.prompt();
              setDeferred(null);
            }}
          >
            {t(locale, "install")}
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-600 px-4 text-sm text-slate-400"
            onClick={() => setHidden(true)}
          >
            {t(locale, "later")}
          </button>
        </div>
      </div>
    );
  }

  if (iosHint) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
        <p className="text-sm text-slate-300">{t(locale, "installHintIos")}</p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-400"
            onClick={() => setHidden(true)}
          >
            {t(locale, "later")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
