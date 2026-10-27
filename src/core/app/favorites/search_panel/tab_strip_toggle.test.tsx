import { TabStripToggle, TabStripToggleClass } from "@/core/app/favorites/search_panel/tab_strip_toggle";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { Signal } from "@/core/utils/reactive/signal";
import { KeyedStoredValue } from "@/core/utils/stored_value/keyed_stored_value";
import TAB_STRIP_TOGGLE_CSS from "@/core/app/favorites/search_panel/tab_strip_toggle.css?inline";
import { expectClassesStyled } from "@/testing/css";

interface Setup {
  element: HTMLButtonElement;
  visible: StoredValue<boolean>;
  tabCount: Signal<number>;
}

function setup(): Setup {
  const visible = new KeyedStoredValue({ key: "tabStripVisible", defaultValue: true }, { storage: new MemoryLocalKeyedValues() });
  const tabCount = new Signal(1);
  const element = render(document, () => <TabStripToggle visible={visible} tabCount={tabCount} />).result as HTMLButtonElement;
  return { element, visible, tabCount };
}

describe("TabStripToggle", () => {
  test("toggles the tab strip and reports it as pressed while shown", () => {
    const { element, visible } = setup();
    const readState = (): [boolean, string | null] => [visible.value, element.getAttribute("aria-pressed")];
    const before = readState();

    element.click();
    const hidden = readState();

    element.click();
    expect([before, hidden, readState()]).toEqual([[true, "true"], [false, "false"], [true, "true"]]);
  });

  test("counts the open tabs only while the strip hides more than one", () => {
    const { element, visible, tabCount } = setup();
    const badge = element.querySelector<HTMLElement>(`.${TabStripToggleClass.badge}`)!;
    const readBadge = (): [boolean, string, string | null] => [badge.hidden, badge.textContent!, element.getAttribute("aria-label")];

    tabCount.value = 3;
    const shown = readBadge();

    visible.set(false);
    const hidden = readBadge();

    tabCount.value = 1;
    expect([shown, hidden, readBadge()]).toEqual([
      [true, "0", "Show tabs"],
      [false, "3", "Show tabs (3 open)"],
      [true, "1", "Show tabs"]
    ]);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(TabStripToggleClass, TAB_STRIP_TOGGLE_CSS);
  });
});
