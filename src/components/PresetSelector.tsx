"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  Cylinder,
  DoorOpen,
  Fence,
  Frame,
  PencilRuler,
  X,
} from "lucide-react";
import { PRESET_IDS } from "@/lib/constants";
import { PRESET_DESC_KEY, PRESET_TITLE_KEY, t } from "@/lib/i18n";
import type { Locale, PresetId } from "@/lib/types";

const ICONS: Record<PresetId, typeof DoorOpen> = {
  pipe: Cylinder,
  door: DoorOpen,
  gate: Fence,
  canopy: Frame,
  free: PencilRuler,
};

interface PresetSelectorProps {
  value: PresetId;
  locale: Locale;
  onChange: (preset: PresetId) => void;
}

export function PresetSelector({
  value,
  locale,
  onChange,
}: PresetSelectorProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const ActiveIcon = ICONS[value];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  return (
    <div className="no-print">
      <div className="mb-1.5 text-xs font-medium text-slate-400">
        {t(locale, "presetPickerLabel")}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 px-3 py-3 text-left transition active:scale-[0.99]"
      >
        <ActiveIcon className="h-6 w-6 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-amber-100">
            {t(locale, PRESET_TITLE_KEY[value])}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            {t(locale, PRESET_DESC_KEY[value])}
          </div>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-amber-300/80" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-2xl outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <h2
                id={titleId}
                className="text-sm font-semibold text-slate-100"
              >
                {t(locale, "presetPickerTitle")}
              </h2>
              <button
                type="button"
                className="rounded-full border border-slate-700 p-1.5 text-slate-400"
                aria-label={t(locale, "presetPickerClose")}
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid max-h-[70dvh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {PRESET_IDS.map((id) => {
                const Icon = ICONS[id];
                const active = value === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-amber-500 bg-amber-500/15"
                        : "border-slate-700 bg-slate-900 hover:border-slate-500"
                    }`}
                  >
                    <Icon
                      className={`mt-0.5 h-5 w-5 shrink-0 ${
                        active ? "text-amber-400" : "text-slate-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-semibold ${
                          active ? "text-amber-200" : "text-slate-100"
                        }`}
                      >
                        {t(locale, PRESET_TITLE_KEY[id])}
                      </div>
                      <div className="mt-0.5 text-xs leading-snug text-slate-400">
                        {t(locale, PRESET_DESC_KEY[id])}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
