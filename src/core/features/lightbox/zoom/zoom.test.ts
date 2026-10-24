import { FIT_VIEW, LightboxZoom, ZoomSize, ZoomView } from "@/core/features/lightbox/zoom/zoom";
import { describe, expect, test } from "vitest";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { createPosts } from "@/testing/post";

const POSTS = createPosts("1", "2");
const FRAME = { width: 800, height: 600 };
const SQUARE_MEDIA = { width: 400, height: 400 };

function setup(mediaSize: ZoomSize | undefined): {
  zoom: LightboxZoom;
  currentItem: Signal<Post | undefined>;
  media: Signal<ZoomSize | undefined>;
  enabled: Signal<boolean>;
} {
  const currentItem = new Signal<Post | undefined>(POSTS[0]);
  const media = new Signal<ZoomSize | undefined>(mediaSize);
  const enabled = new Signal(true);
  const zoom = new LightboxZoom({ minimumScale: 2, maximumScale: 8 }, { currentItem, mediaSize: media, enabled });

  zoom.setFrameSize(FRAME);
  return { zoom, currentItem, media, enabled };
}

function readView(zoom: LightboxZoom): ZoomView {
  const { scale, x, y } = zoom.view.value;
  return { scale, x: x + 0, y: y + 0 };
}

describe("LightboxZoom", () => {
  test("starts fitted and ready to zoom", () => {
    const { zoom } = setup(SQUARE_MEDIA);

    expect(zoom.view.value).toEqual(FIT_VIEW);
    expect(zoom.isZoomed.value).toBe(false);
    expect(zoom.canZoom.value).toBe(true);
    expect(zoom.glides.value).toBe(true);
    expect(zoom.pixelScale.value).toBeUndefined();
    expect(zoom.visibleRegion.value).toBeUndefined();
  });

  test("zooms out when disabled and refuses to zoom until enabled again", () => {
    const { zoom, enabled } = setup(SQUARE_MEDIA);

    zoom.toggle();
    enabled.value = false;
    expect(zoom.isZoomed.value).toBe(false);
    zoom.toggle();
    zoom.zoomBy(4, { x: 0, y: 0 });
    expect([zoom.isZoomed.value, zoom.canZoom.value]).toEqual([false, false]);
  });

  test("places the fitted media in the middle of the frame", () => {
    const { zoom } = setup(SQUARE_MEDIA);

    expect(zoom.mediaRect.value).toEqual({ x: 100, y: 0, width: 600, height: 600 });
  });

  test("can't zoom without a media size", () => {
    const { zoom } = setup(undefined);

    expect(zoom.canZoom.value).toBe(false);
    expect(zoom.mediaRect.value).toBeUndefined();
  });

  test("can't zoom without a frame size", () => {
    const { zoom } = setup(SQUARE_MEDIA);

    zoom.setFrameSize({ width: 0, height: 0 });
    expect(zoom.canZoom.value).toBe(false);
  });

  test("zooms out when the current item changes", () => {
    const { zoom, currentItem } = setup(SQUARE_MEDIA);

    zoom.toggle();
    currentItem.value = POSTS[1];
    expect(zoom.isZoomed.value).toBe(false);
  });

  test("zooms out when the media size changes", () => {
    const { zoom, media } = setup(SQUARE_MEDIA);

    zoom.toggle();
    media.value = { width: 200, height: 100 };
    expect(zoom.isZoomed.value).toBe(false);
  });

  test("reports the visible part of the media as fractions", () => {
    const { zoom } = setup(SQUARE_MEDIA);

    zoom.toggle();
    const region = zoom.visibleRegion.value!;

    expect(region.x).toBeCloseTo(1 / 6);
    expect(region.y).toBeCloseTo(0.25);
    expect(region.width).toBeCloseTo(2 / 3);
    expect(region.height).toBeCloseTo(0.5);
  });

  test("clamps the visible region to the media", () => {
    const { zoom } = setup({ width: 100, height: 400 });

    zoom.toggle();
    expect(zoom.visibleRegion.value).toEqual(expect.objectContaining({ x: 0, width: 1 }));
  });

  describe("toggle", () => {
    test("zooms to the minimum scale around the frame's centre", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.toggle();
      expect(readView(zoom)).toEqual({ scale: 2, x: -400, y: -300 });
      expect(zoom.glides.value).toBe(true);
      expect(zoom.pixelScale.value).toBe(3);
      expect(zoom.mediaRect.value).toEqual({ x: -200, y: -300, width: 1_200, height: 1_200 });
    });

    test("keeps the given point in place", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.toggle({ x: 500, y: 300 });
      expect(readView(zoom)).toEqual({ scale: 2, x: -500, y: -300 });
    });

    test("zooms around the focus point when no point is given", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.setFocusPoint({ x: 500, y: 300 });
      zoom.toggle();
      expect(readView(zoom)).toEqual({ scale: 2, x: -500, y: -300 });
    });

    test("keeps the media's edges inside the frame", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.toggle({ x: 100, y: 0 });
      expect(readView(zoom)).toEqual({ scale: 2, x: -200, y: 0 });
    });

    test("zooms to the media's own pixels when they need more than the minimum scale", () => {
      const { zoom } = setup({ width: 3_200, height: 2_400 });

      zoom.toggle();
      expect(zoom.pixelScale.value).toBe(1);
    });

    test("zooms out when zoomed", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.toggle();
      zoom.toggle();
      expect(zoom.isZoomed.value).toBe(false);
      expect(zoom.view.value).toEqual(FIT_VIEW);
    });

    test("does nothing when it can't zoom", () => {
      const { zoom } = setup(undefined);

      zoom.toggle();
      expect(zoom.isZoomed.value).toBe(false);
    });
  });

  describe("zoomBy", () => {
    test("scales the view around the given point without gliding", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.zoomBy(2, { x: 500, y: 300 });
      expect(readView(zoom)).toEqual({ scale: 2, x: -500, y: -300 });
      expect(zoom.glides.value).toBe(false);
    });

    test("caps the scale at the maximum", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.zoomBy(100, { x: 400, y: 300 });
      expect(zoom.view.value.scale).toBe(8);
    });

    test("caps the scale at the media's own pixels when they need more than the maximum", () => {
      const { zoom } = setup({ width: 8_000, height: 6_000 });

      zoom.zoomBy(100, { x: 400, y: 300 });
      expect(zoom.pixelScale.value).toBe(1);
    });

    test("zooms out once the scale falls to the fit", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.zoomBy(2, { x: 400, y: 300 });
      zoom.zoomBy(0.5, { x: 400, y: 300 });
      expect(zoom.isZoomed.value).toBe(false);
    });

    test("does nothing when it can't zoom", () => {
      const { zoom } = setup(undefined);

      zoom.zoomBy(2, { x: 400, y: 300 });
      expect(zoom.isZoomed.value).toBe(false);
    });
  });

  describe("panBy", () => {
    test("moves the view, clamped to the media's edges, without gliding", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.toggle();
      zoom.panBy(50, 1_000);
      expect(readView(zoom)).toEqual({ scale: 2, x: -350, y: 0 });
      expect(zoom.glides.value).toBe(false);
    });

    test("does nothing when not zoomed", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.panBy(50, 50);
      expect(zoom.view.value).toEqual(FIT_VIEW);
    });
  });

  describe("centerAt", () => {
    test("glides the given fraction of the media to the frame's centre, clamped to its edges", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.toggle({ x: 500, y: 300 });
      zoom.centerAt({ x: 0, y: 0 });
      expect(readView(zoom)).toEqual({ scale: 2, x: -200, y: 0 });
      expect(zoom.glides.value).toBe(true);
    });

    test("does nothing when not zoomed", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.centerAt({ x: 0, y: 0 });
      expect(zoom.view.value).toEqual(FIT_VIEW);
    });
  });

  describe("setFrameSize", () => {
    test("clamps the zoomed view to the new frame without gliding", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.toggle();
      zoom.setFrameSize({ width: 200, height: 200 });
      expect(readView(zoom)).toEqual({ scale: 2, x: -200, y: -200 });
      expect(zoom.glides.value).toBe(false);
    });

    test("zooms out when the frame collapses", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.toggle();
      zoom.setFrameSize({ width: 0, height: 0 });
      expect(zoom.isZoomed.value).toBe(false);
    });
  });

  describe("zoomOut", () => {
    test("returns to the fitted view", () => {
      const { zoom } = setup(SQUARE_MEDIA);

      zoom.toggle();
      zoom.zoomOut();
      expect(zoom.view.value).toEqual(FIT_VIEW);
    });
  });
});
