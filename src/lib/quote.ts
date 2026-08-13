import {
  formatEur,
  formatMoney,
  formatNum,
  PIPE_MEDIA_KEY,
  PRESET_TITLE_KEY,
  WELD_TYPE_KEY,
  t,
  type TranslationKey,
} from "./i18n";
import type { CalcInputs, FullResult } from "./types";
import { pipeJointCount, segmentJointCount } from "./calculations";
import { PROFILES } from "./constants";

export { formatEur, formatMoney, formatNum };

export interface QuoteRow {
  label: string;
  value: string;
}

export interface QuoteSections {
  product: string;
  jobModeLabel: string;
  dimensions: QuoteRow[];
  welding: QuoteRow[];
  consumables: QuoteRow[];
  costs: QuoteRow[];
  clientRows: QuoteRow[];
  clientTotal: string;
  clientTotalEur: string;
}

function profileLabel(profileId: string, locale: CalcInputs["locale"]): string {
  const p = PROFILES.find((x) => x.id === profileId);
  if (!p) return profileId;
  const kind =
    p.kind === "pipe" ? t(locale, "profilePipe") : t(locale, "profileBox");
  return `${kind} ${p.label} (${p.kgPerMeter} kg/m)`;
}

function fillKey(fill: CalcInputs["door"]["fill"]): TranslationKey {
  if (fill === "sheet") return "fillSheet";
  if (fill === "bars") return "fillBars";
  return "fillNone";
}

export function buildQuoteSections(
  inputs: CalcInputs,
  result: FullResult,
): QuoteSections {
  const { locale, currency, prices, tooling, factors } = inputs;
  const { materials: m, costs: c } = result;
  const onsite = prices.jobMode === "onsite";
  const n = (v: number, d = 2) => formatNum(v, locale, d);
  const money = (v: number) => formatMoney(v, locale, currency);
  const unitM = t(locale, "meters");
  const unitKg = t(locale, "kg");
  const prepPct = factors.prepWorkPercent;
  const cutPct = factors.cutWastePercent;

  const dimensions: QuoteRow[] = onsite
    ? []
    : [
        {
          label: t(locale, "metalType"),
          value: t(
            locale,
            inputs.metalType === "stainless" ? "metalStainless" : "metalMild",
          ),
        },
      ];

  if (!onsite) {
  switch (inputs.preset) {
    case "pipe": {
      dimensions.push({
        label: t(locale, "pipeMedia"),
        value: t(locale, PIPE_MEDIA_KEY[inputs.pipe.media]),
      });
      for (const [idx, seg] of inputs.pipe.segments.entries()) {
        dimensions.push(
          {
            label: t(locale, "pipeSegment", { n: idx + 1 }),
            value: profileLabel(seg.profileId, locale),
          },
          {
            label: `${t(locale, "pipeRunLength")} (#${idx + 1})`,
            value: `${n(seg.lengthM)} ${unitM}`,
          },
          {
            label: `${t(locale, "pipeJointsTotal")} (#${idx + 1})`,
            value: n(segmentJointCount(seg), 0),
          },
        );
      }
      dimensions.push({
        label: t(locale, "pipeJointsTotal"),
        value: n(pipeJointCount(inputs.pipe), 0),
      });
      break;
    }
    case "door": {
      dimensions.push(
        { label: t(locale, "height"), value: `${n(inputs.door.heightM)} ${unitM}` },
        { label: t(locale, "width"), value: `${n(inputs.door.widthM)} ${unitM}` },
        {
          label: t(locale, "frameProfile"),
          value: profileLabel(inputs.door.profileId, locale),
        },
        { label: t(locale, "fill"), value: t(locale, fillKey(inputs.door.fill)) },
      );
      break;
    }
    case "gate": {
      dimensions.push(
        {
          label: t(locale, "gateType"),
          value: t(
            locale,
            inputs.gate.gateType === "swing" ? "gateSwing" : "gateSliding",
          ),
        },
        { label: t(locale, "height"), value: `${n(inputs.gate.heightM)} ${unitM}` },
        { label: t(locale, "width"), value: `${n(inputs.gate.widthM)} ${unitM}` },
      );
      if (inputs.gate.gateType === "swing") {
        dimensions.push({
          label: t(locale, "leaves"),
          value: t(locale, inputs.gate.leaves === 1 ? "leaf1" : "leaf2"),
        });
      }
      dimensions.push({
        label: t(locale, "profile"),
        value: profileLabel(inputs.gate.profileId, locale),
      });
      break;
    }
    case "canopy": {
      dimensions.push(
        { label: t(locale, "length"), value: `${n(inputs.canopy.lengthM)} ${unitM}` },
        { label: t(locale, "width"), value: `${n(inputs.canopy.widthM)} ${unitM}` },
        { label: t(locale, "height"), value: `${n(inputs.canopy.heightM)} ${unitM}` },
        {
          label: t(locale, "crossStep"),
          value: `${n(inputs.canopy.crossStepM)} ${unitM}`,
        },
        {
          label: t(locale, "profile"),
          value: profileLabel(inputs.canopy.profileId, locale),
        },
      );
      break;
    }
    case "free": {
      dimensions.push(
        {
          label: t(locale, "weldLength"),
          value: `${n(inputs.free.weldLengthM)} ${unitM}`,
        },
        {
          label: t(locale, "profileLength"),
          value: `${n(inputs.free.profileLengthM)} ${unitM}`,
        },
        {
          label: t(locale, "profileForWeight"),
          value: profileLabel(inputs.free.profileId, locale),
        },
      );
      break;
    }
  }
  }

  const gasLabel =
    inputs.welding.gasType === "argon"
      ? t(locale, "gasArgon")
      : t(locale, "gasArHe");

  const welding: QuoteRow[] = onsite
    ? [
        {
          label: t(locale, "manualHours"),
          value: `${n(m.laborHoursBase)} h`,
        },
        {
          label: t(locale, "prepWork", { pct: prepPct }),
          value: `+${n(m.laborHoursPrep)} h`,
        },
        {
          label: t(locale, "hoursWithPrep"),
          value: `${n(m.laborHoursBilled)} h`,
        },
      ]
    : [
        {
          label: t(locale, "weldJointType"),
          value: t(locale, WELD_TYPE_KEY[inputs.welding.weldJointType]),
        },
        {
          label: t(locale, "rodDiameter"),
          value: `Ø ${inputs.welding.rodDiameter} mm`,
        },
        { label: t(locale, "shieldingGas"), value: gasLabel },
        {
          label: t(locale, "gasFlow"),
          value: `${n(inputs.welding.gasFlowLpm, 0)} ${t(locale, "lpm")}`,
        },
      ];

  const consumables: QuoteRow[] = [];
  if (!onsite) {
    consumables.push(
      {
        label: t(locale, "quoteProfileRaw"),
        value: `${n(m.profileLengthRawM)} ${unitM}`,
      },
      {
        label: t(locale, "quoteProfileWaste", { pct: n(cutPct, 0) }),
        value: `${n(m.profileLengthWithWasteM)} ${unitM}`,
      },
      {
        label: t(locale, "quoteWeightLineShort"),
        value: `${n(m.weightKg)} ${unitKg}`,
      },
      {
        label: t(locale, "quoteWeldLineShort"),
        value: `${n(m.weldLengthM)} ${unitM} (${n(m.weldLengthCm, 0)} ${t(locale, "cm")})`,
      },
      {
        label: t(locale, "quoteDeposited"),
        value: `${n(m.depositedMetalKg)} ${unitKg}`,
      },
      {
        label: t(locale, "quoteRodConsume"),
        value: `${n(m.fillerKg)} ${unitKg} (Ø ${inputs.welding.rodDiameter})`,
      },
      {
        label: t(locale, "quoteGasConsume"),
        value: `${n(m.gasLiters, 0)} l (${gasLabel})`,
      },
      {
        label: t(locale, "quoteCylinderShare"),
        value: `${n(m.gasCylinderFraction * 100, 1)}%`,
      },
      {
        label: t(locale, "quoteWeldTime"),
        value: `${n(m.weldingTimeMin, 0)} min`,
      },
    );
  }
  if (!onsite) {
    // Hours already listed under TIG section for onsite
    if (prices.laborMode === "hour") {
      consumables.push(
        {
          label: t(locale, "manualHours"),
          value: `${n(m.laborHoursBase)} h`,
        },
        {
          label: t(locale, "prepWork", { pct: prepPct }),
          value: `+${n(m.laborHoursPrep)} h`,
        },
        {
          label: t(locale, "hoursWithPrep"),
          value: `${n(m.laborHoursBilled)} h`,
        },
      );
    }
  }
  if (tooling.grindingDiscsQty > 0) {
    consumables.push({
      label: t(locale, "grindingDiscs"),
      value: `${n(tooling.grindingDiscsQty, 0)} ${t(locale, "pcs")}`,
    });
  }
  if (tooling.cuttingDiscsQty > 0) {
    consumables.push({
      label: t(locale, "cuttingDiscs"),
      value: `${n(tooling.cuttingDiscsQty, 0)} ${t(locale, "pcs")}`,
    });
  }
  if (tooling.abrasiveWheelsQty > 0) {
    consumables.push({
      label: t(locale, "abrasiveWheels"),
      value: `${n(tooling.abrasiveWheelsQty, 0)} ${t(locale, "pcs")}`,
    });
  }
  if (tooling.millsQty > 0) {
    consumables.push({
      label: t(locale, "mills"),
      value: `${n(tooling.millsQty, 0)} ${t(locale, "pcs")}`,
    });
  }

  const costs: QuoteRow[] = [];
  if (!onsite) {
    costs.push(
      { label: t(locale, "metal"), value: money(c.metalCost) },
      { label: t(locale, "filler"), value: money(c.fillerCost) },
      { label: t(locale, "gas"), value: money(c.gasCost) },
    );
  }

  if (onsite || prices.laborMode === "hour") {
    costs.push({
      label: t(locale, "labor", { hrs: n(m.laborHoursBilled) }),
      value: money(c.laborCost),
    });
  } else {
    costs.push({
      label: t(locale, "weldSeam", { cm: n(m.weldLengthCm, 0) }),
      value: money(c.weldSeamCost),
    });
  }

  if (c.grindingDiscsCost > 0) {
    costs.push({
      label: t(locale, "grindingDiscsCost"),
      value: money(c.grindingDiscsCost),
    });
  }
  if (c.cuttingDiscsCost > 0) {
    costs.push({
      label: t(locale, "cuttingDiscsCost"),
      value: money(c.cuttingDiscsCost),
    });
  }
  if (c.abrasiveWheelsCost > 0) {
    costs.push({
      label: t(locale, "abrasiveWheelsCost"),
      value: money(c.abrasiveWheelsCost),
    });
  }
  if (c.millsCost > 0) {
    costs.push({
      label: t(locale, "millsCost"),
      value: money(c.millsCost),
    });
  }

  costs.push(
    { label: t(locale, "costTotal"), value: money(c.costTotal) },
  );

  if (prices.deliveryEnabled) {
    costs.push({
      label: t(locale, "deliveryPrice"),
      value: money(c.deliveryCost),
    });
  }

  if (prices.invoiceEnabled) {
    costs.push({
      label: t(locale, "vat", { pct: n(prices.vatPercent, 0) }),
      value: money(c.vatAmount),
    });
  }

  costs.push(
    { label: t(locale, "grossTotal"), value: money(c.clientPrice) },
  );

  const product =
    inputs.preset === "pipe"
      ? `${t(locale, PRESET_TITLE_KEY.pipe)} — ${t(locale, PIPE_MEDIA_KEY[inputs.pipe.media])}`
      : t(locale, PRESET_TITLE_KEY[inputs.preset]);

  const clientRows: QuoteRow[] = [
    {
      label: t(locale, "quoteProduct"),
      value: product,
    },
    ...dimensions,
  ];
  if (!onsite) {
    if (c.metalCost > 0) {
      clientRows.push({ label: t(locale, "metal"), value: money(c.metalCost) });
    }
    if (c.fillerCost > 0) {
      clientRows.push({
        label: t(locale, "filler"),
        value: money(c.fillerCost),
      });
    }
    if (c.gasCost > 0) {
      clientRows.push({ label: t(locale, "gas"), value: money(c.gasCost) });
    }
  }
  if (onsite || prices.laborMode === "hour") {
    clientRows.push({
      label: t(locale, "labor", { hrs: n(m.laborHoursBilled) }),
      value: money(c.laborCost),
    });
  } else {
    clientRows.push({
      label: t(locale, "weldSeam", { cm: n(m.weldLengthCm, 0) }),
      value: money(c.weldSeamCost),
    });
  }
  if (c.toolingCost > 0) {
    clientRows.push({
      label: t(locale, "toolingCost"),
      value: money(c.toolingCost),
    });
  }
  if (prices.deliveryEnabled && c.deliveryCost > 0) {
    clientRows.push({
      label: t(locale, "deliveryPrice"),
      value: money(c.deliveryCost),
    });
  }
  if (prices.invoiceEnabled) {
    clientRows.push({
      label: t(locale, "vat", { pct: n(prices.vatPercent, 0) }),
      value: money(c.vatAmount),
    });
  }
  clientRows.push({
    label: t(locale, "invoiceToggle"),
    value: t(
      locale,
      prices.invoiceEnabled ? "invoiceOnShort" : "invoiceOffShort",
    ),
  });

  return {
    product,
    jobModeLabel: t(locale, onsite ? "clientJobOnsite" : "clientJobFull"),
    dimensions,
    welding,
    consumables,
    costs,
    clientRows,
    clientTotal: money(c.clientPrice),
    clientTotalEur: formatEur(c.clientPriceEur, locale),
  };
}

export function buildWhatsAppQuote(
  inputs: CalcInputs,
  result: FullResult,
  mode: "friend" | "client" = "friend",
): string {
  const locale = inputs.locale;
  const s = buildQuoteSections(inputs, result);

  const block = (title: string, rows: QuoteRow[]) =>
    rows.length === 0
      ? []
      : [`*${title}:*`, ...rows.map((r) => `• ${r.label}: ${r.value}`)];

  if (mode === "client") {
    return [
      `🔧 *${t(locale, "quoteHeaderClient")}*`,
      "",
      `📦 ${s.jobModeLabel}`,
      "",
      ...block(t(locale, "clientOfferTitle"), s.clientRows),
      "",
      `💰 *${t(locale, "quoteClient")}: ${s.clientTotal}*`,
      `💶 *${t(locale, "totalEur")}: ${s.clientTotalEur}*`,
    ].join("\n");
  }

  return [
    `🔧 *${t(locale, "quoteHeader")}*`,
    "",
    `📦 *${t(locale, "quoteProduct")}:* ${s.product}`,
    `📍 ${s.jobModeLabel}`,
    "",
    ...block(t(locale, "quoteDimsSection"), s.dimensions),
    "",
    ...block(t(locale, "quoteTigSection"), s.welding),
    "",
    ...block(t(locale, "quoteConsumables"), s.consumables),
    "",
    ...block(t(locale, "quoteCosts"), s.costs),
    "",
    `💰 *${t(locale, "quoteClient")}: ${s.clientTotal}*`,
    `💶 *${t(locale, "totalEur")}: ${s.clientTotalEur}*`,
  ].join("\n");
}
