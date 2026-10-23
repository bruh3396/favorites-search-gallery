import { LightboxCloser, LightboxCloserDependencies } from "@/core/features/lightbox/closer/closer";
import { MorphSource, Morpher } from "@/core/boundary/ports/morpher/morpher";
import { describe, expect, test, vi } from "vitest";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { createPost } from "@/testing/post";

const POST = createPost({ id: "1" });

function setup(overrides: Partial<LightboxCloserDependencies<Post>> = {}): {
  closer: LightboxCloser<Post>;
  close: () => void;
  morph: ReturnType<typeof vi.fn<Morpher["morph"]>>;
  shown: HTMLCanvasElement;
  thumb: HTMLElement;
  locateItem: (item: Post) => Element | undefined;
} {
  const close = vi.fn();
  const morph = vi.fn<Morpher["morph"]>();
  const shown = document.createElement("canvas");
  const thumb = document.createElement("div");
  const locateItem = vi.fn(() => thumb);
  const closer = new LightboxCloser<Post>({
    navigation: { currentItem: new Signal<Post | undefined>(POST), close },
    shownMedia: new Signal<MorphSource | undefined>(shown),
    inFullscreen: new Signal(false),
    morpher: { morph },
    locateItem,
    ...overrides
  });
  return { closer, close, morph, shown, thumb, locateItem };
}

describe("LightboxCloser", () => {
  describe("close", () => {
    test("morphs the shown media back to the item's thumb", () => {
      const { closer, close, morph, shown, thumb, locateItem } = setup();

      closer.close();
      expect(close).not.toHaveBeenCalled();

      const [source, update] = morph.mock.calls[0]!;

      expect(source).toBe(shown);
      expect(update()).toBe(thumb);
      expect(close).toHaveBeenCalledOnce();
      expect(locateItem).toHaveBeenCalledWith(POST);
    });

    test("closes without morphing with no current item", () => {
      const close = vi.fn();
      const { closer, morph } = setup({ navigation: { currentItem: new Signal<Post | undefined>(undefined), close } });

      closer.close();
      expect(morph).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledOnce();
    });

    test.each<[string, Partial<LightboxCloserDependencies<Post>>]>([
      ["no shown media", { shownMedia: new Signal<MorphSource | undefined>(undefined) }],
      ["no morpher", { morpher: undefined }],
      ["fullscreen", { inFullscreen: new Signal(true) }]
    ])("closes without morphing with %s", (_, overrides) => {
      const { closer, close, morph } = setup(overrides);

      closer.close();
      expect(morph).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledOnce();
    });
  });
});
