import { describe, expect, test, vi } from "vitest";
import { Lightbox } from "@/core/ui/lightbox/lightbox";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryMorpher } from "@/adapters/memory/ports/morpher/morpher";
import { closeIntoPage } from "@/core/ui/lightbox/screen/close";

const POST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };

function openLightbox(): Lightbox<MediaItem> {
  const lightbox = new Lightbox<MediaItem>({ warmLimit: 2, maxNeighborDistance: 0 });

  lightbox.open(POST, { getNext: () => Promise.resolve(undefined), getPrevious: () => Promise.resolve(undefined), positionOf: () => undefined });
  return lightbox;
}

describe("closeIntoPage", () => {
  test("morphs the shown media into the shown item's place, closing as it lands", () => {
    const lightbox = openLightbox();
    const morpher = new MemoryMorpher();
    const place = document.createElement("div");
    const media = document.createElement("img");
    const locateItem = vi.fn((item: MediaItem) => (item === POST ? place : undefined));

    closeIntoPage(media, { lightbox, morpher, locateItem });
    expect([morpher.morphs, lightbox.current.value]).toEqual([[{ source: media, target: place }], undefined]);
  });

  test("closes without a morph when it has no morpher or no shown media", () => {
    const withoutMorpher = openLightbox();
    const withoutMedia = openLightbox();
    const morpher = new MemoryMorpher();

    closeIntoPage(document.createElement("img"), { lightbox: withoutMorpher, locateItem: () => undefined });
    closeIntoPage(undefined, { lightbox: withoutMedia, morpher, locateItem: () => undefined });
    expect([withoutMorpher.current.value, withoutMedia.current.value, morpher.morphs]).toEqual([undefined, undefined, []]);
  });
});
