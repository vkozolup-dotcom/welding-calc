"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Flame,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Share2,
} from "lucide-react";
import { NumberField } from "@/components/FormFields";
import {
  mailHref,
  readProfileFromLocation,
  socialHref,
  telHref,
  whatsappHref,
  type PublicClientProfile,
} from "@/lib/clientProfile";
import { formatMoney, formatNum, t } from "@/lib/i18n";

export function ClientPublicPage() {
  const [profile, setProfile] = useState<PublicClientProfile | null>(null);
  const [hours, setHours] = useState(4);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProfile(
      readProfileFromLocation(window.location.hash, window.location.search),
    );
    setReady(true);

    const onHash = () => {
      setProfile(
        readProfileFromLocation(window.location.hash, window.location.search),
      );
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const locale = profile?.locale ?? "pl";
  const currency = profile?.currency ?? "PLN";
  const total = useMemo(
    () => Math.max(0, hours) * Math.max(0, profile?.hourPrice ?? 0),
    [hours, profile?.hourPrice],
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-sm text-slate-400">
        …
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-10">
        <Brand />
        <p className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
          {t(locale, "clientPageMissing")}
        </p>
      </div>
    );
  }

  const phone = telHref(profile.phone);
  const mail = mailHref(profile.email);
  const wa = whatsappHref(profile.whatsapp || profile.phone);
  const fb = socialHref(profile.facebook);
  const ig = socialHref(profile.instagram);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pb-10 pt-6">
      <Brand />
      {profile.displayName ? (
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-50">
          {profile.displayName}
        </h1>
      ) : null}
      <div>
        <h2 className="text-lg font-semibold text-slate-100">
          {t(locale, "clientPageTitle")}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {t(locale, "clientPageSubtitle")}
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <NumberField
          label={t(locale, "clientPageHours")}
          value={hours}
          step={0.5}
          min={0.5}
          max={200}
          suffix="h"
          onChange={setHours}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">{t(locale, "clientPageRate")}</span>
          <span className="font-semibold text-slate-100">
            {formatMoney(profile.hourPrice, locale, currency)}
          </span>
        </div>
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-amber-400/90">
            {t(locale, "clientPageTotal")}
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-300">
            {formatMoney(total, locale, currency)}
          </div>
          <div className="mt-1 text-xs text-amber-200/80">
            {formatNum(hours, locale, 1)} h ×{" "}
            {formatMoney(profile.hourPrice, locale, currency)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-100">
          {t(locale, "clientPageContacts")}
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {phone ? (
            <ContactBtn href={phone} icon={<Phone className="h-4 w-4" />}>
              {t(locale, "clientPageCall")}
            </ContactBtn>
          ) : null}
          {mail ? (
            <ContactBtn href={mail} icon={<Mail className="h-4 w-4" />}>
              {t(locale, "clientPageMail")}
            </ContactBtn>
          ) : null}
          {wa ? (
            <ContactBtn href={wa} icon={<MessageCircle className="h-4 w-4" />}>
              {t(locale, "clientPageWhatsApp")}
            </ContactBtn>
          ) : null}
          {fb ? (
            <ContactBtn href={fb} icon={<Globe className="h-4 w-4" />}>
              {t(locale, "clientPageFacebook")}
            </ContactBtn>
          ) : null}
          {ig ? (
            <ContactBtn href={ig} icon={<Share2 className="h-4 w-4" />}>
              {t(locale, "clientPageInstagram")}
            </ContactBtn>
          ) : null}
        </div>
        {!phone && !mail && !wa && !fb && !ig ? (
          <p className="text-sm text-slate-500">—</p>
        ) : null}
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
      <Flame className="h-3.5 w-3.5" />
      TIG · estimate
    </div>
  );
}

function ContactBtn({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-amber-500/50"
    >
      {icon}
      {children}
    </a>
  );
}
