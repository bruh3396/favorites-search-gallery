import { MorphSource, Morpher } from "@/core/boundary/ports/morpher/morpher";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { MediaItem } from "@/core/domain/post/post";

export interface CloseIntoPageDependencies<T extends MediaItem> {
  lightbox: Pick<Lightbox<T>, "current" | "close">;
  morpher?: Morpher;
  locateItem: (item: T) => Element | undefined;
}

export function closeIntoPage<T extends MediaItem>(media: MorphSource | undefined, { lightbox, morpher, locateItem }: CloseIntoPageDependencies<T>): void {
  const item = lightbox.current.peek();

  if (item === undefined || media === undefined || morpher === undefined) {
    lightbox.close();
    return;
  }
  morpher.morph(media, () => {
    lightbox.close();
    return locateItem(item);
  });
}
