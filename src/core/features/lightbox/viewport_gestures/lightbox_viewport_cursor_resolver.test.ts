import { describe, expect, test } from "vitest";
import { Point } from "@/core/utils/geometry/point";
import { Rect } from "@/core/utils/geometry/rect";
import { Signal } from "@/core/utils/reactive/signal";
import { resolveLightboxViewportCursor } from "@/core/features/lightbox/viewport_gestures/lightbox_viewport_cursor_resolver";

const ON_MEDIA: Point = { x: 400, y: 300 };
const OFF_MEDIA: Point = { x: 50, y: 300 };

function setup(): { zoom: { isZoomed: Signal<boolean>; canZoom: Signal<boolean>; mediaRect: Signal<Rect | undefined> } } {
  return {
    zoom: {
      isZoomed: new Signal(false),
      canZoom: new Signal(true),
      mediaRect: new Signal<Rect | undefined>({ x: 100, y: 0, width: 600, height: 600 })
    }
  };
}

describe("resolveLightboxViewportCursor", () => {
  test("offers to grab while zoomed", () => {
    const { zoom } = setup();

    zoom.isZoomed.value = true;
    expect(resolveLightboxViewportCursor(zoom, undefined)).toBe("grab");
  });

  test("offers to zoom in while hovering the media", () => {
    expect(resolveLightboxViewportCursor(setup().zoom, ON_MEDIA)).toBe("zoom-in");
  });

  test("offers nothing off the media, without a hover, or when it can't zoom", () => {
    const { zoom } = setup();

    expect(resolveLightboxViewportCursor(zoom, OFF_MEDIA)).toBeUndefined();
    expect(resolveLightboxViewportCursor(zoom, undefined)).toBeUndefined();
    zoom.canZoom.value = false;
    expect(resolveLightboxViewportCursor(zoom, ON_MEDIA)).toBeUndefined();
  });

  test("offers nothing before the media is placed", () => {
    const { zoom } = setup();

    zoom.mediaRect.value = undefined;
    expect(resolveLightboxViewportCursor(zoom, ON_MEDIA)).toBeUndefined();
  });
});
