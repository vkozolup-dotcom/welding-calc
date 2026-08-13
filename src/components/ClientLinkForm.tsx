"use client";

import { useEffect, useState, type HTMLAttributes } from "react";
import { Check, Copy, ExternalLink, Link2, RefreshCw } from "lucide-react";
import { NumberField, Segmented } from "@/components/FormFields";
import { SectionCard } from "@/components/SectionCard";
import {
  buildClientShareUrl,
  profileFromPrices,
  type PublicClientProfile,
} from "@/lib/clientProfile";
import { currencySymbol, t } from "@/lib/i18n";
import { loadPublicProfile, savePublicProfile } from "@/lib/storage";
import { shareOrSendText } from "@/lib/share";
import type { Currency, Locale, PriceParams } from "@/lib/types";

interface ClientLinkFormProps {
  locale: Locale;
  currency: Currency;
  prices: PriceParams;
}

export function ClientLinkForm({
  locale,
  currency,
  prices,
}: ClientLinkFormProps) {
  const [profile, setProfile] = useState<PublicClientProfile>(() =>
    loadPublicProfile(),
  );
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const saved = loadPublicProfile();
    setProfile({
      ...saved,
      currency,
      locale,
      hourPrice:
        saved.hourPrice > 0 ? saved.hourPrice : Math.max(0, prices.laborHourPrice),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(partial: Partial<PublicClientProfile>) {
    setProfile((prev) => {
      const next = { ...prev, ...partial, v: 2 as const, locale, currency };
      savePublicProfile(next);
      return next;
    });
  }

  function syncFromPrices() {
    const next = profileFromPrices(prices, profile, locale, currency);
    setProfile(next);
    savePublicProfile(next);
    setFlash(t(locale, "clientLinkSynced"));
    setTimeout(() => setFlash(""), 1600);
  }

  function clientUrl(): string {
    if (typeof window === "undefined") return "";
    return buildClientShareUrl(window.location.origin, {
      ...profile,
      currency,
      locale,
    });
  }

  async function copyLink() {
    const url = clientUrl();
    const outcome = await shareOrSendText(url, t(locale, "clientLinkTitle"));
    if (outcome === "cancelled") return;
    setFlash(
      outcome === "failed"
        ? t(locale, "copyFailed")
        : t(locale, "clientLinkCopied"),
    );
    setTimeout(() => setFlash(""), 1800);
  }

  function openLink() {
    window.open(clientUrl(), "_blank", "noopener,noreferrer");
  }

  const sym = currencySymbol(currency);

  return (
    <SectionCard
      title={t(locale, "clientLinkTitle")}
      subtitle={t(locale, "clientLinkSubtitle")}
      icon={<Link2 className="h-5 w-5" />}
      collapsible
      defaultOpen
    >
      <p className="mb-3 text-xs text-slate-400">{t(locale, "clientLinkHint")}</p>
      <div className="space-y-3">
        <TextField
          label={t(locale, "clientLinkName")}
          value={profile.displayName}
          onChange={(displayName) => update({ displayName })}
          placeholder="TIG Pro / Jan K."
        />
        <TextField
          label={t(locale, "clientLinkPhone")}
          value={profile.phone}
          onChange={(phone) => update({ phone })}
          placeholder="+48 …"
          inputMode="tel"
        />
        <TextField
          label={t(locale, "clientLinkEmail")}
          value={profile.email}
          onChange={(email) => update({ email })}
          placeholder="mail@…"
          inputMode="email"
        />
        <TextField
          label={t(locale, "clientLinkWhatsApp")}
          value={profile.whatsapp}
          onChange={(whatsapp) => update({ whatsapp })}
          placeholder="+48 …"
        />
        <TextField
          label={t(locale, "clientLinkFacebook")}
          value={profile.facebook}
          onChange={(facebook) => update({ facebook })}
          placeholder="https://facebook.com/…"
        />
        <TextField
          label={t(locale, "clientLinkInstagram")}
          value={profile.instagram}
          onChange={(instagram) => update({ instagram })}
          placeholder="@nick"
        />

        <button
          type="button"
          onClick={syncFromPrices}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t(locale, "clientLinkSyncPrices")}
        </button>

        <NumberField
          label={t(locale, "clientLinkHourPrice")}
          suffix={sym}
          value={profile.hourPrice}
          step={5}
          onChange={(hourPrice) => update({ hourPrice })}
        />
        <NumberField
          label={t(locale, "priceProfile")}
          suffix={`${sym}${t(locale, "perMeter")}`}
          value={profile.profilePricePerM}
          step={1}
          onChange={(profilePricePerM) => update({ profilePricePerM })}
        />
        <NumberField
          label={t(locale, "rodPack")}
          suffix={sym}
          value={profile.rodPackPrice}
          step={5}
          onChange={(rodPackPrice) => update({ rodPackPrice })}
        />
        <NumberField
          label={t(locale, "gasRefill")}
          suffix={sym}
          value={profile.gasRefillPrice}
          step={10}
          onChange={(gasRefillPrice) => update({ gasRefillPrice })}
        />
        <Segmented<"hour" | "per_cm">
          label={t(locale, "laborPayMode")}
          value={profile.laborMode}
          onChange={(laborMode) => update({ laborMode })}
          options={[
            { value: "hour", label: t(locale, "laborModeHour") },
            { value: "per_cm", label: t(locale, "laborModeCm") },
          ]}
        />
        {profile.laborMode === "per_cm" ? (
          <NumberField
            label={t(locale, "weldPerCm")}
            suffix={`${sym}${t(locale, "perCm")}`}
            value={profile.weldPricePerCm}
            step={0.1}
            onChange={(weldPricePerCm) => update({ weldPricePerCm })}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2.5 text-sm font-semibold text-slate-950"
          >
            {flash ? (
              <>
                <Check className="h-4 w-4" />
                {flash}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {t(locale, "clientLinkCopy")}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={openLink}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-600 px-3 py-2.5 text-sm font-semibold text-slate-100"
          >
            <ExternalLink className="h-4 w-4" />
            {t(locale, "clientLinkOpen")}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <input
        type="text"
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
      />
    </label>
  );
}
