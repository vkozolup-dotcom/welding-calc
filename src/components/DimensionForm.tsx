"use client";

import { Plus, Ruler, Trash2 } from "lucide-react";
import { NumberField, Segmented, SelectField } from "@/components/FormFields";
import { SectionCard } from "@/components/SectionCard";
import { pipeJointCount, segmentJointCount } from "@/lib/calculations";
import { PROFILES } from "@/lib/constants";
import { createPipeSegment } from "@/lib/defaults";
import { PIPE_MEDIA_KEY, formatNum, t } from "@/lib/i18n";
import type {
  CalcInputs,
  CanopyParams,
  DoorFill,
  DoorParams,
  FreeParams,
  GateParams,
  GateType,
  Locale,
  MetalType,
  PipeMedia,
  PipeParams,
  PipeSegment,
  PresetId,
} from "@/lib/types";

interface DimensionFormProps {
  preset: PresetId;
  locale: Locale;
  metalType: MetalType;
  door: DoorParams;
  gate: GateParams;
  canopy: CanopyParams;
  free: FreeParams;
  pipe: PipeParams;
  onChange: (patch: Partial<CalcInputs>) => void;
}

export function DimensionForm({
  preset,
  locale,
  metalType,
  door,
  gate,
  canopy,
  free,
  pipe,
  onChange,
}: DimensionFormProps) {
  const allProfiles = PROFILES.map((p) => {
    const kindLabel =
      p.kind === "pipe" ? t(locale, "profilePipe") : t(locale, "profileBox");
    return {
      value: p.id,
      label: `${kindLabel}: ${p.label} · ${p.kgPerMeter} ${t(locale, "kgPerM")}`,
    };
  });
  const pipeProfiles = PROFILES.filter((p) => p.kind === "pipe").map((p) => ({
    value: p.id,
    label: `${p.label} · ${p.kgPerMeter} ${t(locale, "kgPerM")}`,
  }));
  const m = t(locale, "meters");
  const jointsTotal = pipeJointCount(pipe);

  function setPipe(next: PipeParams) {
    onChange({ pipe: next });
  }

  function updateSegment(id: string, patch: Partial<PipeSegment>) {
    setPipe({
      ...pipe,
      segments: pipe.segments.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    });
  }

  return (
    <SectionCard
      title={t(locale, "dimsTitle")}
      subtitle={t(locale, "dimsSubtitle")}
      icon={<Ruler className="h-5 w-5" />}
    >
      <div className="mb-3 space-y-3">
        <Segmented<MetalType>
          label={t(locale, "metalType")}
          value={metalType}
          onChange={(next) => onChange({ metalType: next })}
          options={[
            { value: "mild", label: t(locale, "metalMild") },
            { value: "stainless", label: t(locale, "metalStainless") },
          ]}
        />
      </div>

      {preset === "pipe" && (
        <div className="space-y-3">
          <Segmented<PipeMedia>
            label={t(locale, "pipeMedia")}
            value={pipe.media}
            onChange={(media) => setPipe({ ...pipe, media })}
            options={[
              { value: "water", label: t(locale, PIPE_MEDIA_KEY.water) },
              {
                value: "hydraulic",
                label: t(locale, PIPE_MEDIA_KEY.hydraulic),
              },
              { value: "air", label: t(locale, PIPE_MEDIA_KEY.air) },
            ]}
          />

          {pipe.segments.map((seg, idx) => (
            <div
              key={seg.id}
              className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-200">
                  {t(locale, "pipeSegment", { n: idx + 1 })}
                </div>
                {pipe.segments.length > 1 ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400"
                    onClick={() =>
                      setPipe({
                        ...pipe,
                        segments: pipe.segments.filter((s) => s.id !== seg.id),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t(locale, "pipeRemoveSegment")}
                  </button>
                ) : null}
              </div>

              <SelectField
                label={t(locale, "pipeSize")}
                value={seg.profileId}
                options={pipeProfiles}
                onChange={(profileId) => updateSegment(seg.id, { profileId })}
              />
              <NumberField
                label={t(locale, "pipeRunLength")}
                suffix={m}
                value={seg.lengthM}
                step={0.5}
                onChange={(lengthM) => updateSegment(seg.id, { lengthM })}
              />
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label={t(locale, "pipeButtJoints")}
                  suffix={t(locale, "pcs")}
                  value={seg.buttJoints}
                  step={1}
                  min={0}
                  onChange={(buttJoints) =>
                    updateSegment(seg.id, { buttJoints })
                  }
                />
                <NumberField
                  label={t(locale, "pipeElbows")}
                  suffix={t(locale, "pcs")}
                  value={seg.elbows}
                  step={1}
                  min={0}
                  onChange={(elbows) => updateSegment(seg.id, { elbows })}
                />
                <NumberField
                  label={t(locale, "pipeTees")}
                  suffix={t(locale, "pcs")}
                  value={seg.tees}
                  step={1}
                  min={0}
                  onChange={(tees) => updateSegment(seg.id, { tees })}
                />
                <NumberField
                  label={t(locale, "pipeFlanges")}
                  suffix={t(locale, "pcs")}
                  value={seg.flanges}
                  step={1}
                  min={0}
                  onChange={(flanges) => updateSegment(seg.id, { flanges })}
                />
              </div>
              <p className="text-xs text-slate-500">
                {t(locale, "pipeJointsTotal")}:{" "}
                {formatNum(segmentJointCount(seg), locale, 0)}
              </p>
            </div>
          ))}

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 p-3 text-sm font-semibold text-slate-300"
            onClick={() =>
              setPipe({
                ...pipe,
                segments: [
                  ...pipe.segments,
                  createPipeSegment({
                    profileId: "pipe-48.3x3",
                    lengthM: 4,
                    buttJoints: 2,
                    elbows: 1,
                  }),
                ],
              })
            }
          >
            <Plus className="h-4 w-4" />
            {t(locale, "pipeAddSegment")}
          </button>

          <p className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
            {t(locale, "pipeJointsHint")}
            <span className="mt-1 block font-semibold text-slate-200">
              {t(locale, "pipeJointsTotal")}:{" "}
              {formatNum(jointsTotal, locale, 0)}
            </span>
          </p>
        </div>
      )}

      {preset === "door" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t(locale, "height")}
              suffix={m}
              value={door.heightM}
              onChange={(heightM) => onChange({ door: { ...door, heightM } })}
            />
            <NumberField
              label={t(locale, "width")}
              suffix={m}
              value={door.widthM}
              onChange={(widthM) => onChange({ door: { ...door, widthM } })}
            />
          </div>
          <SelectField
            label={t(locale, "frameProfile")}
            value={door.profileId}
            options={allProfiles}
            onChange={(profileId) => onChange({ door: { ...door, profileId } })}
          />
          <Segmented<DoorFill>
            label={t(locale, "fill")}
            value={door.fill}
            onChange={(fill) => onChange({ door: { ...door, fill } })}
            options={[
              { value: "sheet", label: t(locale, "fillSheet") },
              { value: "bars", label: t(locale, "fillBars") },
              { value: "none", label: t(locale, "fillNone") },
            ]}
          />
        </div>
      )}

      {preset === "gate" && (
        <div className="space-y-3">
          <Segmented<GateType>
            label={t(locale, "gateType")}
            value={gate.gateType}
            onChange={(gateType) => onChange({ gate: { ...gate, gateType } })}
            options={[
              { value: "swing", label: t(locale, "gateSwing") },
              { value: "sliding", label: t(locale, "gateSliding") },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t(locale, "height")}
              suffix={m}
              value={gate.heightM}
              onChange={(heightM) => onChange({ gate: { ...gate, heightM } })}
            />
            <NumberField
              label={t(locale, "width")}
              suffix={m}
              value={gate.widthM}
              onChange={(widthM) => onChange({ gate: { ...gate, widthM } })}
            />
          </div>
          {gate.gateType === "swing" && (
            <Segmented<1 | 2>
              label={t(locale, "leaves")}
              value={gate.leaves}
              onChange={(leaves) => onChange({ gate: { ...gate, leaves } })}
              options={[
                { value: 1, label: t(locale, "leaf1") },
                { value: 2, label: t(locale, "leaf2") },
              ]}
            />
          )}
          <SelectField
            label={t(locale, "profile")}
            value={gate.profileId}
            options={allProfiles}
            onChange={(profileId) => onChange({ gate: { ...gate, profileId } })}
          />
        </div>
      )}

      {preset === "canopy" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t(locale, "length")}
              suffix={m}
              value={canopy.lengthM}
              onChange={(lengthM) =>
                onChange({ canopy: { ...canopy, lengthM } })
              }
            />
            <NumberField
              label={t(locale, "width")}
              suffix={m}
              value={canopy.widthM}
              onChange={(widthM) =>
                onChange({ canopy: { ...canopy, widthM } })
              }
            />
            <NumberField
              label={t(locale, "height")}
              suffix={m}
              value={canopy.heightM}
              onChange={(heightM) =>
                onChange({ canopy: { ...canopy, heightM } })
              }
            />
            <NumberField
              label={t(locale, "crossStep")}
              suffix={m}
              value={canopy.crossStepM}
              step={0.1}
              onChange={(crossStepM) =>
                onChange({ canopy: { ...canopy, crossStepM } })
              }
            />
          </div>
          <SelectField
            label={t(locale, "profile")}
            value={canopy.profileId}
            options={allProfiles}
            onChange={(profileId) =>
              onChange({ canopy: { ...canopy, profileId } })
            }
          />
        </div>
      )}

      {preset === "free" && (
        <div className="space-y-3">
          <NumberField
            label={t(locale, "weldLength")}
            suffix={m}
            value={free.weldLengthM}
            onChange={(weldLengthM) =>
              onChange({ free: { ...free, weldLengthM } })
            }
          />
          <NumberField
            label={t(locale, "profileLength")}
            suffix={m}
            value={free.profileLengthM}
            onChange={(profileLengthM) =>
              onChange({ free: { ...free, profileLengthM } })
            }
          />
          <SelectField
            label={t(locale, "profileForWeight")}
            value={free.profileId}
            options={allProfiles}
            onChange={(profileId) =>
              onChange({ free: { ...free, profileId } })
            }
          />
        </div>
      )}
    </SectionCard>
  );
}
