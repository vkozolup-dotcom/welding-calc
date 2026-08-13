"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  /** When true, header toggles body visibility */
  collapsible?: boolean;
  /** Initial open state for collapsible cards (default true) */
  defaultOpen?: boolean;
}

export function SectionCard({
  title,
  subtitle,
  icon,
  children,
  collapsible = false,
  defaultOpen = true,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  const headerInner = (
    <>
      {icon ? (
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {collapsible ? (
        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      ) : null}
    </>
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-black/20">
      {collapsible ? (
        <button
          type="button"
          className="mb-0 flex w-full items-start gap-3 text-left"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {headerInner}
        </button>
      ) : (
        <header className="mb-4 flex items-start gap-3">{headerInner}</header>
      )}

      {collapsible ? (
        open ? (
          <div id={panelId} className="mt-4">
            {children}
          </div>
        ) : null
      ) : (
        children
      )}
    </section>
  );
}
