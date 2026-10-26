import { Point } from "@/core/utils/geometry/point";
import { ModifierState } from "@/core/ui/gestures/modifier_state";
import {
    LightboxViewportCommandHandlers,
    createLightboxViewportGestureHandlers,
    resolveLightboxViewportCursor
} from "@/core/features/lightbox/viewport_gestures/viewport_gestures";
import { LightboxZoom, ZoomRect } from "@/core/features/lightbox/zoom/zoom";
import { Mock, describe, expect, test, vi } from "vitest";
import { Signal } from "@/core/utils/reactive/signal";

const NO_MODIFIERS: ModifierState = { shift: false, ctrl: false, alt: false, meta: false };
const ON_MEDIA: Point = { x: 400, y: 300 };
const OFF_MEDIA: Point = { x: 50, y: 300 };

function setup(): {
  zoom: {
    isZoomed: Signal<boolean>;
    canZoom: Signal<boolean>;
    mediaRect: Signal<ZoomRect | undefined>;
    toggle: Mock<LightboxZoom["toggle"]>;
    zoomBy: Mock<LightboxZoom["zoomBy"]>;
    zoomOut: Mock<LightboxZoom["zoomOut"]>;
    panBy: Mock<LightboxZoom["panBy"]>;
  };
  handlers: { [K in keyof LightboxViewportCommandHandlers]: Mock<() => void> };
} {
  return {
    zoom: {
      isZoomed: new Signal(false),
      canZoom: new Signal(true),
      mediaRect: new Signal<ZoomRect | undefined>({ x: 100, y: 0, width: 600, height: 600 }),
      toggle: vi.fn<LightboxZoom["toggle"]>(),
      zoomBy: vi.fn<LightboxZoom["zoomBy"]>(),
      zoomOut: vi.fn<LightboxZoom["zoomOut"]>(),
      panBy: vi.fn<LightboxZoom["panBy"]>()
    },
    handlers: { close: vi.fn(), showNext: vi.fn(), showPrevious: vi.fn(), openOriginal: vi.fn() }
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

describe("createLightboxViewportGestureHandlers", () => {
  describe("canDrag", () => {
    test("drags only while zoomed", () => {
      const { zoom, handlers } = setup();
      const gestures = createLightboxViewportGestureHandlers(zoom, handlers, new Signal(false));

      expect(gestures.canDrag()).toBe(false);
      zoom.isZoomed.value = true;
      expect(gestures.canDrag()).toBe(true);
    });
  });

  describe("onDrag", () => {
    test("pans by the drag", () => {
      const { zoom, handlers } = setup();

      createLightboxViewportGestureHandlers(zoom, handlers, new Signal(false)).onDrag({ point: ON_MEDIA, delta: { x: 5, y: -3 } });
      expect(zoom.panBy).toHaveBeenCalledWith(5, -3);
    });
  });

  describe("onPress", () => {
    test("closes on a press off the media", () => {
      const { zoom, handlers } = setup();

      expect(createLightboxViewportGestureHandlers(zoom, handlers, new Signal(false)).onPress({ point: OFF_MEDIA, modifiers: NO_MODIFIERS })).toBe(true);
      expect(handlers.close).toHaveBeenCalledOnce();
    });

    test("leaves a press on the media to the tap", () => {
      const { zoom, handlers } = setup();

      expect(createLightboxViewportGestureHandlers(zoom, handlers, new Signal(true)).onPress({ point: ON_MEDIA, modifiers: NO_MODIFIERS })).toBe(false);
      expect(handlers.close).not.toHaveBeenCalled();
    });

    test("leaves a press to the tap or drag while zoomed or with ctrl or meta held", () => {
      const { zoom, handlers } = setup();
      const gestures = createLightboxViewportGestureHandlers(zoom, handlers, new Signal(true));

      expect(gestures.onPress({ point: OFF_MEDIA, modifiers: { ...NO_MODIFIERS, ctrl: true } })).toBe(false);
      expect(gestures.onPress({ point: OFF_MEDIA, modifiers: { ...NO_MODIFIERS, meta: true } })).toBe(false);
      zoom.isZoomed.value = true;
      expect(gestures.onPress({ point: OFF_MEDIA, modifiers: NO_MODIFIERS })).toBe(false);
      expect(handlers.close).not.toHaveBeenCalled();
    });

    test("closes on a press anywhere when it can't zoom but closes on press", () => {
      const { zoom, handlers } = setup();

      zoom.canZoom.value = false;
      expect(createLightboxViewportGestureHandlers(zoom, handlers, new Signal(true)).onPress({ point: ON_MEDIA, modifiers: NO_MODIFIERS })).toBe(true);
      expect(handlers.close).toHaveBeenCalledOnce();
    });

    test("does nothing when it can neither zoom nor close on press", () => {
      const { zoom, handlers } = setup();

      zoom.canZoom.value = false;
      expect(createLightboxViewportGestureHandlers(zoom, handlers, new Signal(false)).onPress({ point: OFF_MEDIA, modifiers: NO_MODIFIERS })).toBe(false);
      expect(handlers.close).not.toHaveBeenCalled();
    });
  });

  describe("onTap", () => {
    test.each(["ctrl", "meta"] as const)("opens the original on %s+tap", modifier => {
      const { zoom, handlers } = setup();

      createLightboxViewportGestureHandlers(zoom, handlers, new Signal(false)).onTap({ point: ON_MEDIA, modifiers: { ...NO_MODIFIERS, [modifier]: true } });
      expect(handlers.openOriginal).toHaveBeenCalledOnce();
      expect(zoom.toggle).not.toHaveBeenCalled();
    });

    test("zooms out while zoomed", () => {
      const { zoom, handlers } = setup();

      zoom.isZoomed.value = true;
      createLightboxViewportGestureHandlers(zoom, handlers, new Signal(false)).onTap({ point: OFF_MEDIA, modifiers: NO_MODIFIERS });
      expect(zoom.zoomOut).toHaveBeenCalledOnce();
      expect(handlers.close).not.toHaveBeenCalled();
    });

    test("zooms in at a tap on the media", () => {
      const { zoom, handlers } = setup();

      createLightboxViewportGestureHandlers(zoom, handlers, new Signal(false)).onTap({ point: ON_MEDIA, modifiers: NO_MODIFIERS });
      expect(zoom.toggle).toHaveBeenCalledWith(ON_MEDIA);
    });

    test("does nothing when it can't zoom", () => {
      const { zoom, handlers } = setup();

      zoom.canZoom.value = false;
      createLightboxViewportGestureHandlers(zoom, handlers, new Signal(true)).onTap({ point: ON_MEDIA, modifiers: NO_MODIFIERS });
      expect(zoom.toggle).not.toHaveBeenCalled();
      expect(handlers.close).not.toHaveBeenCalled();
    });
  });

  describe("onWheel", () => {
    test("zooms in on ctrl+wheel up and out on ctrl+wheel down, at the pointer", () => {
      const { zoom, handlers } = setup();
      const gestures = createLightboxViewportGestureHandlers(zoom, handlers, new Signal(false));
      const modifiers = { ...NO_MODIFIERS, ctrl: true };

      expect(gestures.onWheel({ point: ON_MEDIA, delta: { x: 0, y: -100 }, modifiers })).toBe(true);
      expect(gestures.onWheel({ point: ON_MEDIA, delta: { x: 0, y: 100 }, modifiers })).toBe(true);

      const [[zoomIn, point], [zoomOut]] = zoom.zoomBy.mock.calls;

      expect([zoomIn > 1, zoomOut < 1, point]).toEqual([true, true, ON_MEDIA]);
    });

    test("pans against the wheel while zoomed", () => {
      const { zoom, handlers } = setup();

      zoom.isZoomed.value = true;
      expect(createLightboxViewportGestureHandlers(zoom, handlers, new Signal(false)).onWheel({
        point: ON_MEDIA, delta: { x: 10, y: 20 }, modifiers: NO_MODIFIERS
      }))
        .toBe(true);
      expect(zoom.panBy).toHaveBeenCalledWith(-10, -20);
    });

    test("shows the next item on wheel down and the previous on wheel up", () => {
      const { zoom, handlers } = setup();
      const gestures = createLightboxViewportGestureHandlers(zoom, handlers, new Signal(false));

      expect(gestures.onWheel({ point: ON_MEDIA, delta: { x: 0, y: 100 }, modifiers: NO_MODIFIERS })).toBe(true);
      expect(gestures.onWheel({ point: ON_MEDIA, delta: { x: 0, y: -100 }, modifiers: NO_MODIFIERS })).toBe(true);
      expect(handlers.showNext).toHaveBeenCalledOnce();
      expect(handlers.showPrevious).toHaveBeenCalledOnce();
    });

    test("leaves shift+wheel and sideways scrolling to the page", () => {
      const { zoom, handlers } = setup();
      const gestures = createLightboxViewportGestureHandlers(zoom, handlers, new Signal(false));

      expect(gestures.onWheel({ point: ON_MEDIA, delta: { x: 0, y: 100 }, modifiers: { ...NO_MODIFIERS, shift: true } })).toBe(false);
      expect(gestures.onWheel({ point: ON_MEDIA, delta: { x: 100, y: 0 }, modifiers: NO_MODIFIERS })).toBe(false);
      expect(handlers.showNext).not.toHaveBeenCalled();
    });
  });
});
