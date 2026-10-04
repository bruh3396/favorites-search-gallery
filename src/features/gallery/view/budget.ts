import { CanvasBudget } from "@/core/boundary/environment";
import { GalleryBudget } from "@/features/gallery/types/types";
import { doNothing } from "@/utils/pure/function";

const FULL_BUDGET: GalleryBudget = {
  upscale: { paintDelay: 25, canvasWidth: 900 },
  releaseCanvas: doNothing,
  warm: (target, items) => target.cacheImages(items),
  follow: (target, id) => target.scrollToThumb(id)
};

const REDUCED_BUDGET: GalleryBudget = {
  upscale: { paintDelay: 100, canvasWidth: 500 },
  releaseCanvas: canvas => canvas.clear(),
  warm: (target, items) => target.upscale(items),
  follow: doNothing
};

export const GALLERY_BUDGETS: Readonly<Record<CanvasBudget, GalleryBudget>> = {
  full: FULL_BUDGET,
  reduced: REDUCED_BUDGET
};
