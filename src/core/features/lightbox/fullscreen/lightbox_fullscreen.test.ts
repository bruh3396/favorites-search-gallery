import { describe, expect, test, vi } from "vitest";
import { LightboxFullscreen } from "@/core/features/lightbox/fullscreen/lightbox_fullscreen";
import { createScope } from "@/core/utils/reactive/scope";

class FakeDocument extends EventTarget {
  public fullscreenElement: Element | null = null;
  public readonly documentElement = { requestFullscreen: vi.fn(() => Promise.resolve()) };
  public readonly exitFullscreen = vi.fn(() => Promise.resolve());

  public changeFullscreenElement(element: Element | null): void {
    this.fullscreenElement = element;
    this.dispatchEvent(new Event("fullscreenchange"));
  }
}

function setup(): { lightboxFullscreen: LightboxFullscreen; fakeDocument: FakeDocument; dispose: () => void } {
  const fakeDocument = new FakeDocument();
  const { result: lightboxFullscreen, dispose } = createScope(() => new LightboxFullscreen(fakeDocument as unknown as Document));
  return { lightboxFullscreen, fakeDocument, dispose };
}

describe("LightboxFullscreen", () => {
  test("starts in fullscreen when the document already is", () => {
    const fakeDocument = new FakeDocument();

    fakeDocument.fullscreenElement = document.createElement("div");
    expect(new LightboxFullscreen(fakeDocument as unknown as Document).inFullscreen.value).toBe(true);
  });

  test("follows the document's fullscreen changes", () => {
    const { lightboxFullscreen, fakeDocument } = setup();

    expect(lightboxFullscreen.inFullscreen.value).toBe(false);
    fakeDocument.changeFullscreenElement(document.createElement("div"));
    expect(lightboxFullscreen.inFullscreen.value).toBe(true);
    fakeDocument.changeFullscreenElement(null);
    expect(lightboxFullscreen.inFullscreen.value).toBe(false);
  });

  test("stops following once its scope is disposed", () => {
    const { lightboxFullscreen, fakeDocument, dispose } = setup();

    dispose();
    fakeDocument.changeFullscreenElement(document.createElement("div"));
    expect(lightboxFullscreen.inFullscreen.value).toBe(false);
  });

  describe("toggle", () => {
    test("enters fullscreen when not in it", () => {
      const { lightboxFullscreen, fakeDocument } = setup();

      lightboxFullscreen.toggle();
      expect(fakeDocument.documentElement.requestFullscreen).toHaveBeenCalledOnce();
    });

    test("exits fullscreen when in it", () => {
      const { lightboxFullscreen, fakeDocument } = setup();

      fakeDocument.changeFullscreenElement(document.createElement("div"));
      lightboxFullscreen.toggle();
      expect(fakeDocument.exitFullscreen).toHaveBeenCalledOnce();
      expect(fakeDocument.documentElement.requestFullscreen).not.toHaveBeenCalled();
    });
  });

  describe("exit", () => {
    test("does nothing when not in fullscreen", () => {
      const { lightboxFullscreen, fakeDocument } = setup();

      lightboxFullscreen.exit();
      expect(fakeDocument.exitFullscreen).not.toHaveBeenCalled();
    });
  });
});
