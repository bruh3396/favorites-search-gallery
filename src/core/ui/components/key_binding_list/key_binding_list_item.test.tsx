import { KeyBindingListItem, KeyBindingListItemClass } from "@/core/ui/components/key_binding_list/key_binding_list_item";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import KEY_BINDING_LIST_ITEM_CSS from "@/core/ui/components/key_binding_list/key_binding_list_item.css?inline";
import { Signal } from "@/core/utils/reactive/signal";
import { expectClassesStyled } from "@/testing/css_utilities";

function renderItem(keys: Signal<readonly string[]>): HTMLElement {
  return render(document, () => <KeyBindingListItem label="Next Page" keys={keys} formatKey={key => key.toUpperCase()} />).result;
}

function readKeyLabels(item: HTMLElement): string[] {
  return [...item.querySelectorAll("kbd")].map(keyCap => keyCap.textContent);
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

  test("styles every class it sets", () => {
    expectClassesStyled(KeyBindingListItemClass, KEY_BINDING_LIST_ITEM_CSS);
  });
});
