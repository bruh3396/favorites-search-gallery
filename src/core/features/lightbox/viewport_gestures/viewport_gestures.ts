import { GestureHandlers, GesturePoint } from "@/core/ui/gestures/gestures";
import { LightboxZoom, ZoomRect } from "@/core/features/lightbox/zoom/zoom";
import { LightboxCommandHandlers } from "@/core/features/lightbox/input/commands";
import { Readable } from "@/core/utils/reactive/signal";

const WHEEL_ZOOM_RATE = 0.002;

export type LightboxViewportGestureZoom = Pick<LightboxZoom, "isZoomed" | "canZoom" | "mediaRect" | "toggle" | "zoomBy" | "zoomOut" | "panBy">;
export type LightboxViewportCommandHandlers = Pick<LightboxCommandHandlers, "close" | "showNext" | "showPrevious" | "openOriginal">;
export type LightboxViewportCursor = "zoom-in" | "grab" | undefined;

export function resolveLightboxViewportCursor(
  zoom: Pick<LightboxZoom, "isZoomed" | "canZoom" | "mediaRect">,
  hoverPoint: GesturePoint | undefined
): LightboxViewportCursor {
  if (zoom.isZoomed.value) {
    return "grab";
  }
  return zoom.canZoom.value && hoverPoint !== undefined && containsPoint(zoom.mediaRect.value, hoverPoint) ? "zoom-in" : undefined;
}

export function createLightboxViewportGestureHandlers(
  zoom: LightboxViewportGestureZoom,
  handlers: LightboxViewportCommandHandlers,
  closesOnPress: Readable<boolean>
): GestureHandlers {
  return {
    canDrag: () => zoom.isZoomed.peek(),
    onDrag: ({ delta }) => zoom.panBy(delta.x, delta.y),
    onPress: ({ point, modifiers }): boolean => {
      if (modifiers.ctrl || modifiers.meta || zoom.isZoomed.peek()) {
        return false;
      }
      const closes = zoom.canZoom.peek() ? !containsPoint(zoom.mediaRect.peek(), point) : closesOnPress.peek();

      if (closes) {
        handlers.close();
      }
      return closes;
    },
    onTap: ({ point, modifiers }): void => {
      if (modifiers.ctrl || modifiers.meta) {
        handlers.openOriginal();
      } else if (zoom.isZoomed.peek()) {
        zoom.zoomOut();
      } else if (zoom.canZoom.peek() && containsPoint(zoom.mediaRect.peek(), point)) {
        zoom.toggle(point);
      }
    },
    onWheel: ({ point, delta, modifiers }): boolean => {
      if (modifiers.ctrl) {
        zoom.zoomBy(Math.exp(-delta.y * WHEEL_ZOOM_RATE), point);
        return true;
      }

      if (zoom.isZoomed.peek()) {
        zoom.panBy(-delta.x, -delta.y);
        return true;
      }

      if (modifiers.shift || delta.y === 0) {
        return false;
      }
      (delta.y > 0 ? handlers.showNext : handlers.showPrevious)();
      return true;
    }
  };
}

function containsPoint(rect: ZoomRect | undefined, point: GesturePoint): boolean {
  return rect !== undefined && point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}
