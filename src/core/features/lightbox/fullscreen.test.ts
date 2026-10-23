import { describe, expect, test, vi } from "vitest";
import { LightboxFullscreen } from "@/core/features/lightbox/fullscreen";
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

function setup(): { fullscreen: LightboxFullscreen; fake: FakeDocument; dispose: () => void } {
  const fake = new FakeDocument();
  const { result: fullscreen, dispose } = createScope(() => new LightboxFullscreen(fake as unknown as Document));
  return { fullscreen, fake, dispose };
}

describe("LightboxFullscreen", () => {
  test("starts in fullscreen when the document already is", () => {
    const fake = new FakeDocument();

    fake.fullscreenElement = document.createElement("div");
    expect(new LightboxFullscreen(fake as unknown as Document).inFullscreen.value).toBe(true);
  });

  test("follows the document's fullscreen changes", () => {
    const { fullscreen, fake } = setup();

    expect(fullscreen.inFullscreen.value).toBe(false);
    fake.changeFullscreenElement(document.createElement("div"));
    expect(fullscreen.inFullscreen.value).toBe(true);
    fake.changeFullscreenElement(null);
    expect(fullscreen.inFullscreen.value).toBe(false);
  });

  test("stops following once its scope is disposed", () => {
    const { fullscreen, fake, dispose } = setup();

    dispose();
    fake.changeFullscreenElement(document.createElement("div"));
    expect(fullscreen.inFullscreen.value).toBe(false);
  });

  describe("toggle", () => {
    test("enters fullscreen when not in it", () => {
      const { fullscreen, fake } = setup();

      fullscreen.toggle();
      expect(fake.documentElement.requestFullscreen).toHaveBeenCalledOnce();
    });

    test("exits fullscreen when in it", () => {
      const { fullscreen, fake } = setup();

      fake.changeFullscreenElement(document.createElement("div"));
      fullscreen.toggle();
      expect(fake.exitFullscreen).toHaveBeenCalledOnce();
      expect(fake.documentElement.requestFullscreen).not.toHaveBeenCalled();
    });
  });

  describe("exit", () => {
    test("does nothing when not in fullscreen", () => {
      const { fullscreen, fake } = setup();

      fullscreen.exit();
      expect(fake.exitFullscreen).not.toHaveBeenCalled();
    });
  });
});
