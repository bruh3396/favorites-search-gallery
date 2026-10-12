import { MorphSource, Morpher } from "@/core/boundary/ports/morpher/morpher";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { MediaItem } from "@/core/domain/post/post";

export interface CloseIntoTileDependencies<T extends MediaItem> {
  navigation: Pick<LightboxNavigation<T>, "current" | "close">;
  morpher?: Morpher;
  locateItem: (item: T) => Element | undefined;
}

export function closeIntoTile<T extends MediaItem>(media: MorphSource | undefined, { navigation, morpher, locateItem }: CloseIntoTileDependencies<T>): void {
  const item = navigation.current.peek();

  if (item === undefined || media === undefined || morpher === undefined) {
    navigation.close();
    return;
  }
  morpher.morph(media, () => {
    navigation.close();
    return locateItem(item);
  });
}
