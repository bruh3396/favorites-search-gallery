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
  lightboxZoom: Pick<LightboxZoom, "isZoomed" | "canZoom" | "mediaRect" | "toggle" | "zoomBy" | "zoomOut" | "panBy">;
  handlers: Pick<CommandHandlers<LightboxCommand>, "close" | "showNext" | "showPrevious" | "openOriginal">;
  closesOnPress: Readable<boolean>;
}

export function createLightboxViewportGestureHandlers(dependencies: LightboxViewportGestureHandlersDependencies): GestureHandlers {
  const { lightboxZoom, handlers, closesOnPress } = dependencies;
  return {
    canDrag: () => lightboxZoom.isZoomed.peek(),
    onDrag: ({ deltaPoint }) => lightboxZoom.panBy(deltaPoint.x, deltaPoint.y),
    onPress: ({ point, modifierState }): boolean => {
      if (modifierState.ctrl || modifierState.meta || lightboxZoom.isZoomed.peek()) {
        return false;
      }
      const isClosing = lightboxZoom.canZoom.peek() ? !isOnMedia(lightboxZoom.mediaRect.peek(), point) : closesOnPress.peek();

      if (isClosing) {
        handlers.close();
      }
      return isClosing;
    },
    onTap: ({ point, modifierState }): void => {
      if (modifierState.ctrl || modifierState.meta) {
        handlers.openOriginal();
      } else if (lightboxZoom.isZoomed.peek()) {
        lightboxZoom.zoomOut();
      } else if (lightboxZoom.canZoom.peek() && isOnMedia(lightboxZoom.mediaRect.peek(), point)) {
        lightboxZoom.toggle(point);
      }
    },
    onWheel: ({ point, deltaPoint, modifierState }): boolean => {
      if (modifierState.ctrl) {
        lightboxZoom.zoomBy(Math.exp(-deltaPoint.y * WHEEL_ZOOM_RATE), point);
        return true;
      }

      if (lightboxZoom.isZoomed.peek()) {
        lightboxZoom.panBy(-deltaPoint.x, -deltaPoint.y);
        return true;
      }

      if (modifierState.shift || deltaPoint.y === 0) {
        return false;
      }
      (deltaPoint.y > 0 ? handlers.showNext : handlers.showPrevious)();
      return true;
    }
  };
}

function isOnMedia(mediaRect: Rect | undefined, point: Point): boolean {
  return mediaRect !== undefined && containsPoint(mediaRect, point);
}
