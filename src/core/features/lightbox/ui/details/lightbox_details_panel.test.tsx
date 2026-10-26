import { LightboxDetailsPanel, LightboxDetailsPanelClass, LightboxDetailsPanelProps } from "@/core/features/lightbox/ui/details/lightbox_details_panel";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import DETAILS_PANEL_CSS from "@/core/features/lightbox/ui/details/lightbox_details_panel.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function setup(overrides: Partial<LightboxDetailsPanelProps> = {}): { panel: HTMLElement; isOpen: Signal<boolean>; props: LightboxDetailsPanelProps } {
  const isOpen = new Signal(false);
  const props: LightboxDetailsPanelProps = {
    isOpen,
    content: "content",
    onClose: vi.fn(),
    onPointerenter: vi.fn(),
    onPointerleave: vi.fn(),
    ...overrides
  };
  const { result: panel } = render(document, () => <LightboxDetailsPanel {...props} /> as HTMLElement);
  return { panel, isOpen, props };
}

describe("LightboxDetailsPanel", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxDetailsPanelClass, DETAILS_PANEL_CSS);
  });

  test("shows its content", () => {
    expect(setup().panel.textContent).toContain("content");
  });

  test("shows its title beside the close button", () => {
    const { panel } = setup({ title: "#12" });
    const closeButton = panel.querySelector("[aria-label=\"Hide details\"]")!;

    expect(closeButton.parentElement!.textContent).toContain("#12");
  });

  test("keeps its controls outside the scrolling content", () => {
    const { panel } = setup({ controls: "controls" });

    expect(panel.querySelector(`.${LightboxDetailsPanelClass.content}`)!.textContent).not.toContain("controls");
    expect(panel.textContent).toContain("controls");
  });

  test("is inert while closed and interactive while open", () => {
    const { panel, isOpen } = setup();

    expect(panel.inert).toBe(true);
    expect(panel.hasAttribute("data-open")).toBe(false);
    isOpen.value = true;
    expect(panel.inert).toBe(false);
    expect(panel.hasAttribute("data-open")).toBe(true);
  });

  test("closes from its close button", () => {
    const { panel, props } = setup();

    panel.querySelector<HTMLButtonElement>("[aria-label=\"Hide details\"]")!.click();
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  test("reports the pointer entering and leaving", () => {
    const { panel, props } = setup();

    panel.dispatchEvent(new PointerEvent("pointerenter"));
    panel.dispatchEvent(new PointerEvent("pointerleave"));
    expect(props.onPointerenter).toHaveBeenCalledOnce();
    expect(props.onPointerleave).toHaveBeenCalledOnce();
  });
});
