"use client";

import { useEffect, useState, type HTMLAttributes } from "react";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import {
  buildClientShareUrl,
  profileFromPrices,
  type PublicClientProfile,
} from "@/lib/clientProfile";
import { currencySymbol, t } from "@/lib/i18n";
import {
  loadPriceBooks,
  loadPublicProfile,
  savePublicProfile,
} from "@/lib/storage";
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
    setProfile(profileFromPrices(sharePrices(), saved, locale, currency));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep public rates aligned with shop Prices (contacts stay as edited)
  useEffect(() => {
    setProfile((prev) => {
      const next = profileFromPrices(sharePrices(), prev, locale, currency);
      savePublicProfile(next);
      return next;
    });
  }, [prices, locale, currency]);

  function update(partial: Partial<PublicClientProfile>) {
    setProfile((prev) => {
      const next = { ...prev, ...partial, v: 2 as const, locale, currency };
      savePublicProfile(next);
      return next;
    });
  }

  /** Shop rates for the public link — never onsite-forced hour billing */
  function sharePrices(): PriceParams {
    if (prices.jobMode !== "onsite") return prices;
    const shop = loadPriceBooks().shop;
    if (!shop) {
      return {
        ...prices,
        jobMode: "full",
        laborMode: prices.shopLaborMode,
        useManualHours: false,
      };
    }
    return {
      ...prices,
      jobMode: "full",
      laborMode: shop.shopLaborMode || shop.laborMode,
      shopLaborMode: shop.shopLaborMode || shop.laborMode,
      laborHourPrice: shop.laborHourPrice,
      weldPricePerCm: shop.weldPricePerCm,
      useManualHours: false,
    };
  }

  /** Always embed the latest Prices + contacts into the share URL */
  function liveProfile(): PublicClientProfile {
    return profileFromPrices(sharePrices(), profile, locale, currency);
  }

  async function copyLink() {
    const next = liveProfile();
    setProfile(next);
    savePublicProfile(next);
    const url = buildClientShareUrl(window.location.origin, next);
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
    const next = liveProfile();
    setProfile(next);
    savePublicProfile(next);
    window.open(
      buildClientShareUrl(window.location.origin, next),
      "_blank",
      "noopener,noreferrer",
    );
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

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
          <div className="mb-1.5 font-semibold text-slate-200">
            {t(locale, "clientLinkRatesFromPrices")}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">{t(locale, "laborPayMode")}</span>
              <span>
                {prices.laborMode === "per_cm"
                  ? t(locale, "laborModeCm")
                  : t(locale, "laborModeHour")}
              </span>
            </div>
            {prices.laborMode === "per_cm" ? (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{t(locale, "weldPerCm")}</span>
                <span>
                  {prices.weldPricePerCm} {sym}
                  {t(locale, "perCm")}
                </span>
              </div>
            ) : (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">
                  {t(locale, "clientLinkHourPrice")}
                </span>
                <span>
                  {prices.laborHourPrice} {sym}
                  {t(locale, "perHour")}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">
                {t(locale, "priceProfileMild")}
              </span>
              <span>
                {prices.profilePricePerMMild} {sym}
                {t(locale, "perMeter")}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">
                {t(locale, "priceProfileStainless")}
              </span>
              <span>
                {prices.profilePricePerMStainless} {sym}
                {t(locale, "perMeter")}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">{t(locale, "rodPack")}</span>
              <span>
                {prices.rodPackPrice} {sym}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">{t(locale, "gasRefill")}</span>
              <span>
                {prices.gasRefillPrice} {sym}
              </span>
            </div>
          </div>
        </div>

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
