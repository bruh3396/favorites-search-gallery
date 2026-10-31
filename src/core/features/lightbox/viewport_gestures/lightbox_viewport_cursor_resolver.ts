import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { Point } from "@/core/utils/geometry/point";
import { containsPoint } from "@/core/utils/geometry/rect_utilities";

export type LightboxViewportCursor = "zoom-in" | "grab" | undefined;

export function resolveLightboxViewportCursor(
  lightboxZoom: Pick<LightboxZoom, "isZoomed" | "canZoom" | "mediaRect">,
  hoverPoint: Point | undefined
): LightboxViewportCursor {
  if (lightboxZoom.isZoomed.value) {
    return "grab";
  }
  const mediaRect = lightboxZoom.mediaRect.value;
  return lightboxZoom.canZoom.value && hoverPoint !== undefined && mediaRect !== undefined && containsPoint(mediaRect, hoverPoint) ? "zoom-in" : undefined;
}