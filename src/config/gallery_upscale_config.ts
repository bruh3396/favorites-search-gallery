import { QualityCutoff, UpscaleQuality } from "@/types/app";

export const GalleryUpscaleConfig = {
  maxUpscaledCanvasHeight: 16_000,
  maxUpscaledThumbs: 100,
  dynamicQuality: true,
  dynamicQualitySettleTime: 400,
  dynamicQualityCutoffs: [
    { maxRatio: 0.10, quality: UpscaleQuality.Low },
    { maxRatio: 0.20, quality: UpscaleQuality.Normal },
    { maxRatio: 0.35, quality: UpscaleQuality.High },
    { maxRatio: Infinity, quality: UpscaleQuality.Ultra }
  ] as QualityCutoff[]
};
