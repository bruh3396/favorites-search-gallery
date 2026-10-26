import { LightboxCloser, LightboxCloserDependencies } from "@/core/features/lightbox/closer/lightbox_closer";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { LightboxMediaElement } from "@/core/features/lightbox/stage/lightbox_media_element";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { createPost } from "@/testing/post";

const POST = createPost({ id: "1" });

function createShownMedia(): HTMLCanvasElement {
  const shown = document.createElement("canvas");

  shown.width = 100;
  shown.height = 100;
  vi.spyOn(shown, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 100));
  return shown;
}

function findStandIn(): HTMLCanvasElement | null {
  return document.body.querySelector<HTMLCanvasElement>(":scope > canvas");
}

function setup(overrides: Partial<LightboxCloserDependencies<Post>> = {}): {
  closer: LightboxCloser<Post>;
  close: () => void;
  locateItem: (item: Post) => Element | undefined;
} {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 0);
  onTestFinished(() => {
    findStandIn()?.remove();
    vi.restoreAllMocks();
  });
  const close = vi.fn();
  const thumb = document.createElement("div");
  const locateItem = vi.fn(() => thumb);
  const closer = new LightboxCloser<Post>({
    navigation: { currentItem: new Signal<Post | undefined>(POST), close },
    shownMedia: new Signal<LightboxMediaElement | undefined>(createShownMedia()),
    inFullscreen: new Signal(false),
    morphDuration: new Signal(250),
    locateItem,
    ...overrides
  });
  return { closer, close, locateItem };
}

describe("LightboxCloser", () => {
  describe("close", () => {
    test("morphs the shown media back to the item's thumb", () => {
      const { closer, close, locateItem } = setup();

      closer.close();
      expect(findStandIn()).not.toBeNull();
      expect(close).toHaveBeenCalledOnce();
      expect(locateItem).toHaveBeenCalledWith(POST);
    });

    test("closes without morphing with no current item", () => {
      const close = vi.fn();
      const { closer } = setup({ navigation: { currentItem: new Signal<Post | undefined>(undefined), close } });

      closer.close();
      expect(findStandIn()).toBeNull();
      expect(close).toHaveBeenCalledOnce();
    });

    test.each<[string, Partial<LightboxCloserDependencies<Post>>]>([
      ["no shown media", { shownMedia: new Signal<LightboxMediaElement | undefined>(undefined) }],
      ["fullscreen", { inFullscreen: new Signal(true) }]
    ])("closes without morphing with %s", (_, overrides) => {
      const { closer, close, locateItem } = setup(overrides);

      closer.close();
      expect(findStandIn()).toBeNull();
      expect(locateItem).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledOnce();
    });
  });
});
