import { Chip, ChipClass } from "@/core/ui/components/chip/chip";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import CHIP_CSS from "@/core/ui/components/chip/chip.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

describe("Chip", () => {
  test("shows its label alone", () => {
    const { result } = render(document, () => <Chip label="Invert" highlighted={new Signal(false)} />);

    expect(result.textContent).toBe("Invert");
  });

  test("shows its label and follows its value", () => {
    const value = new Signal("All");
    const { result } = render(document, () => <Chip label="Status" value={value} highlighted={new Signal(false)} />);

    value.value = "Gone";
    expect(result.textContent).toBe("StatusGone");
  });

  test("follows whether it is highlighted", () => {
    const highlighted = new Signal(false);
    const { result } = render(document, () => <Chip label="Invert" highlighted={highlighted} />);

    highlighted.value = true;
    expect(result.dataset.highlighted).toBe("true");
  });

  test("reports being pressed only when given a pressed state", () => {
    const pressed = new Signal(false);
    const { result: pressableChip } = render(document, () => <Chip label="Invert" highlighted={pressed} pressed={pressed} />);
    const { result: plainChip } = render(document, () => <Chip label="Sort" highlighted={pressed} />);

    pressed.value = true;
    expect([pressableChip.getAttribute("aria-pressed"), plainChip.hasAttribute("aria-pressed")]).toEqual(["true", false]);
  });

  test("reports clicks", () => {
    const onClick = vi.fn();
    const { result } = render(document, () => <Chip label="Shuffle" highlighted={new Signal(false)} onClick={onClick} />);

    result.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  test("shows what it is given after its label", () => {
    const { result } = render(document, () => <Chip label="Sort" highlighted={new Signal(false)}>{"!"}</Chip>);

    expect(result.textContent).toBe("Sort!");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(ChipClass, CHIP_CSS);
  });
});
