"use client";

import { LayoutTemplate } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { PIPE_TEMPLATES } from "@/lib/pipeTemplates";
import { t } from "@/lib/i18n";
import type { Locale, PipeParams } from "@/lib/types";

interface PipeTemplatesFormProps {
  locale: Locale;
  onApply: (pipe: PipeParams) => void;
}

export function PipeTemplatesForm({
  locale,
  onApply,
}: PipeTemplatesFormProps) {
  return (
    <SectionCard
      title={t(locale, "tplTitle")}
      subtitle={t(locale, "tplSubtitle")}
      icon={<LayoutTemplate className="h-5 w-5" />}
    >
      <div className="grid grid-cols-2 gap-2">
        {PIPE_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onApply(structuredClone(tpl.pipe))}
            className="rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-left transition hover:border-amber-500/50"
          >
            <div className="text-sm font-semibold text-slate-100">
              {t(locale, tpl.titleKey)}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              {t(locale, tpl.descKey)}
            </div>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
