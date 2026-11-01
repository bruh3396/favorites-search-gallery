import { LightboxViewport, LightboxViewportClass } from "@/core/features/lightbox/ui/media/lightbox_viewport";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { LightboxZoom } from "@/core/features/lightbox/zoom/lightbox_zoom";
import { MemorySizeObserver } from "@/adapters/memory/ports/size_observer/memory_size_observer";
import { Post } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";
import { Size } from "@/core/utils/geometry/size";
import VIEWPORT_CSS from "@/core/features/lightbox/ui/media/lightbox_viewport.css?inline";
import { createPost } from "@/testing/post";
import { expectClassesStyled } from "@/testing/css_utilities";

const FRAME = { width: 800, height: 600 };

function setup(): {
  root: HTMLElement;
  contentLayer: HTMLElement;
  lightboxZoom: LightboxZoom;
  sizeObserver: MemorySizeObserver;
  close: () => void;
  dispose: () => void;
} {
  const lightboxZoom = new LightboxZoom(
    { minimumScale: 2, maximumScale: 8 },
    {
      currentItem: new Signal<Post | undefined>(createPost()),
      mediaSize: new Signal<Size | undefined>({ width: 400, height: 400 }),
      enabled: new Signal(true)
    }
  );
  const sizeObserver = new MemorySizeObserver();
  const content = document.createElement("canvas");
  const close = vi.fn();
  const handlers = { close, showNext: vi.fn(), showPrevious: vi.fn(), openOriginal: vi.fn() };
  const { result: root, dispose } = render(document, () => (
    <LightboxViewport zoom={lightboxZoom} sizeObserver={sizeObserver} handlers={handlers} closesOnPress={new Signal(false)} contentChild={content} />
  ));

  sizeObserver.resize(root, FRAME);
  return { root, contentLayer: content.parentElement!, lightboxZoom, sizeObserver, close, dispose };
}

function point(type: string, x: number, y: number): PointerEvent {
  return new PointerEvent(type, { button: 0, isPrimary: true, pointerId: 1, clientX: x, clientY: y });
}

function tap(root: HTMLElement, x: number, y: number): void {
  root.dispatchEvent(point("pointerdown", x, y));
  root.dispatchEvent(point("pointerup", x, y));
}

describe("LightboxViewport", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxViewportClass, VIEWPORT_CSS);
  });

  test("sizes the zoom's frame to the viewport", () => {
    const { lightboxZoom } = setup();

    expect(lightboxZoom.canZoom.value).toBe(true);
  });

  test("zooms in at a tap on the media, keeping that point in place", () => {
    const { root, contentLayer } = setup();

    tap(root, 500, 300);
    expect(contentLayer.style.transform).toBe("translate(-500px, -300px) scale(2)");
    expect(root.hasAttribute("data-zoomed")).toBe(true);
    expect(contentLayer.hasAttribute("data-glides")).toBe(true);
  });

  test("closes on a press off the media", () => {
    const { root, close } = setup();

    root.dispatchEvent(point("pointerdown", 50, 300));
    expect(close).toHaveBeenCalledOnce();
  });

  test("zooms around the hovered point", () => {
    const { root, lightboxZoom } = setup();

    root.dispatchEvent(point("pointermove", 500, 300));
    lightboxZoom.toggle();
    expect(lightboxZoom.view.value).toEqual(expect.objectContaining({ x: -500, y: -300 }));
  });

  test("shows the cursor for what a tap would do", () => {
    const { root } = setup();

    root.dispatchEvent(point("pointermove", 400, 300));
    expect(root.dataset.cursor).toBe("zoom-in");
    tap(root, 400, 300);
    expect(root.dataset.cursor).toBe("grab");
    root.dispatchEvent(new PointerEvent("pointerleave"));
    tap(root, 400, 300);
    expect(root.dataset.cursor).toBeUndefined();
  });

  test("marks itself as dragging while panning the zoomed media", () => {
    const { root, contentLayer } = setup();

    root.setPointerCapture = vi.fn();
    tap(root, 400, 300);
    root.dispatchEvent(point("pointerdown", 400, 300));
    root.dispatchEvent(point("pointermove", 420, 300));
    expect(root.hasAttribute("data-dragging")).toBe(true);
    expect(contentLayer.hasAttribute("data-glides")).toBe(false);
    root.dispatchEvent(point("pointerup", 420, 300));
    expect(root.hasAttribute("data-dragging")).toBe(false);
  });

  test("stops sizing the frame once its scope is disposed", () => {
    const { root, lightboxZoom, sizeObserver, dispose } = setup();

    dispose();
    sizeObserver.resize(root, { width: 0, height: 0 });
    expect(lightboxZoom.canZoom.value).toBe(true);
  });
});
