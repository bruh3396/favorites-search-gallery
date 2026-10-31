import { LightboxMediaElement } from "@/core/features/lightbox/stage/lightbox_media_element";
import { morphLightboxMedia } from "@/core/features/lightbox/closer/lightbox_media_morpher";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/lightbox_navigation";
import { MediaItem } from "@/core/domain/media/media_item";
import { Readable } from "@/core/utils/reactive/signal";

export interface LightboxCloserDependencies<T extends MediaItem> {
  lightboxNavigation: Pick<LightboxNavigation<T>, "currentItem" | "close">;
  shownMedia: Readable<LightboxMediaElement | undefined>;
  inFullscreen: Readable<boolean>;
  morphDuration: Readable<number>;
  locateItem: (item: T) => Element | undefined;
}

export class LightboxCloser<T extends MediaItem> {
  constructor(private readonly dependencies: LightboxCloserDependencies<T>) { }

  public close(): void {
    const { lightboxNavigation, shownMedia, inFullscreen, morphDuration, locateItem } = this.dependencies;
    const item = lightboxNavigation.currentItem.peek();
    const source = shownMedia.peek();

    if (item === undefined || source === undefined || inFullscreen.peek()) {
      lightboxNavigation.close();
      return;
    }
    morphLightboxMedia(source, morphDuration.peek(), () => {
      lightboxNavigation.close();
      return locateItem(item);
    });
  }
}
