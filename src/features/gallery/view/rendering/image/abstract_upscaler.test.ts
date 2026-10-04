import { describe, expect, test, vi } from "vitest";
import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/abstract_upscaler";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { Preference } from "@/lib/storage/preference";
import { createPreference } from "@/testing/preferences";

interface Setup {
  upscaler: TestUpscaler;
  quality: Preference<number>;
  createCanvas: (id: string) => HTMLCanvasElement;
}

class TestUpscaler extends GalleryAbstractUpscaler {
  public readonly painted: ImageRequest[] = [];
  public readonly erased: HTMLCanvasElement[] = [];

  protected paint(r: ImageRequest): void {
    this.painted.push(r);
  }

  protected erase(canvas: HTMLCanvasElement): void {
    this.erased.push(canvas);
  }
}

function createRequest(id: string, overrides: Partial<ImageRequest> = {}): ImageRequest {
  return {
    id,
    isHighRes: true,
    hasCompleted: true,
    bitmap: {} as ImageBitmap,
    ...overrides
  } as Partial<ImageRequest> as ImageRequest;
}

// An upscaler that records what it paints and erases; createCanvas gives a post id a canvas to paint on.
function setup({ enabled = true } = {}): Setup {
  const canvases = new Map<string, HTMLCanvasElement>();
  const quality = createPreference(2);
  const upscaler = new TestUpscaler(
    { paintDelay: 0, baseCanvasWidth: 100, maxUpscaledCanvasHeight: 5_000 },
    {
      canvasFor: (id: string): HTMLCanvasElement | null => canvases.get(id) ?? null,
      enabled: createPreference(enabled),
      quality,
      fetchBitmap: vi.fn().mockResolvedValue(true)
    }
  );
  return {
    upscaler,
    quality,
    createCanvas: (id: string): HTMLCanvasElement => {
      const canvas = {} as HTMLCanvasElement;

      canvases.set(id, canvas);
      return canvas;
    }
  };
}

describe("GalleryAbstractUpscaler", () => {
  describe("tryPainting", () => {
    test("paints an eligible request that has a canvas and is complete", () => {
      const { upscaler, createCanvas } = setup();
      const request = createRequest("0");

      createCanvas("0");
      upscaler.tryPainting(request);
      expect(upscaler.painted).toEqual([request]);
    });

    test("does not paint when there is no canvas for the request", () => {
      const { upscaler } = setup();

      upscaler.tryPainting(createRequest("0"));
      expect(upscaler.painted).toEqual([]);
    });

    test("does not paint a low-resolution request", () => {
      const { upscaler, createCanvas } = setup();

      createCanvas("0");
      upscaler.tryPainting(createRequest("0", { isHighRes: false }));
      expect(upscaler.painted).toEqual([]);
    });

    test("does not paint a request whose bitmap has not completed", () => {
      const { upscaler, createCanvas } = setup();

      createCanvas("0");
      upscaler.tryPainting(createRequest("0", { hasCompleted: false }));
      expect(upscaler.painted).toEqual([]);
    });

    test("does not paint while disabled", () => {
      const { upscaler, createCanvas } = setup({ enabled: false });

      createCanvas("0");
      upscaler.tryPainting(createRequest("0"));
      expect(upscaler.painted).toEqual([]);
    });

    test("does not paint while paused, and paints again after resume", () => {
      const { upscaler, createCanvas } = setup();
      const request = createRequest("0");

      createCanvas("0");
      upscaler.pause();
      upscaler.tryPainting(createRequest("0"));
      expect(upscaler.painted).toEqual([]);
      upscaler.resume();
      upscaler.tryPainting(request);
      expect(upscaler.painted).toEqual([request]);
    });

    test("does not repaint the same canvas at the same width", () => {
      const { upscaler, createCanvas } = setup();

      createCanvas("0");
      upscaler.tryPainting(createRequest("0"));
      upscaler.tryPainting(createRequest("0"));
      expect(upscaler.painted).toHaveLength(1);
    });

    test("repaints the same canvas after the upscaled width changes", () => {
      const { upscaler, quality, createCanvas } = setup();

      createCanvas("0");
      upscaler.tryPainting(createRequest("0"));
      quality.set(3);
      upscaler.tryPainting(createRequest("0"));
      expect(upscaler.painted).toHaveLength(2);
    });
  });

  describe("eraseAll", () => {
    test("erases every tracked canvas", () => {
      const { upscaler, createCanvas } = setup();
      const first = createCanvas("0");
      const second = createCanvas("1");

      upscaler.tryPainting(createRequest("0"));
      upscaler.tryPainting(createRequest("1"));
      upscaler.eraseAll();
      expect(upscaler.erased).toEqual([first, second]);
    });

    test("clears tracking so a canvas can be painted again at the same width", () => {
      const { upscaler, createCanvas } = setup();

      createCanvas("0");
      upscaler.tryPainting(createRequest("0"));
      upscaler.eraseAll();
      upscaler.tryPainting(createRequest("0"));
      expect(upscaler.painted).toHaveLength(2);
    });

    test("does not erase a canvas that was never painted", () => {
      const { upscaler, createCanvas } = setup();

      createCanvas("0");
      upscaler.eraseAll();
      expect(upscaler.erased).toEqual([]);
    });
  });
});
