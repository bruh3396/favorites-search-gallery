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

function setup(partialLightboxCloserDependencies: Partial<LightboxCloserDependencies<Post>> = {}): {
  lightboxCloser: LightboxCloser<Post>;
  close: () => void;
  locateItem: (post: Post) => Element | undefined;
} {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 0);
  onTestFinished(() => {
    findStandIn()?.remove();
    vi.restoreAllMocks();
  });
  const close = vi.fn();
  const thumb = document.createElement("div");
  const locateItem = vi.fn(() => thumb);
  const lightboxCloser = new LightboxCloser<Post>({
    lightboxNavigation: { currentItem: new Signal<Post | undefined>(POST), close },
    shownMedia: new Signal<LightboxMediaElement | undefined>(createShownMedia()),
    inFullscreen: new Signal(false),
    morphDuration: new Signal(250),
    locateItem,
    ...partialLightboxCloserDependencies
  });
  return { lightboxCloser, close, locateItem };
}

describe("LightboxCloser", () => {
  describe("close", () => {
    test("morphs the shown media back to the item's thumb", () => {
      const { lightboxCloser, close, locateItem } = setup();

      lightboxCloser.close();
      expect(findStandIn()).not.toBeNull();
      expect(close).toHaveBeenCalledOnce();
      expect(locateItem).toHaveBeenCalledWith(POST);
    });

    test("closes without morphing with no current item", () => {
      const close = vi.fn();
      const { lightboxCloser } = setup({ lightboxNavigation: { currentItem: new Signal<Post | undefined>(undefined), close } });

      lightboxCloser.close();
      expect(findStandIn()).toBeNull();
      expect(close).toHaveBeenCalledOnce();
    });

    test.each<[string, Partial<LightboxCloserDependencies<Post>>]>([
      ["no shown media", { shownMedia: new Signal<LightboxMediaElement | undefined>(undefined) }],
      ["fullscreen", { inFullscreen: new Signal(true) }]
    ])("closes without morphing with %s", (_, partialLightboxCloserDependencies) => {
      const { lightboxCloser, close, locateItem } = setup(partialLightboxCloserDependencies);

      lightboxCloser.close();
      expect(findStandIn()).toBeNull();
      expect(locateItem).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledOnce();
    });
  });
});
