import { LightboxDetailsPanel, LightboxDetailsPanelClass, LightboxDetailsPanelProps } from "@/core/features/lightbox/details/lightbox_details_panel";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import DETAILS_PANEL_CSS from "@/core/features/lightbox/details/lightbox_details_panel.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

function setup(partialLightboxDetailsPanelProps: Partial<LightboxDetailsPanelProps> = {}): {
  panel: HTMLElement;
  isOpen: Signal<boolean>;
  lightboxDetailsPanelProps: LightboxDetailsPanelProps;
} {
  const isOpen = new Signal(false);
  const lightboxDetailsPanelProps: LightboxDetailsPanelProps = {
    isOpen,
    contentChild: "content",
    onPointerenter: vi.fn(),
    onPointerleave: vi.fn(),
    ...partialLightboxDetailsPanelProps
  };
  const { result: panel } = render(document, () => <LightboxDetailsPanel {...lightboxDetailsPanelProps} /> as HTMLElement);
  return { panel, isOpen, lightboxDetailsPanelProps };
}

describe("LightboxDetailsPanel", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxDetailsPanelClass, DETAILS_PANEL_CSS);
  });

  test("shows its content", () => {
    expect(setup().panel.textContent).toContain("content");
  });

  test("shows its title and its trailing slot", () => {
    const trailingChild = document.createElement("button");
    const { panel } = setup({ titleChild: "#12", trailingChild });

    expect([panel.textContent!.includes("#12"), panel.contains(trailingChild)]).toEqual([true, true]);
  });

  test("keeps its controls outside the scrolling content", () => {
    const { panel } = setup({ controlsChild: "controls" });

    expect(panel.querySelector(`.${LightboxDetailsPanelClass.content}`)!.textContent).not.toContain("controls");
    expect(panel.textContent).toContain("controls");
  });

  test("stays inert while closed and turns interactive while open", () => {
    const { panel, isOpen } = setup();

    expect(panel.inert).toBe(true);
    expect(panel.hasAttribute("data-open")).toBe(false);
    isOpen.value = true;
    expect(panel.inert).toBe(false);
    expect(panel.hasAttribute("data-open")).toBe(true);
  });

  test("reports the pointer entering and leaving", () => {
    const { panel, lightboxDetailsPanelProps } = setup();

    panel.dispatchEvent(new PointerEvent("pointerenter"));
    panel.dispatchEvent(new PointerEvent("pointerleave"));
    expect(lightboxDetailsPanelProps.onPointerenter).toHaveBeenCalledOnce();
    expect(lightboxDetailsPanelProps.onPointerleave).toHaveBeenCalledOnce();
  });
});
