import { Mock, beforeEach, describe, expect, test, vi } from "vitest";
import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/abstract_upscaler";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { Preference } from "@/lib/storage/preference";

function preference<T>(initial: T): Preference<T> {
  let current = initial;
  return {
    get value(): T {
      return current;
    },
    set(next: T): void {
      current = next;
    }
  } as Preference<T>;
}

function request(id: string, overrides: Partial<ImageRequest> = {}): ImageRequest {
  return {
    id,
    isHighRes: true,
    hasCompleted: true,
    bitmap: {} as ImageBitmap,
    ...overrides
  } as Partial<ImageRequest> as ImageRequest;
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

describe("GalleryAbstractUpscaler", () => {
  let enabled: Preference<boolean>;
  let quality: Preference<number>;
  let canvases: Map<string, HTMLCanvasElement>;
  let canvasFor: Mock<(id: string) => HTMLCanvasElement | null>;
  let fetchBitmap: Mock<(request: ImageRequest) => Promise<boolean>>;

  beforeEach(() => {
    enabled = preference(true);
    quality = preference(2);
    canvases = new Map();
    canvasFor = vi.fn((id: string) => canvases.get(id) ?? null);
    fetchBitmap = vi.fn().mockResolvedValue(true);
  });

  function createCanvas(id: string): HTMLCanvasElement {
    const canvas = {} as HTMLCanvasElement;

    canvases.set(id, canvas);
    return canvas;
  }

  function createUpscaler(baseCanvasWidth = 100): TestUpscaler {
    return new TestUpscaler(canvasFor, enabled, quality, fetchBitmap, 0, baseCanvasWidth, 5000);
  }

  describe("tryPainting", () => {
    test("paints an eligible request that has a canvas and is complete", () => {
      createCanvas("0");
      const upscaler = createUpscaler();
      const req = request("0");

      upscaler.tryPainting(req);
      expect(upscaler.painted).toEqual([req]);
    });

    test("does not paint when there is no canvas for the request", () => {
      const upscaler = createUpscaler();

      upscaler.tryPainting(request("0"));
      expect(upscaler.painted).toEqual([]);
    });

    test("does not paint a low-resolution request", () => {
      createCanvas("0");
      const upscaler = createUpscaler();

      upscaler.tryPainting(request("0", { isHighRes: false }));
      expect(upscaler.painted).toEqual([]);
    });

    test("does not paint a request whose bitmap has not completed", () => {
      createCanvas("0");
      const upscaler = createUpscaler();

      upscaler.tryPainting(request("0", { hasCompleted: false }));
      expect(upscaler.painted).toEqual([]);
    });

    test("does not paint while disabled", () => {
      createCanvas("0");
      enabled = preference(false);
      const upscaler = createUpscaler();

      upscaler.tryPainting(request("0"));
      expect(upscaler.painted).toEqual([]);
    });

    test("does not paint while paused, and paints again after resume", () => {
      createCanvas("0");
      const upscaler = createUpscaler();

      upscaler.pause();
      upscaler.tryPainting(request("0"));
      expect(upscaler.painted).toEqual([]);
      upscaler.resume();
      const req = request("0");

      upscaler.tryPainting(req);
      expect(upscaler.painted).toEqual([req]);
    });

    test("does not repaint the same canvas at the same width", () => {
      createCanvas("0");
      const upscaler = createUpscaler();

      upscaler.tryPainting(request("0"));
      upscaler.tryPainting(request("0"));

      expect(upscaler.painted).toHaveLength(1);
    });

    test("repaints the same canvas after the upscaled width changes", () => {
      createCanvas("0");
      const upscaler = createUpscaler();

      upscaler.tryPainting(request("0"));
      quality.set(3);
      upscaler.tryPainting(request("0"));

      expect(upscaler.painted).toHaveLength(2);
    });
  });

  describe("eraseAll", () => {
    test("erases every tracked canvas", () => {
      const first = createCanvas("0");
      const second = createCanvas("1");
      const upscaler = createUpscaler();

      upscaler.tryPainting(request("0"));
      upscaler.tryPainting(request("1"));
      upscaler.eraseAll();

      expect(upscaler.erased).toEqual([first, second]);
    });

    test("clears tracking so a canvas can be painted again at the same width", () => {
      createCanvas("0");
      const upscaler = createUpscaler();

      upscaler.tryPainting(request("0"));
      upscaler.eraseAll();
      upscaler.tryPainting(request("0"));

      expect(upscaler.painted).toHaveLength(2);
    });

    test("does not erase a canvas that was never painted", () => {
      createCanvas("0");
      const upscaler = createUpscaler();

      upscaler.eraseAll();

      expect(upscaler.erased).toEqual([]);
    });
  });
});
