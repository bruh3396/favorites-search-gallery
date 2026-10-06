import { Disclosure, DisclosureClass, DisclosureProps } from "@/core/ui/components/disclosure/disclosure";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import DISCLOSURE_CSS from "@/core/ui/components/disclosure/disclosure.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  element: HTMLElement;
  dispose: () => void;
  value: Signal<boolean>;
  disabled: Signal<boolean>;
  onValueChange: (next: boolean) => void;
  trigger: HTMLButtonElement;
  region: HTMLElement;
  content: HTMLElement;
}

function setup(props: Partial<DisclosureProps> = {}): Setup {
  const value = new Signal(false);
  const disabled = new Signal(false);
  const onValueChange = vi.fn();
  const content = document.createElement("p");
  const { result: element, dispose } = render(document, () => (
    <Disclosure title="General" content={content} value={value} disabled={disabled} onValueChange={onValueChange} {...props} />
  ));
  const [trigger, region] = element.children as unknown as [HTMLButtonElement, HTMLElement];
  return { element, dispose, value, disabled, onValueChange, trigger, region, content };
}

describe("Disclosure", () => {
  test("is a titled button that controls its content, closed while its value is false", () => {
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

  test("follows its value, and flips from it", () => {
    const { trigger, region, value, onValueChange } = setup();

    value.value = true;
    expect([trigger.getAttribute("aria-expanded"), region.hidden]).toEqual(["true", false]);
    trigger.click();
    expect(onValueChange).toHaveBeenLastCalledWith(false);
    value.value = false;
    expect([trigger.getAttribute("aria-expanded"), region.hidden]).toEqual(["false", true]);
  });

  test("ignores clicks while disabled", () => {
    const { trigger, disabled, onValueChange } = setup();

    disabled.value = true;
    trigger.click();
    expect(trigger.disabled).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("stops following its value once disposed", () => {
    const { region, value, dispose } = setup();

    dispose();
    value.value = true;
    expect(region.hidden).toBe(true);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(DisclosureClass, DISCLOSURE_CSS);
  });
});
