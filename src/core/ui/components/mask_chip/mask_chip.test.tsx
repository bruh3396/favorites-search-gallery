import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { MaskChip } from "@/core/ui/components/mask_chip/mask_chip";
import { OptionMenuClass } from "@/core/ui/components/option_menu/option_menu";
import { Signal } from "@/core/utils/reactive/signal";

const CONTROL_CHOICES = [
  { value: 1, label: "One" },
  { value: 2, label: "Two" },
  { value: 4, label: "Four" }
];

interface Setup {
  chip: HTMLElement;
  value: Signal<number>;
  onValueChange: Mock<(value: number) => void>;
}

function setup(initialMask: number): Setup {
  const value = new Signal(initialMask);
  const onValueChange = vi.fn<(nextMask: number) => void>();
  const { result: chip, dispose } = render(document, () => (
    <MaskChip label="Status" controlChoices={CONTROL_CHOICES} value={value} onValueChange={onValueChange} />
  ));
  const container = document.createElement("div");

  container.append(chip);
  document.body.append(container);
  onTestFinished(() => {
    dispose();
    container.remove();
  });
  return { chip, value, onValueChange };
}

function queryOptions(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`.${OptionMenuClass.option}`)];
}

describe("MaskChip", () => {
  test("shows All without a highlight when every choice is allowed", () => {
    const { chip } = setup(7);

    expect(chip.textContent).toBe("StatusAll");
    expect(chip.dataset.highlighted).toBe("false");
  });

  test("names the allowed choices and highlights when narrowed", () => {
    const { chip } = setup(5);

    expect(chip.textContent).toBe("StatusOne, Four");
    expect(chip.dataset.highlighted).toBe("true");
  });

  test("follows its value", () => {
    const { chip, value } = setup(7);

    value.value = 2;
    expect(chip.textContent).toBe("StatusTwo");
  });

  test("marks the allowed choices in its menu", () => {
    const { chip } = setup(5);

    chip.click();
    expect(queryOptions().map(option => option.getAttribute("aria-selected"))).toEqual(["true", "false", "true"]);
  });

  test("reports the mask with a chosen choice flipped and stays open", () => {
    const { chip, onValueChange } = setup(5);

    chip.click();
    queryOptions()[1].click();
    queryOptions()[0].click();
    expect(onValueChange.mock.calls).toEqual([[7], [4]]);
    expect(queryOptions()).toHaveLength(3);
  });

  test("keeps the last allowed choice on", () => {
    const { chip, onValueChange } = setup(2);

    chip.click();
    queryOptions()[1].click();
    expect(queryOptions()[1].getAttribute("aria-disabled")).toBe("true");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
