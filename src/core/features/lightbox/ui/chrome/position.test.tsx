import { LightboxPosition, LightboxPositionClass, LightboxPositionToggle } from "@/core/features/lightbox/ui/chrome/position";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import POSITION_CSS from "@/core/features/lightbox/ui/chrome/position.css?inline";
import { SequencePosition } from "@/core/domain/media/media_sequence";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

function renderPosition(position: SequencePosition | undefined, toggle?: LightboxPositionToggle): HTMLElement {
  return render(document, () => <LightboxPosition position={new Signal(position)} toggle={toggle} />).result as HTMLElement;
}

function createToggle(overrides: Partial<LightboxPositionToggle> = {}): LightboxPositionToggle {
  return { isOn: new Signal(false), label: "Details", onClick: vi.fn(), ...overrides };
}

describe("LightboxPosition", () => {
  test("styles every class it sets", () => {
    expectClassesStyled(LightboxPositionClass, POSITION_CSS);
  });

  test("shows the one-based position out of the total", () => {
    expect(renderPosition({ index: 2, total: 10 }).textContent).toBe("3 / 10");
  });

  test("shows only the position while the total is unknown", () => {
    expect(renderPosition({ index: 2, total: undefined }).textContent).toBe("3");
  });

  test("formats large numbers for the locale", () => {
    expect(renderPosition({ index: 999, total: 12_345 }).textContent).toBe(`${(1_000).toLocaleString()} / ${(12_345).toLocaleString()}`);
  });

  test("shows nothing without a position", () => {
    expect(renderPosition(undefined).textContent).toBe("");
  });

  test("renders plain text without a toggle", () => {
    expect(renderPosition({ index: 0, total: 1 }).tagName).toBe("SPAN");
  });

  test("runs the toggle on a click", () => {
    const toggle = createToggle();

    renderPosition({ index: 0, total: 1 }, toggle).click();
    expect(toggle.onClick).toHaveBeenCalledOnce();
  });

  test("reports the toggle's state as pressed", () => {
    const isOn = new Signal(false);
    const button = renderPosition({ index: 0, total: 1 }, createToggle({ isOn }));

    expect(button.getAttribute("aria-pressed")).toBe("false");
    isOn.value = true;
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  test("names the toggle's shortcut in its tooltip", () => {
    const button = renderPosition({ index: 0, total: 1 }, createToggle({ shortcut: { text: "I", ariaName: "I" } }));

    expect(button.title).toBe("Details (I)");
    expect(button.getAttribute("aria-keyshortcuts")).toBe("I");
  });

  test("uses the label alone without a shortcut", () => {
    expect(renderPosition({ index: 0, total: 1 }, createToggle()).title).toBe("Details");
  });
});
