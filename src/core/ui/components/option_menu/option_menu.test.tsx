import { Mock, describe, expect, onTestFinished, test, vi } from "vitest";
import { OptionMenu, OptionMenuClass } from "@/core/ui/components/option_menu/option_menu";
import { h, render } from "@/core/ui/h/h";
import OPTION_MENU_CSS from "@/core/ui/components/option_menu/option_menu.css?inline";
import { OptionMenuItem } from "@/core/ui/components/option_menu/option_menu_item";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  trigger: HTMLButtonElement;
  dispose: () => void;
}

function buildOptionMenuItem(partialOptionMenuItem: Partial<OptionMenuItem> = {}): OptionMenuItem {
  return { label: "Option", selected: new Signal(false), onChoose: vi.fn(), ...partialOptionMenuItem };
}

function setup(optionMenuItems: readonly OptionMenuItem[], onActiveChange?: (activeIndex: number | undefined) => void): Setup {
  const { result, dispose } = render(document, () => (
    <OptionMenu trigger={<button type="button" />} items={optionMenuItems} controlSize="small" onActiveChange={onActiveChange} />
  ));
  const container = document.createElement("div");

  container.append(result);
  document.body.append(container);
  onTestFinished(() => {
    dispose();
    container.remove();
    vi.restoreAllMocks();
  });
  return { trigger: result as HTMLButtonElement, dispose };
}

function queryMenu(): HTMLElement | null {
  return document.querySelector(`.${OptionMenuClass.root}`);
}

function queryOptions(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`.${OptionMenuClass.option}`)];
}

function press(trigger: HTMLElement, key: string): void {
  trigger.dispatchEvent(new KeyboardEvent("keydown", { key, cancelable: true }));
}

function pressOn(target: EventTarget): void {
  target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
}

describe("OptionMenu", () => {
  test("marks its trigger as a closed popup button", () => {
    const { trigger } = setup([buildOptionMenuItem()]);

    expect([trigger.getAttribute("aria-haspopup"), trigger.getAttribute("aria-expanded")]).toEqual(["listbox", "false"]);
    expect(queryMenu()).toBeNull();
  });

  test("toggles with clicks on its trigger", () => {
    const { trigger } = setup([buildOptionMenuItem()]);

    trigger.click();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    trigger.click();
    expect(queryMenu()).toBeNull();
  });

  test("marks every selected option and follows changes while open", () => {
    const selected = new Signal(false);
    const { trigger } = setup([
      buildOptionMenuItem({ selected: new Signal(true) }),
      buildOptionMenuItem({ selected }),
      buildOptionMenuItem({ selected: new Signal(true) })
    ]);

    trigger.click();
    selected.value = true;
    expect(queryOptions().map(option => option.getAttribute("aria-selected"))).toEqual(["true", "true", "true"]);
  });

  test("starts on the first selected option", () => {
    const onActiveChange = vi.fn();
    const { trigger } = setup([buildOptionMenuItem(), buildOptionMenuItem({ selected: new Signal(true) })], onActiveChange);

    trigger.click();
    expect(onActiveChange).toHaveBeenLastCalledWith(1);
  });

  test("starts on the first option when none is selected", () => {
    const onActiveChange = vi.fn();
    const { trigger } = setup([buildOptionMenuItem(), buildOptionMenuItem()], onActiveChange);

    trigger.click();
    expect(onActiveChange).toHaveBeenLastCalledWith(0);
  });

  test("chooses a clicked option and closes", () => {
    const onChoose: Mock<() => void> = vi.fn();
    const { trigger } = setup([buildOptionMenuItem({ onChoose })]);

    trigger.click();
    queryOptions()[0].click();
    expect(onChoose).toHaveBeenCalledOnce();
    expect(queryMenu()).toBeNull();
  });

  test("stays open after choosing an option that keeps it open", () => {
    const onChoose: Mock<() => void> = vi.fn();
    const { trigger } = setup([buildOptionMenuItem({ onChoose, keepsOpen: true })]);

    trigger.click();
    queryOptions()[0].click();
    expect(onChoose).toHaveBeenCalledOnce();
    expect(queryMenu()).not.toBeNull();
  });

  test("ignores a disabled option and stays open", () => {
    const onChoose: Mock<() => void> = vi.fn();
    const { trigger } = setup([buildOptionMenuItem({ onChoose, disabled: new Signal(true) })]);

    trigger.click();
    queryOptions()[0].click();
    expect(queryOptions()[0].getAttribute("aria-disabled")).toBe("true");
    expect(onChoose).not.toHaveBeenCalled();
    expect(queryMenu()).not.toBeNull();
  });

  test("follows an option becoming enabled", () => {
    const disabled = new Signal(true);
    const onChoose: Mock<() => void> = vi.fn();
    const { trigger } = setup([buildOptionMenuItem({ onChoose, disabled })]);

    trigger.click();
    disabled.value = false;
    queryOptions()[0].click();
    expect(onChoose).toHaveBeenCalledOnce();
  });

  test("marks the option that starts a group", () => {
    const { trigger } = setup([buildOptionMenuItem(), buildOptionMenuItem({ startsGroup: true })]);

    trigger.click();
    expect(queryOptions().map(option => option.dataset.startsGroup)).toEqual(["false", "true"]);
  });

  test("moves with the keys and chooses with Enter, staying open for an option that keeps it open", () => {
    const onChoose: Mock<() => void> = vi.fn();
    const { trigger } = setup([buildOptionMenuItem(), buildOptionMenuItem({ onChoose, keepsOpen: true })]);

    press(trigger, "ArrowDown");
    press(trigger, "End");
    expect(trigger.ariaActiveDescendantElement).toBe(queryOptions()[1]);
    press(trigger, "Enter");
    expect(onChoose).toHaveBeenCalledOnce();
    expect(queryMenu()).not.toBeNull();
  });

  test("places the menu below its trigger when it fits", () => {
    const { trigger } = setup([buildOptionMenuItem()]);

    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(new DOMRect(10, 20, 100, 30));
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(768);
    trigger.click();
    const { left, top, bottom, minInlineSize } = queryMenu()!.style;

    expect([left, top, bottom, minInlineSize]).toEqual(["10px", "54px", "", "100px"]);
  });

  test("places the menu above its trigger when there is more room there", () => {
    const { trigger } = setup([buildOptionMenuItem()]);

    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(new DOMRect(10, 700, 100, 30));
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(768);
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(200);
    trigger.click();
    const { top, bottom, maxBlockSize } = queryMenu()!.style;

    expect([top, bottom, maxBlockSize]).toEqual(["", "72px", "692px"]);
  });

  test("closes on a press outside", () => {
    const { trigger } = setup([buildOptionMenuItem()]);

    trigger.click();
    pressOn(document.body);
    expect(queryMenu()).toBeNull();
  });

  test("stays open on a press on its trigger or menu", () => {
    const { trigger } = setup([buildOptionMenuItem()]);

    trigger.click();
    pressOn(trigger);
    pressOn(queryMenu()!);
    expect(queryMenu()).not.toBeNull();
  });

  test("closes when disposed", () => {
    const { trigger, dispose } = setup([buildOptionMenuItem()]);

    trigger.click();
    dispose();
    expect(queryMenu()).toBeNull();
  });

  test("styles every class it sets", () => {
    expectClassesStyled(OptionMenuClass, OPTION_MENU_CSS);
  });
});
