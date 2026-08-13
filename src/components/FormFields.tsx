"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  /** Large +/- buttons (default true) */
  steppers?: boolean;
}

function clamp(n: number, min?: number, max?: number): number {
  let v = n;
  if (min !== undefined && v < min) v = min;
  if (max !== undefined && v > max) v = max;
  return v;
}

function roundToStep(n: number, step: number): number {
  if (step <= 0) return n;
  const decimals = String(step).includes(".")
    ? (String(step).split(".")[1]?.length ?? 0)
    : 0;
  const rounded = Math.round(n / step) * step;
  return Number(rounded.toFixed(decimals));
}

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 0.1,
  suffix,
  steppers = true,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(() =>
    Number.isFinite(value) ? String(value) : "",
  );
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(Number.isFinite(value) ? String(value) : "");
    }
  }, [value, focused]);

  function bump(dir: 1 | -1) {
    const base = focused
      ? parseFloat(draft.replace(",", "."))
      : value;
    const from = Number.isFinite(base) ? base : value;
    const next = clamp(roundToStep(from + dir * step, step), min, max);
    setDraft(String(next));
    onChange(next);
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
        {suffix ? (
          <span className="ml-1 text-slate-500">({suffix})</span>
        ) : null}
      </span>
      <div className={steppers ? "flex items-stretch gap-2" : undefined}>
        {steppers ? (
          <button
            type="button"
            aria-label="-"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 active:bg-slate-800"
            onClick={() => bump(-1)}
          >
            <Minus className="h-5 w-5" />
          </button>
        ) : null}
        <input
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 p-3 text-center text-base text-slate-50 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
          value={draft}
          onFocus={() => {
            setFocused(true);
            requestAnimationFrame(() => {
              const el = document.activeElement;
              if (el instanceof HTMLInputElement) el.select();
            });
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(",", ".");
            if (raw !== "" && !/^-?\d*\.?\d*$/.test(raw)) return;
            setDraft(raw);
            if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
              return;
            }
            const next = parseFloat(raw);
            if (Number.isFinite(next)) {
              onChange(clamp(next, min, max));
            }
          }}
          onBlur={() => {
            setFocused(false);
            const next = parseFloat(draft.replace(",", "."));
            const fallback = min ?? 0;
            const final = Number.isFinite(next)
              ? clamp(next, min, max)
              : fallback;
            onChange(final);
            setDraft(String(final));
          }}
        />
        {steppers ? (
          <button
            type="button"
            aria-label="+"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 active:bg-slate-800"
            onClick={() => bump(1)}
          >
            <Plus className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </label>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <select
        className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-base text-slate-50 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <div
        className={`grid gap-2 ${
          options.length === 3
            ? "grid-cols-3"
            : options.length >= 4
              ? "grid-cols-2"
              : "grid-cols-2"
        }`}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded-xl border p-3 text-sm font-semibold transition ${
                active
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
