import { FIT_LIGHTBOX_ZOOM_VIEW, LightboxZoom, LightboxZoomView } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { describe, expect, test } from "vitest";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { Size } from "@/core/utils/geometry/size";
import { createPosts } from "@/testing/post";

const POSTS = createPosts("1", "2");
const FRAME = { width: 800, height: 600 };
const SQUARE_MEDIA = { width: 400, height: 400 };

function setup(mediaSize: Size | undefined): {
  lightboxZoom: LightboxZoom;
  currentItem: Signal<Post | undefined>;
  media: Signal<Size | undefined>;
  enabled: Signal<boolean>;
} {
  const currentItem = new Signal<Post | undefined>(POSTS[0]);
  const media = new Signal<Size | undefined>(mediaSize);
  const enabled = new Signal(true);
  const lightboxZoom = new LightboxZoom({ minimumScale: 2, maximumScale: 8 }, { currentItem, mediaSize: media, enabled });

  lightboxZoom.setFrameSize(FRAME);
  return { lightboxZoom, currentItem, media, enabled };
}

function readView(lightboxZoom: LightboxZoom): LightboxZoomView {
  const { scale, x, y } = lightboxZoom.view.value;
  return { scale, x: x + 0, y: y + 0 };
}

describe("LightboxZoom", () => {
  test("starts fitted and ready to zoom", () => {
    const { lightboxZoom } = setup(SQUARE_MEDIA);

    expect(lightboxZoom.view.value).toEqual(FIT_LIGHTBOX_ZOOM_VIEW);
    expect(lightboxZoom.isZoomed.value).toBe(false);
    expect(lightboxZoom.canZoom.value).toBe(true);
    expect(lightboxZoom.glides.value).toBe(true);
    expect(lightboxZoom.pixelScale.value).toBeUndefined();
    expect(lightboxZoom.visibleRegion.value).toBeUndefined();
  });

  test("zooms out when disabled and refuses to zoom until enabled again", () => {
    const { lightboxZoom, enabled } = setup(SQUARE_MEDIA);

    lightboxZoom.toggle();
    enabled.value = false;
    expect(lightboxZoom.isZoomed.value).toBe(false);
    lightboxZoom.toggle();
    lightboxZoom.zoomBy(4, { x: 0, y: 0 });
    expect([lightboxZoom.isZoomed.value, lightboxZoom.canZoom.value]).toEqual([false, false]);
  });

  test("places the fitted media in the middle of the frame", () => {
    const { lightboxZoom } = setup(SQUARE_MEDIA);

    expect(lightboxZoom.mediaRect.value).toEqual({ x: 100, y: 0, width: 600, height: 600 });
  });

  test("can't zoom without a media size", () => {
    const { lightboxZoom } = setup(undefined);

    expect(lightboxZoom.canZoom.value).toBe(false);
    expect(lightboxZoom.mediaRect.value).toBeUndefined();
  });

  test("can't zoom without a frame size", () => {
    const { lightboxZoom } = setup(SQUARE_MEDIA);

    lightboxZoom.setFrameSize({ width: 0, height: 0 });
    expect(lightboxZoom.canZoom.value).toBe(false);
  });

  test("zooms out when the current item changes", () => {
    const { lightboxZoom, currentItem } = setup(SQUARE_MEDIA);

    lightboxZoom.toggle();
    currentItem.value = POSTS[1];
    expect(lightboxZoom.isZoomed.value).toBe(false);
  });

  test("zooms out when the media size changes", () => {
    const { lightboxZoom, media } = setup(SQUARE_MEDIA);

    lightboxZoom.toggle();
    media.value = { width: 200, height: 100 };
    expect(lightboxZoom.isZoomed.value).toBe(false);
  });

  test("reports the visible part of the media as fractions", () => {
    const { lightboxZoom } = setup(SQUARE_MEDIA);

    lightboxZoom.toggle();
    const currentVisibleRegion = lightboxZoom.visibleRegion.value!;

    expect(currentVisibleRegion.x).toBeCloseTo(1 / 6);
    expect(currentVisibleRegion.y).toBeCloseTo(0.25);
    expect(currentVisibleRegion.width).toBeCloseTo(2 / 3);
    expect(currentVisibleRegion.height).toBeCloseTo(0.5);
  });

  test("clamps the visible region to the media", () => {
    const { lightboxZoom } = setup({ width: 100, height: 400 });

    lightboxZoom.toggle();
    expect(lightboxZoom.visibleRegion.value).toEqual(expect.objectContaining({ x: 0, width: 1 }));
  });

  describe("toggle", () => {
    test("zooms to the minimum scale around the frame's centre", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.toggle();
      expect(readView(lightboxZoom)).toEqual({ scale: 2, x: -400, y: -300 });
      expect(lightboxZoom.glides.value).toBe(true);
      expect(lightboxZoom.pixelScale.value).toBe(3);
      expect(lightboxZoom.mediaRect.value).toEqual({ x: -200, y: -300, width: 1_200, height: 1_200 });
    });

    test("keeps the given point in place", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.toggle({ x: 500, y: 300 });
      expect(readView(lightboxZoom)).toEqual({ scale: 2, x: -500, y: -300 });
    });

    test("zooms around the focus point when no point is given", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.setFocusPoint({ x: 500, y: 300 });
      lightboxZoom.toggle();
      expect(readView(lightboxZoom)).toEqual({ scale: 2, x: -500, y: -300 });
    });

    test("keeps the media's edges inside the frame", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.toggle({ x: 100, y: 0 });
      expect(readView(lightboxZoom)).toEqual({ scale: 2, x: -200, y: 0 });
    });

    test("zooms to the media's own pixels when they need more than the minimum scale", () => {
      const { lightboxZoom } = setup({ width: 3_200, height: 2_400 });

      lightboxZoom.toggle();
      expect(lightboxZoom.pixelScale.value).toBe(1);
    });

    test("zooms out when zoomed", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.toggle();
      lightboxZoom.toggle();
      expect(lightboxZoom.isZoomed.value).toBe(false);
      expect(lightboxZoom.view.value).toEqual(FIT_LIGHTBOX_ZOOM_VIEW);
    });

    test("does nothing when it can't zoom", () => {
      const { lightboxZoom } = setup(undefined);

      lightboxZoom.toggle();
      expect(lightboxZoom.isZoomed.value).toBe(false);
    });
  });

  describe("zoomBy", () => {
    test("scales the view around the given point without gliding", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.zoomBy(2, { x: 500, y: 300 });
      expect(readView(lightboxZoom)).toEqual({ scale: 2, x: -500, y: -300 });
      expect(lightboxZoom.glides.value).toBe(false);
    });

    test("caps the scale at the maximum", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.zoomBy(100, { x: 400, y: 300 });
      expect(lightboxZoom.view.value.scale).toBe(8);
    });

    test("caps the scale at the media's own pixels when they need more than the maximum", () => {
      const { lightboxZoom } = setup({ width: 8_000, height: 6_000 });

      lightboxZoom.zoomBy(100, { x: 400, y: 300 });
      expect(lightboxZoom.pixelScale.value).toBe(1);
    });

    test("zooms out once the scale falls to the fit", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.zoomBy(2, { x: 400, y: 300 });
      lightboxZoom.zoomBy(0.5, { x: 400, y: 300 });
      expect(lightboxZoom.isZoomed.value).toBe(false);
    });

    test("does nothing when it can't zoom", () => {
      const { lightboxZoom } = setup(undefined);

      lightboxZoom.zoomBy(2, { x: 400, y: 300 });
      expect(lightboxZoom.isZoomed.value).toBe(false);
    });
  });

  describe("panBy", () => {
    test("moves the view, clamped to the media's edges, without gliding", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.toggle();
      lightboxZoom.panBy(50, 1_000);
      expect(readView(lightboxZoom)).toEqual({ scale: 2, x: -350, y: 0 });
      expect(lightboxZoom.glides.value).toBe(false);
    });

    test("does nothing when not zoomed", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.panBy(50, 50);
      expect(lightboxZoom.view.value).toEqual(FIT_LIGHTBOX_ZOOM_VIEW);
    });
  });

  describe("centerAt", () => {
    test("glides the given fraction of the media to the frame's centre, clamped to its edges", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.toggle({ x: 500, y: 300 });
      lightboxZoom.centerAt({ x: 0, y: 0 });
      expect(readView(lightboxZoom)).toEqual({ scale: 2, x: -200, y: 0 });
      expect(lightboxZoom.glides.value).toBe(true);
    });

    test("does nothing when not zoomed", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.centerAt({ x: 0, y: 0 });
      expect(lightboxZoom.view.value).toEqual(FIT_LIGHTBOX_ZOOM_VIEW);
    });
  });

  describe("setFrameSize", () => {
    test("clamps the zoomed view to the new frame without gliding", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.toggle();
      lightboxZoom.setFrameSize({ width: 200, height: 200 });
      expect(readView(lightboxZoom)).toEqual({ scale: 2, x: -200, y: -200 });
      expect(lightboxZoom.glides.value).toBe(false);
    });

    test("zooms out when the frame collapses", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.toggle();
      lightboxZoom.setFrameSize({ width: 0, height: 0 });
      expect(lightboxZoom.isZoomed.value).toBe(false);
    });
  });

  describe("zoomOut", () => {
    test("returns to the fitted view", () => {
      const { lightboxZoom } = setup(SQUARE_MEDIA);

      lightboxZoom.toggle();
      lightboxZoom.zoomOut();
      expect(lightboxZoom.view.value).toEqual(FIT_LIGHTBOX_ZOOM_VIEW);
    });
  });
});
