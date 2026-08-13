import { createPipeSegment } from "./defaults";
import type { PipeParams } from "./types";
import type { TranslationKey } from "./i18n";

export type PipeTemplateId =
  | "water33"
  | "hydraulic21"
  | "air42"
  | "mixedWater";

export interface PipeTemplate {
  id: PipeTemplateId;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  pipe: PipeParams;
}

export const PIPE_TEMPLATES: PipeTemplate[] = [
  {
    id: "water33",
    titleKey: "tplWater33",
    descKey: "tplWater33Desc",
    pipe: {
      media: "water",
      segments: [
        createPipeSegment({
          profileId: "pipe-33.7x2.5",
          lengthM: 12,
          buttJoints: 8,
          elbows: 4,
          tees: 1,
          flanges: 2,
        }),
      ],
    },
  },
  {
    id: "hydraulic21",
    titleKey: "tplHydraulic21",
    descKey: "tplHydraulic21Desc",
    pipe: {
      media: "hydraulic",
      segments: [
        createPipeSegment({
          profileId: "pipe-21.3x2",
          lengthM: 8,
          buttJoints: 10,
          elbows: 6,
          tees: 2,
          flanges: 0,
        }),
      ],
    },
  },
  {
    id: "air42",
    titleKey: "tplAir42",
    descKey: "tplAir42Desc",
    pipe: {
      media: "air",
      segments: [
        createPipeSegment({
          profileId: "pipe-42.4x2.5",
          lengthM: 15,
          buttJoints: 6,
          elbows: 3,
          tees: 1,
          flanges: 2,
        }),
      ],
    },
  },
  {
    id: "mixedWater",
    titleKey: "tplMixedWater",
    descKey: "tplMixedWaterDesc",
    pipe: {
      media: "water",
      segments: [
        createPipeSegment({
          profileId: "pipe-33.7x2.5",
          lengthM: 10,
          buttJoints: 6,
          elbows: 3,
          tees: 1,
          flanges: 1,
        }),
        createPipeSegment({
          profileId: "pipe-48.3x3",
          lengthM: 4,
          buttJoints: 3,
          elbows: 1,
          tees: 0,
          flanges: 1,
        }),
      ],
    },
  },
];
