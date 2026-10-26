import { CommandHandlers } from "@/core/ui/hotkeys/command_handlers";
import { GestureHandlers } from "@/core/ui/gestures/gesture_handlers";
import { LightboxCommand } from "@/core/features/lightbox/input/lightbox_command";
import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { Point } from "@/core/utils/geometry/point";
import { Readable } from "@/core/utils/reactive/signal";
import { Rect } from "@/core/utils/geometry/rect";
import { containsPoint } from "@/core/utils/geometry/rect_utilities";

const WHEEL_ZOOM_RATE = 0.002;

export interface LightboxViewportGestureHandlersDependencies {
  zoom: Pick<LightboxZoom, "isZoomed" | "canZoom" | "mediaRect" | "toggle" | "zoomBy" | "zoomOut" | "panBy">;
  handlers: Pick<CommandHandlers<LightboxCommand>, "close" | "showNext" | "showPrevious" | "openOriginal">;
  closesOnPress: Readable<boolean>;
}

export function createLightboxViewportGestureHandlers(dependencies: LightboxViewportGestureHandlersDependencies): GestureHandlers {
  const { zoom, handlers, closesOnPress } = dependencies;
  return {
    canDrag: () => zoom.isZoomed.peek(),
    onDrag: ({ delta }) => zoom.panBy(delta.x, delta.y),
    onPress: ({ point, modifiers }): boolean => {
      if (modifiers.ctrl || modifiers.meta || zoom.isZoomed.peek()) {
        return false;
      }
      const isClosing = zoom.canZoom.peek() ? !isOnMedia(zoom.mediaRect.peek(), point) : closesOnPress.peek();

      if (isClosing) {
        handlers.close();
      }
      return isClosing;
    },
    onTap: ({ point, modifiers }): void => {
      if (modifiers.ctrl || modifiers.meta) {
        handlers.openOriginal();
      } else if (zoom.isZoomed.peek()) {
        zoom.zoomOut();
      } else if (zoom.canZoom.peek() && isOnMedia(zoom.mediaRect.peek(), point)) {
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

function isOnMedia(mediaRect: Rect | undefined, point: Point): boolean {
  return mediaRect !== undefined && containsPoint(mediaRect, point);
}