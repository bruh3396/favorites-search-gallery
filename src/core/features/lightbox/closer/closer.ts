import { MorphSource, Morpher } from "@/core/boundary/ports/morpher/morpher";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { MediaItem } from "@/core/domain/post/post";
import { Readable } from "@/core/utils/reactive/signal";

export interface LightboxCloserDependencies<T extends MediaItem> {
  navigation: Pick<LightboxNavigation<T>, "currentItem" | "close">;
  shownMedia: Readable<MorphSource | undefined>;
  inFullscreen: Readable<boolean>;
  morpher?: Morpher;
  locateItem: (item: T) => Element | undefined;
}

export class LightboxCloser<T extends MediaItem> {
  constructor(private readonly dependencies: LightboxCloserDependencies<T>) { }

  public close(): void {
    const { navigation, shownMedia, inFullscreen, morpher, locateItem } = this.dependencies;
    const item = navigation.currentItem.peek();
    const source = shownMedia.peek();

    if (item === undefined || source === undefined || morpher === undefined || inFullscreen.peek()) {
      navigation.close();
      return;
    }
    morpher.morph(source, () => {
      navigation.close();
      return locateItem(item);
    });
  }
}
