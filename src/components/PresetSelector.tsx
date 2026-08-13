"use client";

import { Cylinder, DoorOpen, Fence, Frame, PencilRuler } from "lucide-react";
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
  return (
    <div className="grid grid-cols-2 gap-3">
      {PRESET_IDS.map((id) => {
        const Icon = ICONS[id];
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition ${
              active
                ? "border-amber-500 bg-amber-500/15 shadow-md shadow-amber-900/20"
                : "border-slate-700 bg-slate-900 hover:border-slate-500"
            }`}
          >
            <Icon
              className={`h-6 w-6 ${active ? "text-amber-400" : "text-slate-400"}`}
            />
            <div>
              <div
                className={`text-sm font-semibold ${active ? "text-amber-200" : "text-slate-100"}`}
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
  );
}
