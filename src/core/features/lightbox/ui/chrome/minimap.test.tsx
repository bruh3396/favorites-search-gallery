import { LightboxMinimap, LightboxMinimapClass } from "@/core/features/lightbox/ui/chrome/minimap";
import { ZoomRect, ZoomRegion } from "@/core/features/lightbox/zoom/zoom";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import MINIMAP_CSS from "@/core/features/lightbox/ui/chrome/minimap.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

const MINIMAP_SIZE = { width: 100, height: 50 };

function setup(): {
  root: HTMLElement;
  marker: HTMLElement;
  previewUrl: Signal<string | undefined>;
  visibleRegion: Signal<ZoomRegion | undefined>;
  mediaRect: Signal<ZoomRect | undefined>;
  panBy: ReturnType<typeof vi.fn>;
  centerAt: ReturnType<typeof vi.fn>;
} {
  const previewUrl = new Signal<string | undefined>("https://example.com/thumb.jpg");
  const visibleRegion = new Signal<ZoomRegion | undefined>({ x: 0.25, y: 0.5, width: 0.5, height: 0.25 });
  const mediaRect = new Signal<ZoomRect | undefined>({ x: 0, y: 0, width: 1_000, height: 500 });
  const panBy = vi.fn();
  const centerAt = vi.fn();
  const { result: root } = render(document, () => <LightboxMinimap previewUrl={previewUrl} zoom={{ visibleRegion, mediaRect, panBy, centerAt }} />);
  const [image, marker] = root.children as unknown as [HTMLImageElement, HTMLElement];

  Object.defineProperties(image, { clientWidth: { value: MINIMAP_SIZE.width }, clientHeight: { value: MINIMAP_SIZE.height } });
  root.setPointerCapture = vi.fn();
  return { root, marker, previewUrl, visibleRegion, mediaRect, panBy, centerAt };
}

function point(type: string, x: number, y: number): PointerEvent {
  return new PointerEvent(type, { button: 0, isPrimary: true, pointerId: 1, clientX: x, clientY: y });
}

describe("LightboxMinimap", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxMinimapClass, MINIMAP_CSS);
  });

  test("shows the preview and hides while nothing is zoomed", () => {
    const { root, visibleRegion } = setup();

    expect(root.hidden).toBe(false);
    expect(root.querySelector("img")?.getAttribute("src")).toBe("https://example.com/thumb.jpg");
    visibleRegion.value = undefined;
    expect(root.hidden).toBe(true);
  });

  test("leaves the preview's source empty without a preview", () => {
    const { root, previewUrl } = setup();

    previewUrl.value = undefined;
    expect(root.querySelector("img")?.getAttribute("src")).toBe("");
  });

  test("marks the visible region", () => {
    const { marker, visibleRegion } = setup();

    expect([marker.style.left, marker.style.top, marker.style.width, marker.style.height]).toEqual(["25%", "50%", "50%", "25%"]);
    visibleRegion.value = { x: 0, y: 0, width: 1, height: 1 };
    expect([marker.style.left, marker.style.width]).toEqual(["0%", "100%"]);
  });

  test("centres the media at the tapped point", () => {
    const { root, centerAt } = setup();

    root.dispatchEvent(point("pointerdown", 25, 10));
    root.dispatchEvent(point("pointerup", 25, 10));
    expect(centerAt).toHaveBeenCalledWith({ x: 0.25, y: 0.2 });
  });

  test("pans the media against a drag, scaled from the minimap to the media", () => {
    const { root, panBy } = setup();

    root.dispatchEvent(point("pointerdown", 10, 10));
    root.dispatchEvent(point("pointermove", 20, 15));
    expect(panBy).toHaveBeenCalledWith(-100, -50);
    expect(root.hasAttribute("data-dragging")).toBe(true);
    root.dispatchEvent(point("pointerup", 20, 15));
    expect(root.hasAttribute("data-dragging")).toBe(false);
  });

  test("ignores a drag before the media is placed", () => {
    const { root, mediaRect, panBy } = setup();

    mediaRect.value = undefined;
    root.dispatchEvent(point("pointerdown", 10, 10));
    root.dispatchEvent(point("pointermove", 20, 15));
    expect(panBy).not.toHaveBeenCalled();
  });

  test("leaves the wheel to the page", () => {
    const { root } = setup();
    const event = new WheelEvent("wheel", { deltaY: 100, cancelable: true });

    root.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
