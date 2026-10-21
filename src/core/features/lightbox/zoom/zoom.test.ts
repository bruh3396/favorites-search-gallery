import { FIT_VIEW, LightboxZoom, ZoomFrame } from "@/core/features/lightbox/zoom/zoom";
import { describe, expect, onTestFinished, test } from "vitest";
import { MediaItem } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";

const IMAGE: MediaItem = { id: "1", media: { kind: "image", locator: "images/1" } };
const GIF: MediaItem = { id: "2", media: { kind: "gif", locator: "images/2.gif" } };
const VIDEO: MediaItem = { id: "3", media: { kind: "video", locator: "videos/3.mp4" } };

// A 1000x2000 image fits a 1000x500 frame at a quarter size, 250 wide and centered at x 375.
const TALL_FRAME: ZoomFrame = { width: 1_000, height: 500, mediaWidth: 1_000, mediaHeight: 2_000 };
const LARGE_FRAME: ZoomFrame = { width: 1_000, height: 500, mediaWidth: 4_000, mediaHeight: 2_000 };
const SMALL_FRAME: ZoomFrame = { width: 1_000, height: 500, mediaWidth: 100, mediaHeight: 50 };

interface Setup {
  zoom: LightboxZoom;
  current: Signal<MediaItem | undefined>;
}

function setup(item: MediaItem | undefined = IMAGE, frame: ZoomFrame = TALL_FRAME): Setup {
  const current = new Signal<MediaItem | undefined>(item);
  const zoom = new LightboxZoom({ minimumScale: 2 }, { current });

  zoom.setFrame(frame);
  onTestFinished(() => zoom.dispose());
  return { zoom, current };
}

describe("LightboxZoom", () => {
  test("starts fitted", () => {
    const { zoom } = setup();

    expect([zoom.view.value, zoom.isZoomed.value]).toEqual([FIT_VIEW, false]);
  });

  test("zooms images and GIFs but not videos", () => {
    expect([IMAGE, GIF, VIDEO].map(item => setup(item).zoom.canZoom.value)).toEqual([true, true, false]);
  });

  test("tells which way a toggle would zoom, and nothing for a video", () => {
    const { zoom } = setup();
    const directions = [zoom.toggleDirection.value];

    zoom.toggle();
    directions.push(zoom.toggleDirection.value, setup(VIDEO).zoom.toggleDirection.value);
    expect(directions).toEqual(["in", "out", undefined]);
  });

  describe("setFrame", () => {
    test("keeps the view inside a frame that shrinks", () => {
      const { zoom } = setup(IMAGE, LARGE_FRAME);

      zoom.toggle({ x: 1_000, y: 500 });
      zoom.setFrame({ ...LARGE_FRAME, width: 500, height: 250 });
      expect([zoom.view.value.x, zoom.view.value.y, zoom.glides.value]).toEqual([-1_500, -750, false]);
    });

    test("measures magnification against the media shown now", () => {
      const { zoom } = setup(IMAGE, LARGE_FRAME);

      zoom.toggle();
      zoom.setFrame({ ...LARGE_FRAME, mediaWidth: 8_000, mediaHeight: 4_000 });
      expect(zoom.magnification.value).toBe(0.5);
    });

    test("zooms out when the frame loses its size", () => {
      const { zoom } = setup();

      zoom.toggle();
      zoom.setFrame({ ...TALL_FRAME, width: 0, height: 0 });
      expect(zoom.isZoomed.value).toBe(false);
    });
  });

  describe("toggle", () => {
    test("zooms to actual pixels, keeping the pointed-at spot under the pointer", () => {
      const { zoom } = setup();

      zoom.toggle({ x: 500, y: 250 });
      expect(zoom.view.value.scale).toBe(4);
      expect(zoom.view.value.x).toBe(500 - (500 * 4));
    });

    test("zooms an image smaller than the frame to the minimum scale", () => {
      const { zoom } = setup(IMAGE, SMALL_FRAME);

      zoom.toggle();
      expect(zoom.view.value.scale).toBe(2);
    });

    test("keeps the image's edges past the frame's edges", () => {
      const { zoom } = setup();

      zoom.toggle({ x: 0, y: 0 });
      expect([zoom.view.value.x, zoom.view.value.y]).toEqual([-375 * 4, 0]);
    });

    test("zooms back out when zoomed", () => {
      const { zoom } = setup();

      zoom.toggle();
      zoom.toggle();
      expect([zoom.view.value, zoom.isZoomed.value]).toEqual([FIT_VIEW, false]);
    });

    test("ignores a video, media that hasn't loaded, and a frame with no size", () => {
      const video = setup(VIDEO).zoom;
      const unloaded = setup(IMAGE, { ...TALL_FRAME, mediaWidth: 0, mediaHeight: 0 }).zoom;
      const unlaidOut = setup(IMAGE, { ...TALL_FRAME, width: 0, height: 0 }).zoom;

      [video, unloaded, unlaidOut].forEach(zoom => zoom.toggle());
      expect([video, unloaded, unlaidOut].map(zoom => zoom.isZoomed.value)).toEqual([false, false, false]);
    });
  });

  describe("zoomBy", () => {
    test("scales the view by the factor, keeping the pointed-at spot under the pointer", () => {
      const { zoom } = setup(IMAGE, LARGE_FRAME);

      zoom.zoomBy(1.5, { x: 0, y: 0 });
      zoom.zoomBy(2, { x: 0, y: 0 });
      expect(zoom.view.value).toEqual({ scale: 3, x: 0, y: 0 });
    });

    test("stops at twice the scale a toggle zooms to", () => {
      const { zoom } = setup(IMAGE, LARGE_FRAME);

      zoom.zoomBy(100);
      expect(zoom.view.value.scale).toBe(8);
    });

    test("fits again once the scale gets back down to fitted", () => {
      const { zoom } = setup(IMAGE, LARGE_FRAME);

      zoom.zoomBy(1.5);
      zoom.zoomBy(0.5);
      expect([zoom.view.value, zoom.isZoomed.value]).toEqual([FIT_VIEW, false]);
    });

    test("ignores a video", () => {
      const { zoom } = setup(VIDEO);

      zoom.zoomBy(2);
      expect(zoom.isZoomed.value).toBe(false);
    });
  });

  describe("panBy", () => {
    test("moves the view, stopping at the image's edges", () => {
      const { zoom } = setup(IMAGE, LARGE_FRAME);

      zoom.toggle();
      zoom.panBy(100, -50);
      expect([zoom.view.value.x, zoom.view.value.y]).toEqual([-1_400, -800]);
      zoom.panBy(10_000, 10_000);
      expect([zoom.view.value.x, zoom.view.value.y]).toEqual([0, 0]);
    });

    test("keeps an axis the image doesn't fill centered", () => {
      const { zoom } = setup();

      zoom.toggle({ x: 500, y: 250 });
      zoom.panBy(100, 0);
      expect(zoom.view.value.x).toBe(-375 * 4);
    });

    test("does nothing while fitted", () => {
      const { zoom } = setup();

      zoom.panBy(100, 100);
      expect(zoom.view.value).toEqual(FIT_VIEW);
    });
  });

  test("glides through a toggle and a zoom out, but follows the wheel and drags at once", () => {
    const { zoom } = setup(IMAGE, LARGE_FRAME);
    const glides: boolean[] = [];

    zoom.toggle();
    glides.push(zoom.glides.value);
    zoom.panBy(10, 0);
    glides.push(zoom.glides.value);
    zoom.zoomBy(1.5);
    glides.push(zoom.glides.value);
    zoom.zoomOut();
    glides.push(zoom.glides.value);
    expect(glides).toEqual([true, false, false, true]);
  });

  test("reports how many screen pixels show each media pixel, only while zoomed", () => {
    const { zoom } = setup();
    const magnifications: (number | undefined)[] = [zoom.magnification.value];

    zoom.toggle();
    magnifications.push(zoom.magnification.value);
    zoom.zoomBy(2);
    magnifications.push(zoom.magnification.value);
    expect(magnifications).toEqual([undefined, 1, 2]);
  });

  test("reports the part of the image in view, as fractions of it, only while zoomed", () => {
    const { zoom } = setup(IMAGE, LARGE_FRAME);
    const regions = [zoom.visibleRegion.value];

    zoom.toggle();
    regions.push(zoom.visibleRegion.value);
    zoom.zoomOut();
    zoom.setFrame(TALL_FRAME);
    zoom.toggle();
    regions.push(zoom.visibleRegion.value);
    expect(regions).toEqual([
      undefined,
      { left: 0.375, top: 0.375, width: 0.25, height: 0.25 },
      { left: 0, top: 0.375, width: 1, height: 0.25 }
    ]);
  });

  test("fits again after stepping to another item, even when stepping back", () => {
    const { zoom, current } = setup();

    zoom.toggle();
    current.value = GIF;
    current.value = IMAGE;
    expect(zoom.isZoomed.value).toBe(false);
  });
});
