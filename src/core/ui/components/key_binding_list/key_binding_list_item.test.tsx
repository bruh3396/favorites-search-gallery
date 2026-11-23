import { KeyBindingListItem, KeyBindingListItemClass, KeyBindingListItemProps } from "@/core/ui/components/key_binding_list/key_binding_list_item";
import { describe, expect, test, vi } from "vitest";
import { h, render } from "@/core/ui/h/h";
import KEY_BINDING_LIST_ITEM_CSS from "@/core/ui/components/key_binding_list/key_binding_list_item.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

function renderItem(
  keys: Signal<readonly string[]>,
  { findKeyOwnerLabel = (): undefined => undefined, onKeyChange = vi.fn(), onKeyRemove = vi.fn() }: Partial<Omit<KeyBindingListItemProps, "keys">> = {}
): HTMLElement {
  const item = render(document, () => (
    <KeyBindingListItem
      label="Next Page"
      keys={keys}
      maxKeyCount={2}
      formatKey={key => key.toUpperCase()}
      findKeyOwnerLabel={findKeyOwnerLabel}
      onKeyChange={onKeyChange}
      onKeyRemove={onKeyRemove}
    />
  )).result;

  document.body.append(item);
  return item;
}

function readKeyLabels(item: HTMLElement): string[] {
  return [...item.querySelectorAll("kbd")].map(keyCap => keyCap.textContent);
}

function clickKey(item: HTMLElement, label: string): HTMLButtonElement {
  item.querySelector<HTMLButtonElement>(`button[aria-label="Change ${label}"]`)!.click();
  return document.activeElement as HTMLButtonElement;
}

function findButton(item: HTMLElement, label: string): HTMLButtonElement | undefined {
  return [...item.querySelectorAll("button")].find(button => (button.getAttribute("aria-label") ?? button.textContent) === label);
}

function clickAdd(item: HTMLElement): HTMLButtonElement {
  findButton(item, "Add Key")!.click();
  return document.activeElement as HTMLButtonElement;
}

function pressKey(target: HTMLElement, key: string, modifiers: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...modifiers });

  target.dispatchEvent(event);
  return event;
}

describe("KeyBindingListItem", () => {
  test("shows its label and each key, formatted", () => {
    const item = renderItem(new Signal<readonly string[]>(["d", "arrowright"]));

    expect(item.textContent).toContain("Next Page");
    expect(readKeyLabels(item)).toEqual(["D", "ARROWRIGHT"]);
  });

  test("shows a dash when no key is bound", () => {
    const item = renderItem(new Signal<readonly string[]>([]));

    expect([readKeyLabels(item), item.textContent]).toEqual([[], "Next Page–"]);
  });

  test("follows its keys as they change", () => {
    const keys = new Signal<readonly string[]>(["d"]);
    const item = renderItem(keys);

    keys.value = [];
    keys.value = ["a", "b"];
    expect(readKeyLabels(item)).toEqual(["A", "B"]);
  });

  test("waits for a key in place of a clicked key, focused", () => {
    const item = renderItem(new Signal<readonly string[]>(["d", "a"]));
    const capture = clickKey(item, "D");

    expect([capture.textContent, readKeyLabels(item)]).toEqual(["Press a key…", ["A"]]);
  });

  test("reports the pressed key with the index it replaces, then stops waiting", () => {
    const onKeyChange = vi.fn();
    const item = renderItem(new Signal<readonly string[]>(["d", "a"]), { onKeyChange });
    const event = pressKey(clickKey(item, "A"), "X", { shiftKey: true });

    expect([onKeyChange.mock.calls, event.defaultPrevented, readKeyLabels(item)]).toEqual([[[1, "x"]], true, ["D", "A"]]);
  });

  test.each([
    [
      "Escape", (capture: HTMLButtonElement): void => {
        pressKey(capture, "Escape");
      }
    ],
    ["leaving it", (capture: HTMLButtonElement): void => capture.blur()]
  ])("cancels on %s", (_, cancel) => {
    const onKeyChange = vi.fn();
    const item = renderItem(new Signal<readonly string[]>(["d"]), { onKeyChange });

    cancel(clickKey(item, "D"));
    expect([onKeyChange.mock.calls, readKeyLabels(item)]).toEqual([[], ["D"]]);
  });

  test("shows held modifiers, then reports the key pressed with them", () => {
    const onKeyChange = vi.fn();
    const item = renderItem(new Signal<readonly string[]>(["d"]), { onKeyChange });
    const capture = clickKey(item, "D");

    pressKey(capture, "Control", { ctrlKey: true });
    const heldText = capture.textContent;

    pressKey(capture, "K", { ctrlKey: true, shiftKey: true });
    expect([heldText, onKeyChange.mock.calls]).toEqual(["Ctrl+…", [[0, "Ctrl+k"]]]);
  });

  test.each([
    ["t", { ctrlKey: true }, "CTRL+T"],
    ["w", { metaKey: true }, "META+W"],
    ["ArrowLeft", { altKey: true }, "ALT+ARROWLEFT"],
    ["F5", {}, "F5"]
  ])("refuses %s with %o, which the browser uses, saying so, and keeps waiting", (key, modifiers, label) => {
    const onKeyChange = vi.fn();
    const item = renderItem(new Signal<readonly string[]>(["d"]), { onKeyChange });
    const capture = clickKey(item, "D");

    pressKey(capture, key, modifiers);
    const refusedState = [capture.textContent, item.textContent.includes(`${label} is used by the browser`)];

    pressKey(capture, "x");
    expect([refusedState, onKeyChange.mock.calls]).toEqual([[label, true], [[0, "x"]]]);
  });

  test.each([
    ["k", { ctrlKey: true }, "Ctrl+k"],
    ["t", { altKey: true }, "Alt+t"]
  ])("accepts %s with %o, which the browser leaves free", (key, modifiers, expectedKey) => {
    const onKeyChange = vi.fn();
    const item = renderItem(new Signal<readonly string[]>(["d"]), { onKeyChange });

    pressKey(clickKey(item, "D"), key, modifiers);
    expect(onKeyChange.mock.calls).toEqual([[0, expectedKey]]);
  });

  test("names the command that has a pressed key, offering to overwrite it in place of removing", () => {
    const onKeyChange = vi.fn();
    const item = renderItem(new Signal<readonly string[]>(["d"]), { onKeyChange, findKeyOwnerLabel: key => (key === "z" ? "Toggle Zen" : undefined) });
    const capture = clickKey(item, "D");

    pressKey(capture, "z");
    expect([capture.textContent, item.textContent.includes("Z is used by Toggle Zen"), onKeyChange.mock.calls, findButton(item, "Remove")])
      .toEqual(["Z", true, [], undefined]);
    findButton(item, "Overwrite")!.click();
    expect([onKeyChange.mock.calls, findButton(item, "Overwrite")]).toEqual([[[0, "z"]], undefined]);
  });

  test("cancels a conflict, keeping the key", () => {
    const onKeyChange = vi.fn();
    const item = renderItem(new Signal<readonly string[]>(["d"]), { onKeyChange, findKeyOwnerLabel: () => "Toggle Zen" });

    pressKey(clickKey(item, "D"), "z");
    findButton(item, "Cancel")!.click();
    expect([onKeyChange.mock.calls, readKeyLabels(item)]).toEqual([[], ["D"]]);
  });

  test("checks again when another key is pressed during a conflict", () => {
    const onKeyChange = vi.fn();
    const item = renderItem(new Signal<readonly string[]>(["d"]), { onKeyChange, findKeyOwnerLabel: key => (key === "z" ? "Toggle Zen" : undefined) });
    const capture = clickKey(item, "D");

    pressKey(capture, "z");
    pressKey(capture, "x");
    expect([onKeyChange.mock.calls, findButton(item, "Overwrite")]).toEqual([[[0, "x"]], undefined]);
  });

  test("clears held modifiers once released", () => {
    const item = renderItem(new Signal<readonly string[]>(["d"]));
    const capture = clickKey(item, "D");

    pressKey(capture, "Control", { ctrlKey: true });
    capture.dispatchEvent(new KeyboardEvent("keyup", { key: "Control", bubbles: true }));
    expect(capture.textContent).toBe("Press a key…");
  });

  test("lets Tab through", () => {
    const onKeyChange = vi.fn();
    const item = renderItem(new Signal<readonly string[]>(["d"]), { onKeyChange });
    const event = pressKey(clickKey(item, "D"), "Tab");

    expect([event.defaultPrevented, onKeyChange.mock.calls]).toEqual([false, []]);
  });

  test("reports a removed key by its index", () => {
    const onKeyRemove = vi.fn();
    const item = renderItem(new Signal<readonly string[]>(["d", "a"]), { onKeyRemove });

    clickKey(item, "A");
    findButton(item, "Remove")!.click();
    expect([onKeyRemove.mock.calls, findButton(item, "Remove")]).toEqual([[[1]], undefined]);
  });

  test("keeps waiting while focus moves to Remove", () => {
    const item = renderItem(new Signal<readonly string[]>(["d"]));

    clickKey(item, "D");
    findButton(item, "Remove")!.focus();
    expect(item.textContent).toContain("Press a key…");
  });

  test("waits for a new key after the last one, with nothing to remove", () => {
    const onKeyChange = vi.fn();
    const item = renderItem(new Signal<readonly string[]>(["d"]), { onKeyChange });
    const capture = clickAdd(item);
    const waitingState = [capture.textContent, readKeyLabels(item), findButton(item, "Remove")];

    pressKey(capture, "x");
    expect([waitingState, onKeyChange.mock.calls]).toEqual([["Press a key…", ["D"], undefined], [[1, "x"]]]);
  });

  test("adds a first key to an unbound command in place of its dash", () => {
    const item = renderItem(new Signal<readonly string[]>([]));

    clickAdd(item);
    expect(item.textContent).toBe("Next PagePress a key…");
  });

  test("offers no Add once at the most keys", () => {
    const keys = new Signal<readonly string[]>(["d"]);
    const item = renderItem(keys);
    const offersAddBelowMost = findButton(item, "Add Key")!.closest("[hidden]") === null;

    keys.value = ["d", "a"];
    expect([offersAddBelowMost, findButton(item, "Add Key")!.closest("[hidden]") === null]).toEqual([true, false]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(KeyBindingListItemClass, KEY_BINDING_LIST_ITEM_CSS);
  });
});
