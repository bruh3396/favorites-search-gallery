import { Child, h } from "@/core/ui/h/h";
import { LightboxViewportGestureHandlersDependencies, createLightboxViewportGestureHandlers } from "@/core/features/lightbox/viewport_gestures/lightbox_viewport_gesture_handlers";
import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { Gestures } from "@/core/ui/gestures/gestures";
import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { onCleanup } from "@/core/utils/reactive/scope";
import { resolveLightboxViewportCursor } from "@/core/features/lightbox/viewport_gestures/lightbox_viewport_cursor_resolver";

const DRAG_THRESHOLD = 4;

export const LightboxViewportClass = {
  root: "fsg-LightboxViewport",
  content: "fsg-LightboxViewport-content"
} as const;

export interface LightboxViewportProps {
  zoom: LightboxViewportGestureHandlersDependencies["lightboxZoom"] & Pick<LightboxZoom, "view" | "glides" | "setFrameSize" | "setFocusPoint">;
  sizeObserver: SizeObserver;
  handlers: LightboxViewportGestureHandlersDependencies["handlers"];
  closesOnPress: Readable<boolean>;
  contentChild: Child;
}

export function LightboxViewport({ zoom, sizeObserver, handlers, closesOnPress, contentChild }: LightboxViewportProps): HTMLElement {
  const contentLayer = <div className={LightboxViewportClass.content}>{contentChild}</div> as HTMLElement;
  const root = <div className={LightboxViewportClass.root}>{contentLayer}</div> as HTMLElement;
  const gestures = new Gestures({ dragThreshold: DRAG_THRESHOLD }, {
    element: root,
    gestureHandlers: createLightboxViewportGestureHandlers({ lightboxZoom: zoom, handlers, closesOnPress })
  });
  const cursor = computed(() => resolveLightboxViewportCursor(zoom, gestures.hoverPoint.value));

  effect(() => {
    const { scale, x, y } = zoom.view.value;

    contentLayer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  });
  effect(() => contentLayer.toggleAttribute("data-glides", zoom.glides.value));
  effect(() => root.toggleAttribute("data-zoomed", zoom.isZoomed.value));
  effect(() => root.toggleAttribute("data-dragging", gestures.isDragging.value));
  effect(() => zoom.setFocusPoint(gestures.hoverPoint.value));
  effect(() => {
    if (cursor.value === undefined) {
      delete root.dataset.cursor;
    } else {
      root.dataset.cursor = cursor.value;
    }
  });
  onCleanup(sizeObserver.observe(root, observedSize => zoom.setFrameSize(observedSize)));
  return root;
}
