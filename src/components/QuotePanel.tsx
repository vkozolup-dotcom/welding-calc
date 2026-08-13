"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Printer } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { t } from "@/lib/i18n";
import { buildQuoteSections, buildWhatsAppQuote } from "@/lib/quote";
import type { CalcInputs, FullResult } from "@/lib/types";

interface QuotePanelProps {
  inputs: CalcInputs;
  result: FullResult;
}

export function QuotePanel({ inputs, result }: QuotePanelProps) {
  const [copied, setCopied] = useState(false);
  const { locale } = inputs;
  const sections = buildQuoteSections(inputs, result);

  async function copyQuote() {
    const text = buildWhatsAppQuote(inputs, result, "friend");
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SectionCard
      title={t(locale, "quoteTitle")}
      subtitle={t(locale, "quoteSubtitle")}
      icon={<MessageCircle className="h-5 w-5" />}
    >
      <div className="space-y-4 text-sm print-content">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t(locale, "quoteProduct")}
          </div>
          <div className="font-semibold text-slate-100">{sections.product}</div>
          <div className="mt-1 text-xs text-slate-400">{sections.jobModeLabel}</div>
        </div>

        <DetailBlock
          title={t(locale, "quoteDimsSection")}
          rows={sections.dimensions}
        />
        <DetailBlock
          title={t(locale, "quoteTigSection")}
          rows={sections.welding}
        />
        <DetailBlock
          title={t(locale, "quoteConsumables")}
          rows={sections.consumables}
        />

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t(locale, "quoteCosts")}
          </div>
          <div className="space-y-2">
            {sections.costs.map((row) => (
              <Row
                key={row.label}
                label={row.label}
                value={row.value}
                strong={row.label === t(locale, "costTotal")}
              />
            ))}
          </div>
        </div>

        <TotalBlock
          locale={locale}
          total={sections.clientTotal}
          totalEur={sections.clientTotalEur}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 no-print sm:grid-cols-2">
        <button
          type="button"
          onClick={copyQuote}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 p-3 text-base font-bold text-slate-950 transition hover:bg-amber-400 active:scale-[0.99]"
        >
          {copied ? (
            <>
              <Check className="h-5 w-5" />
              {t(locale, "copied")}
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              {t(locale, "copyWhatsApp")}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900 p-3 text-base font-semibold text-slate-100"
        >
          <Printer className="h-5 w-5" />
          {t(locale, "printOffer")}
        </button>
      </div>
    </SectionCard>
  );
}

export function ClientOfferPanel({
  inputs,
  result,
}: {
  inputs: CalcInputs;
  result: FullResult;
}) {
  const [copied, setCopied] = useState(false);
  const { locale } = inputs;
  const sections = buildQuoteSections(inputs, result);

  async function copyQuote() {
    const text = buildWhatsAppQuote(inputs, result, "client");
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SectionCard
      title={t(locale, "clientOfferTitle")}
      subtitle={t(locale, "clientOfferSubtitle")}
      icon={<MessageCircle className="h-5 w-5" />}
    >
      <div className="space-y-4 text-sm print-content">
        <p className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-slate-300">
          {sections.jobModeLabel}
        </p>
        <DetailBlock
          title={t(locale, "quoteDimsSection")}
          rows={sections.clientRows}
        />
        <TotalBlock
          locale={locale}
          total={sections.clientTotal}
          totalEur={sections.clientTotalEur}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 no-print sm:grid-cols-2">
        <button
          type="button"
          onClick={copyQuote}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 p-3 text-base font-bold text-slate-950 transition hover:bg-amber-400 active:scale-[0.99]"
        >
          {copied ? (
            <>
              <Check className="h-5 w-5" />
              {t(locale, "copied")}
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              {t(locale, "copyClientWhatsApp")}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900 p-3 text-base font-semibold text-slate-100"
        >
          <Printer className="h-5 w-5" />
          {t(locale, "printOffer")}
        </button>
      </div>
    </SectionCard>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

function TotalBlock({
  locale,
  total,
  totalEur,
}: {
  locale: CalcInputs["locale"];
  total: string;
  totalEur: string;
}) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-amber-400/90">
        {t(locale, "clientTotal")}
      </div>
      <div className="mt-1 text-2xl font-bold text-amber-300">{total}</div>
      <div className="mt-2 border-t border-amber-500/20 pt-2 text-sm text-amber-200/90">
        {t(locale, "totalEur")}:{" "}
        <span className="font-semibold text-amber-100">{totalEur}</span>
      </div>
    </div>
  );
}

function DetailBlock({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        {rows.map((row) => (
          <Row key={`${row.label}-${row.value}`} label={row.label} value={row.value} />
        ))}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className={strong ? "font-medium text-slate-200" : "text-slate-400"}>
        {label}
      </span>
      <span
        className={`max-w-[55%] text-right ${
          strong ? "font-semibold text-slate-50" : "font-medium text-slate-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
