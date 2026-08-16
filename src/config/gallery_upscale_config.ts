import { USING_FIREFOX } from "@/lib/environment";

export const GalleryUpscaleConfig = {
  upscaledCanvasWidth: USING_FIREFOX ? 500 : 750,
  maxUpscaledCanvasHeight: 16_000,
  maxUpscaledThumbs: 100,
  upscaleUsingSamples: false,
  upscaleDelay: USING_FIREFOX ? 100 : 25
};
