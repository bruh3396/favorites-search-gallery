import { describe, expect, test, vi } from "vitest";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { MediaItem } from "@/core/domain/post/post";
import { MemoryMorpher } from "@/adapters/memory/ports/morpher/morpher";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { closeIntoTile } from "@/core/features/lightbox/commands/close";

const POST: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };

function openNavigation(): LightboxNavigation<MediaItem> {
  const navigation = new LightboxNavigation<MediaItem>({ maxWarmItems: 2, maxNeighborDistance: 0, settleDelay: 75 }, new MemoryScheduler());

  navigation.open(POST, { getNext: () => Promise.resolve(undefined), getPrevious: () => Promise.resolve(undefined), positionOf: () => undefined });
  return navigation;
}

describe("closeIntoTile", () => {
  test("morphs the shown media into the shown item's place, closing as it lands", () => {
    const navigation = openNavigation();
    const morpher = new MemoryMorpher();
    const place = document.createElement("div");
    const media = document.createElement("img");
    const locateItem = vi.fn((item: MediaItem) => (item === POST ? place : undefined));

    closeIntoTile(media, { navigation, morpher, locateItem });
    expect([morpher.morphs, navigation.current.value]).toEqual([[{ source: media, target: place }], undefined]);
  });

  test("closes without a morph when it has no morpher or no shown media", () => {
    const withoutMorpher = openNavigation();
    const withoutMedia = openNavigation();
    const morpher = new MemoryMorpher();

    closeIntoTile(document.createElement("img"), { navigation: withoutMorpher, locateItem: () => undefined });
    closeIntoTile(undefined, { navigation: withoutMedia, morpher, locateItem: () => undefined });
    expect([withoutMorpher.current.value, withoutMedia.current.value, morpher.morphs]).toEqual([undefined, undefined, []]);
  });
});
