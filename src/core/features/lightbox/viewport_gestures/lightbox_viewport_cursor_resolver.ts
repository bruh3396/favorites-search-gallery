import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { Point } from "@/core/utils/geometry/point";
import { containsPoint } from "@/core/utils/geometry/rect_utilities";

export type LightboxViewportCursor = "zoom-in" | "grab" | undefined;

export function resolveLightboxViewportCursor(
  zoom: Pick<LightboxZoom, "isZoomed" | "canZoom" | "mediaRect">,
  hoverPoint: Point | undefined
): LightboxViewportCursor {
  if (zoom.isZoomed.value) {
    return "grab";
  }
  const mediaRect = zoom.mediaRect.value;
  return zoom.canZoom.value && hoverPoint !== undefined && mediaRect !== undefined && containsPoint(mediaRect, hoverPoint) ? "zoom-in" : undefined;
}