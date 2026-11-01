import { LightboxOverlay, LightboxOverlayClass, LightboxOverlayProps } from "@/core/features/lightbox/ui/chrome/lightbox_overlay";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import OVERLAY_CSS from "@/core/features/lightbox/ui/chrome/lightbox_overlay.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

type SlottedEdge = "topStartChild" | "topEndChild" | "startEdgeChild" | "endEdgeChild";

function setup(): { root: HTMLElement; children: Record<SlottedEdge | "topEdgeChild", HTMLElement>; lightboxOverlayProps: LightboxOverlayProps } {
  const children = {
    topEdgeChild: document.createElement("div"),
    topStartChild: document.createElement("div"),
    topEndChild: document.createElement("div"),
    startEdgeChild: document.createElement("div"),
    endEdgeChild: document.createElement("div")
  };
  const props = { ...children, onSlotEnter: vi.fn(), onSlotLeave: vi.fn() };
  return { root: render(document, () => <LightboxOverlay {...props} />).result, children, lightboxOverlayProps: props };
}

describe("LightboxOverlay", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxOverlayClass, OVERLAY_CSS);
  });

  test("places every child in the overlay", () => {
    const { root, children } = setup();

    expect(Object.values(children).every(child => root.contains(child))).toBe(true);
  });

  test.each<SlottedEdge>(["topStartChild", "topEndChild", "startEdgeChild", "endEdgeChild"])(
    "reports the pointer entering and leaving the %s slot",
    slottedEdge => {
      const { children, lightboxOverlayProps } = setup();
      const slot = children[slottedEdge].parentElement!;

      slot.dispatchEvent(new PointerEvent("pointerenter"));
      expect(lightboxOverlayProps.onSlotEnter).toHaveBeenCalledOnce();
      slot.dispatchEvent(new PointerEvent("pointerleave"));
      expect(lightboxOverlayProps.onSlotLeave).toHaveBeenCalledOnce();
    }
  );
});
