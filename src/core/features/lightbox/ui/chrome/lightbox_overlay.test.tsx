import { LightboxOverlay, LightboxOverlayClass, LightboxOverlayProps } from "@/core/features/lightbox/ui/chrome/lightbox_overlay";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import OVERLAY_CSS from "@/core/features/lightbox/ui/chrome/lightbox_overlay.css?inline";
import { expectClassesStyled } from "@/testing/css";

type SlottedEdge = "topStart" | "topEnd" | "startEdge" | "endEdge";

function setup(): { root: HTMLElement; children: Record<SlottedEdge | "topEdge", HTMLElement>; props: LightboxOverlayProps } {
  const children = {
    topEdge: document.createElement("div"),
    topStart: document.createElement("div"),
    topEnd: document.createElement("div"),
    startEdge: document.createElement("div"),
    endEdge: document.createElement("div")
  };
  const props = { ...children, onSlotEnter: vi.fn(), onSlotLeave: vi.fn() };
  return { root: render(document, () => <LightboxOverlay {...props} />).result, children, props };
}

describe("LightboxOverlay", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxOverlayClass, OVERLAY_CSS);
  });

  test("places every child in the overlay", () => {
    const { root, children } = setup();

    expect(Object.values(children).every(child => root.contains(child))).toBe(true);
  });

  test.each<SlottedEdge>(["topStart", "topEnd", "startEdge", "endEdge"])("reports the pointer entering and leaving the %s slot", edge => {
    const { children, props } = setup();
    const slot = children[edge].parentElement!;

    slot.dispatchEvent(new PointerEvent("pointerenter"));
    expect(props.onSlotEnter).toHaveBeenCalledOnce();
    slot.dispatchEvent(new PointerEvent("pointerleave"));
    expect(props.onSlotLeave).toHaveBeenCalledOnce();
  });
});
