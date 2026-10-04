import { Disclosure, DisclosureClass, DisclosureOptions, createDisclosure } from "@/core/ui/components/disclosure/disclosure";
import { describe, expect, test, vi } from "vitest";
import DISCLOSURE_CSS from "@/core/ui/components/disclosure/disclosure.css?inline";
import { expectClassesStyled } from "@/testing/css";

function setup(options: Partial<DisclosureOptions> = {}): Disclosure & {
  onValueChange: (next: boolean) => void;
  trigger: HTMLButtonElement;
  region: HTMLElement;
  content: HTMLElement;
} {
  const onValueChange = vi.fn();
  const content = document.createElement("p");
  const disclosure = createDisclosure(document, { title: "General", content, onValueChange, ...options });
  const [trigger, region] = disclosure.element.children as unknown as [HTMLButtonElement, HTMLElement];
  return { ...disclosure, onValueChange, trigger, region, content };
}

describe("createDisclosure", () => {
  test("is a titled button that controls its content, closed", () => {
    const { trigger, region, content } = setup();

    expect(trigger.type).toBe("button");
    expect(trigger.textContent).toBe("General");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.ariaControlsElements).toEqual([region]);
    expect(region.hidden).toBe(true);
    expect(region.contains(content)).toBe(true);
  });

  test("is medium unless told otherwise", () => {
    expect(setup().element.dataset.size).toBe("medium");
    expect(setup({ size: "small" }).element.dataset.size).toBe("small");
  });

  test("reports the flipped value on click without changing itself", () => {
    const { trigger, region, onValueChange } = setup();

    trigger.click();
    expect(onValueChange).toHaveBeenLastCalledWith(true);
    expect(region.hidden).toBe(true);
  });

  test("shows what it is told, and flips from it", () => {
    const { trigger, region, onValueChange, setValue } = setup();

    setValue(true);
    expect([trigger.getAttribute("aria-expanded"), region.hidden]).toEqual(["true", false]);
    trigger.click();
    expect(onValueChange).toHaveBeenLastCalledWith(false);
    setValue(false);
    expect([trigger.getAttribute("aria-expanded"), region.hidden]).toEqual(["false", true]);
  });

  test("ignores clicks while disabled", () => {
    const { trigger, onValueChange, setDisabled } = setup();

    setDisabled(true);
    trigger.click();
    expect(trigger.disabled).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(DisclosureClass, DISCLOSURE_CSS);
  });
});
