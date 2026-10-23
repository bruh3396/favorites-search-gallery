import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { Gestures } from "@/core/ui/gestures/gestures";
import { LightboxZoom } from "@/core/features/lightbox/zoom/zoom";
import { h } from "@/core/ui/h/h";

const DRAG_THRESHOLD = 2;

export const LightboxMinimapClass = {
  root: "fsg-LightboxMinimap",
  image: "fsg-LightboxMinimap-image",
  region: "fsg-LightboxMinimap-region"
} as const;

export interface LightboxMinimapProps {
  previewUrl: Readable<string | undefined>;
  zoom: Pick<LightboxZoom, "visibleRegion" | "mediaRect" | "panBy" | "centerAt">;
}

export function LightboxMinimap({ previewUrl, zoom }: LightboxMinimapProps): HTMLElement {
  const region = zoom.visibleRegion;
  const image = <img className={LightboxMinimapClass.image} alt="" src={computed(() => previewUrl.value ?? "")} /> as HTMLImageElement;
  const marker = <div className={LightboxMinimapClass.region} /> as HTMLElement;
  const root = (
    <div className={LightboxMinimapClass.root} hidden={computed(() => region.value === undefined)}>
      {image}
      {marker}
    </div>
  ) as HTMLElement;
  const gestures = new Gestures({ dragThreshold: DRAG_THRESHOLD }, {
    element: root,
    handlers: {
      canDrag: (): boolean => true,
      onDrag: ({ delta }): void => {
        const media = zoom.mediaRect.peek();

        if (media !== undefined) {
          zoom.panBy(-delta.x * media.width / image.clientWidth, -delta.y * media.height / image.clientHeight);
        }
      },
      onTap: ({ point }): void => zoom.centerAt({ x: point.x / image.clientWidth, y: point.y / image.clientHeight }),
      onWheel: (): boolean => false
    }
  });

  effect(() => {
    const visible = region.value;

    if (visible === undefined) {
      return;
    }
    Object.assign(marker.style, {
      left: `${visible.x * 100}%`,
      top: `${visible.y * 100}%`,
      width: `${visible.width * 100}%`,
      height: `${visible.height * 100}%`
    });
  });
  effect(() => root.toggleAttribute("data-dragging", gestures.isDragging.value));
  return root;
}
