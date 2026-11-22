import { TabList, TabListClass } from "@/core/ui/components/tabs/tab_list";
import { afterEach, describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { Signal } from "@/core/utils/reactive/signal";
import TAB_LIST_CSS from "@/core/ui/components/tabs/tab_list.css?inline";
import { expectClassesStyled } from "@/testing/css_utilities";

interface Setup {
  tablist: HTMLElement;
  tabs: HTMLButtonElement[];
  panel: HTMLElement;
  value: Signal<string>;
}

function setup(): Setup {
  const value = new Signal("search");
  const panel = document.createElement("div");
  const tablist = render(document, () => (
    <TabList
      label="Sections"
      controlChoices={[{ value: "search", label: "Search" }, { value: "browse", label: "Browse" }, { value: "grid", label: "Grid" }]}
      value={value}
      panel={panel}
      onValueChange={(selectedValue): void => {
        value.value = selectedValue;
      }}
    />
  )).result;

  document.body.append(tablist);
  return { tablist, tabs: [...tablist.querySelectorAll<HTMLButtonElement>("[role=tab]")], panel, value };
}

function readSelected(tabs: HTMLButtonElement[]): (string | null)[] {
  return tabs.map(tab => tab.getAttribute("aria-selected"));
}

function press(tab: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });

  tab.dispatchEvent(event);
  return event;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("TabList", () => {
  test("labels its tab list, makes the panel a tab panel and points each tab at it", () => {
    const { tablist, tabs, panel } = setup();

    expect([tablist.role, tablist.getAttribute("aria-label"), tabs.map(tab => tab.textContent)]).toEqual(["tablist", "Sections", ["Search", "Browse", "Grid"]]);
    expect([panel.getAttribute("role"), tabs.every(tab => tab.ariaControlsElements?.[0] === panel)]).toEqual(["tabpanel", true]);
  });

  test("selects a tab when it is clicked, and follows the value", () => {
    const { tabs, value } = setup();

    tabs[1].click();
    const clickedSelection = readSelected(tabs);

    value.value = "grid";
    expect([clickedSelection, readSelected(tabs)]).toEqual([["false", "true", "false"], ["false", "false", "true"]]);
  });

  test("names the panel after the selected tab", () => {
    const { tabs, panel } = setup();

    tabs[1].click();
    expect(panel.ariaLabelledByElements?.map(element => element.textContent)).toEqual(["Browse"]);
  });

  test("keeps one tab stop, on the selected tab", () => {
    const { tabs } = setup();

    tabs[2].click();
    expect(tabs.map(tab => tab.tabIndex)).toEqual([-1, -1, 0]);
  });

  test.each([
    ["ArrowRight", 0, 1],
    ["ArrowRight", 2, 0],
    ["ArrowLeft", 0, 2],
    ["Home", 2, 0],
    ["End", 0, 2]
  ])("moves focus and the selection on %s from tab %i to tab %i, claiming the key", (key, from, to) => {
    const { tabs, value } = setup();

    tabs[from].click();
    tabs[from].focus();
    const event = press(tabs[from], key);

    expect([document.activeElement === tabs[to], value.value, event.defaultPrevented]).toEqual([true, ["search", "browse", "grid"][to], true]);
  });

  test("leaves other keys alone", () => {
    const { tabs } = setup();

    expect(press(tabs[0], "Enter").defaultPrevented).toBe(false);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(TabListClass, TAB_LIST_CSS);
  });
});
