import { Readable, effect } from "@/core/utils/reactive/signal";
import { MorphSource } from "@/core/boundary/ports/morpher/morpher";
import { ZoomRegion } from "@/core/features/lightbox/zoom/zoom";
import { h } from "@/core/ui/h/h";
import { readNaturalSize } from "@/core/features/lightbox/ui/stage/stage";

export const LightboxMinimapClass = {
  root: "fsg-LightboxMinimap",
  image: "fsg-LightboxMinimap-image",
  region: "fsg-LightboxMinimap-region"
} as const;

export interface LightboxMinimapProps {
  region: Readable<ZoomRegion | undefined>;
  readShownMedia: () => MorphSource | undefined;
}

const THUMBNAIL_SIZE = 280;

export function LightboxMinimap({ region, readShownMedia }: LightboxMinimapProps): HTMLElement {
  const image = <canvas className={LightboxMinimapClass.image} /> as HTMLCanvasElement;
  const regionBox = <div className={LightboxMinimapClass.region} /> as HTMLElement;
  const root = <div className={LightboxMinimapClass.root} aria-hidden="true" hidden>{image}{regionBox}</div> as HTMLElement;

  effect(() => {
    const shown = region.value;
    const wasHidden = root.hidden;

    root.hidden = shown === undefined;

    if (shown === undefined) {
      return;
    }

    if (wasHidden) {
      drawThumbnail(image, readShownMedia());
    }
    Object.assign(regionBox.style, {
      left: `${shown.left * 100}%`,
      top: `${shown.top * 100}%`,
      width: `${shown.width * 100}%`,
      height: `${shown.height * 100}%`
    });
  });
  return root;
}

function drawThumbnail(canvas: HTMLCanvasElement, media: MorphSource | undefined): void {
  if (media === undefined) {
    return;
  }
  const [width, height] = readNaturalSize(media);
  const ratio = Math.min(1, THUMBNAIL_SIZE / Math.max(width, height));

  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  canvas.getContext("2d")?.drawImage(media, 0, 0, canvas.width, canvas.height);
}
