import { LightboxMediaElement } from "@/core/features/lightbox/stage/lightbox_media_element";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/lightbox_navigation";
import { MediaItem } from "@/core/domain/media/media_item";
import { Readable } from "@/core/utils/reactive/signal";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Viewport } from "@/core/boundary/ports/viewport/viewport";
import { morphLightboxMedia } from "@/core/features/lightbox/closer/lightbox_media_morpher";

export interface LightboxCloserDependencies<T extends MediaItem> {
  scheduler: Pick<Scheduler, "requestFrame">;
  viewport: Pick<Viewport, "readDevicePixelRatio">;
  lightboxNavigation: Pick<LightboxNavigation<T>, "currentItem" | "close">;
  shownMedia: Readable<LightboxMediaElement | undefined>;
  inFullscreen: Readable<boolean>;
  morphDuration: Readable<number>;
  locateItem: (item: T) => Element | undefined;
}

export class LightboxCloser<T extends MediaItem> {
  constructor(private readonly dependencies: LightboxCloserDependencies<T>) { }

  public close(): void {
    const { scheduler, viewport, lightboxNavigation, shownMedia, inFullscreen, morphDuration, locateItem } = this.dependencies;
    const item = lightboxNavigation.currentItem.peek();
    const source = shownMedia.peek();

    if (item === undefined || source === undefined || inFullscreen.peek()) {
      lightboxNavigation.close();
      return;
    }
    morphLightboxMedia(source, { duration: morphDuration.peek(), pixelRatio: viewport.readDevicePixelRatio(), scheduler }, () => {
      lightboxNavigation.close();
      return locateItem(item);
    });
  }
}
